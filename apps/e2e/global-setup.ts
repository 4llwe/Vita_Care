import { request } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const authStatePath = join(tmpdir(), "vitacare-e2e-auth.json");
export const testTotpSecret = "JBSWY3DPEHPK3PXP";

export default async function globalSetup() {
  const apiUrl = process.env.E2E_API_URL ?? "http://localhost:3001";
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("E2E admin credentials are required");

  const isolatedEmail = process.env.E2E_AUTH_EMAIL ?? "ci-auth-isolated@vitacare.invalid";
  const prisma = new PrismaClient();
  const primary = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.user.upsert({
    where: { email: isolatedEmail },
    update: { name: "CI Isolated Auth", passwordHash: primary.passwordHash, role: Role.SUPER_ADMIN, isActive: true },
    create: {
      email: isolatedEmail,
      name: "CI Isolated Auth",
      passwordHash: primary.passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  const twoFaEmail = process.env.E2E_2FA_EMAIL ?? "ci-2fa@vitacare.invalid";
  const twoFaUser = await prisma.user.upsert({
    where: { email: twoFaEmail },
    update: {
      name: "CI 2FA Auth",
      passwordHash: primary.passwordHash,
      role: Role.SUPER_ADMIN,
      twoFaSecret: testTotpSecret,
      isActive: true,
    },
    create: {
      email: twoFaEmail,
      name: "CI 2FA Auth",
      passwordHash: primary.passwordHash,
      role: Role.SUPER_ADMIN,
      twoFaSecret: testTotpSecret,
    },
  });
  await prisma.authSession.deleteMany({ where: { userId: twoFaUser.id } });
  await prisma.$disconnect();

  const context = await request.newContext({ baseURL: apiUrl });
  const response = await context.post("/api/auth/login", { data: { email, password } });
  if (!response.ok()) throw new Error(`Global E2E login failed: ${response.status()}`);
  await context.storageState({ path: authStatePath });
  await context.dispose();
}
