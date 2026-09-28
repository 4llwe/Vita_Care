import {
  createRefreshToken,
  hashRefreshPart,
  hashesMatch,
  parseRefreshToken,
} from "./auth-token";

describe("refresh token primitives", () => {
  beforeEach(() => {
    process.env.REFRESH_TOKEN_PEPPER = "test-refresh-token-pepper-01234567890123456789";
  });

  it("creates opaque material and stores only derived hashes", () => {
    const token = createRefreshToken();
    const parsed = parseRefreshToken(token.value);

    expect(parsed).not.toBeNull();
    expect(token.value).not.toContain(token.tokenIdHash);
    expect(token.value).not.toContain(token.secretHash);
    expect(token.tokenIdHash).toHaveLength(64);
    expect(token.secretHash).toHaveLength(64);
  });

  it("rejects malformed and oversized values", () => {
    expect(parseRefreshToken("legacy.jwt.token")).toBeNull();
    expect(parseRefreshToken("x".repeat(513))).toBeNull();
    expect(parseRefreshToken(".")).toBeNull();
  });

  it("uses the configured pepper and compares hashes safely", () => {
    const hash = hashRefreshPart("secret");
    expect(hashesMatch(hash, hashRefreshPart("secret"))).toBe(true);
    expect(hashesMatch(hash, hashRefreshPart("different"))).toBe(false);

    process.env.REFRESH_TOKEN_PEPPER = "another-test-refresh-token-pepper-0123456789";
    expect(hashRefreshPart("secret")).not.toBe(hash);
  });
});
