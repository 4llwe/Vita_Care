const weak = /^(change_me|secret|password|please_use|dev_|test)/i;
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Konfigurasi wajib belum diisi: ${name}`);
  return value;
}
function strongSecret(name: string): string {
  const value = required(name);
  if (value.length < 32 || weak.test(value))
    throw new Error(`${name} harus berupa secret acak minimal 32 karakter`);
  return value;
}
export function validateEnvironment() {
  required("DATABASE_URL");
  strongSecret("JWT_ACCESS_SECRET");
  strongSecret("JWT_REFRESH_SECRET");
  strongSecret("ENCRYPTION_KEY");
  const port = Number(process.env.API_PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("API_PORT tidak valid");
  if (process.env.NODE_ENV !== "production") return;
  const webOrigin = required("WEB_ORIGIN");
  if (webOrigin.split(",").some((x) => !x.trim().startsWith("https://")))
    throw new Error("WEB_ORIGIN produksi wajib HTTPS");
  const apiUrl = required("API_URL");
  if (!apiUrl.startsWith("https://")) throw new Error("API_URL produksi wajib HTTPS");
  for (const key of [
    "S3_BUCKET",
    "S3_REGION",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "MIDTRANS_SERVER_KEY",
    "WHATSAPP_API_URL",
    "WHATSAPP_TOKEN",
    "WHATSAPP_EMERGENCY_TO",
    "EMAIL_API_URL",
    "EMAIL_API_TOKEN",
    "EMAIL_CLINICAL_TO",
    "REDIS_PASSWORD",
    "BACKUP_ENCRYPTION_KEY",
  ])
    required(key);
  if ((process.env.S3_SECRET_KEY ?? "").length < 16)
    throw new Error("S3_SECRET_KEY terlalu pendek");
  if ((process.env.BACKUP_ENCRYPTION_KEY ?? "").length < 32)
    throw new Error("BACKUP_ENCRYPTION_KEY terlalu pendek");
  for (const key of ["WHATSAPP_API_URL", "EMAIL_API_URL"])
    if (!(process.env[key] ?? "").startsWith("https://"))
      throw new Error(`${key} produksi wajib HTTPS`);
}
