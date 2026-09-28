import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
function context(user: unknown) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}
describe("RolesGuard multi-role authorization", () => {
  it("accepts an assigned role that is not primary", () => {
    const reflector = { getAllAndOverride: jest.fn(() => ["FINANCE"]) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context({
      id: "user-1", role: "PATIENT", roles: ["PATIENT", "FINANCE"],
    }))).toBe(true);
  });
  it("rejects a missing effective role", () => {
    const reflector = { getAllAndOverride: jest.fn(() => ["DOCTOR"]) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context({
      id: "user-1", role: "NURSE", roles: ["NURSE"],
    }))).toBe(false);
  });
});