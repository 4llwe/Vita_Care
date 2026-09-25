import { AuthService } from "./auth.service";
import { createRefreshToken } from "./auth-token";

function makeService() {
  process.env.REFRESH_TOKEN_PEPPER = "test-refresh-token-pepper-01234567890123456789";
  const material = createRefreshToken();
  const state: any = {
    id: "refresh-1",
    sessionId: "session-1",
    tokenIdHash: material.tokenIdHash,
    secretHash: material.secretHash,
    expiresAt: new Date(Date.now() + 60_000),
    rotatedAt: null,
    revokedAt: null,
    session: {
      id: "session-1",
      userId: "user-1",
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      user: { id: "user-1", role: "PATIENT", isActive: true },
    },
  };
  const tx: any = {
    refreshToken: {
      findUnique: jest.fn(async () => (state.rotatedAt ? { ...state } : { ...state })),
      create: jest.fn(async ({ data }) => ({ id: "refresh-2", ...data })),
      update: jest.fn(async ({ data }) => Object.assign(state, data)),
      updateMany: jest.fn(async ({ data }) => Object.assign(state, data)),
    },
    authSession: {
      update: jest.fn(async ({ data }) => Object.assign(state.session, data)),
      updateMany: jest.fn(),
      findUnique: jest.fn(async () => state.session),
    },
    authSecurityEvent: { create: jest.fn(async () => ({ id: "event-1" })) },
    $queryRaw: jest.fn(async () => []),
  };
  let transactionChain = Promise.resolve();
  const prisma: any = {
    $transaction: (callback: (client: any) => Promise<unknown>) => {
      const result = transactionChain.then(() => callback(tx));
      transactionChain = result.then(() => undefined, () => undefined);
      return result;
    },
    user: {
      findUnique: jest.fn(async () => ({ id: "user-1", role: "PATIENT", isActive: true })),
    },
  };
  const jwt: any = { signAsync: jest.fn(async (payload) => JSON.stringify(payload)) };
  return { service: new AuthService(prisma, jwt), material, state, tx, prisma, jwt };
}

describe("AuthService persistent refresh sessions", () => {
  it("rotates a token and puts the session id in the access token", async () => {
    const { service, material, state, jwt, tx } = makeService();
    const result = await service.refresh(material.value);

    expect(result.refreshToken).not.toBe(material.value);
    expect(state.rotatedAt).toBeInstanceOf(Date);
    expect(tx.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: "user-1", role: "PATIENT", sid: "session-1", typ: "access" },
      expect.any(Object),
    );
  });

  it("revokes the complete family when a rotated token is reused", async () => {
    const { service, material, state, tx } = makeService();
    await service.refresh(material.value);

    await expect(service.refresh(material.value)).rejects.toThrow("Sesi tidak valid");
    expect(state.session.revokedReason).toBe("REFRESH_TOKEN_REUSE");
    expect(state.revokeReason).toBe("REFRESH_TOKEN_REUSE");
    expect(tx.authSecurityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: "SESSION_REUSE_DETECTED" }) }),
    );
  });

  it("allows only one concurrent use of a refresh token", async () => {
    const { service, material, state } = makeService();
    const results = await Promise.allSettled([
      service.refresh(material.value),
      service.refresh(material.value),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(state.session.revokedReason).toBe("REFRESH_TOKEN_REUSE");
  });
});
