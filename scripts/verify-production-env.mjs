import fs from "node:fs";

const file = process.argv[2] ?? ".env.production";
const templateMode = process.argv.includes("--template");
const fail = (message) => {
  throw new Error(`Production environment invalid: ${message}`);
};
if (!fs.existsSync(file)) fail(`${file} not found`);

const entries = {};
for (const [index, raw] of fs.readFileSync(file, "utf8").split(/\r?\n/).entries()) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const separator = line.indexOf("=");
  if (separator < 1) fail(`${file}:${index + 1} is not KEY=VALUE`);
  const key = line.slice(0, separator).trim();
  let value = line.slice(separator + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  )
    value = value.slice(1, -1);
  if (Object.hasOwn(entries, key)) fail(`duplicate key ${key}`);
  entries[key] = value;
}

const required = [
  "NODE_ENV",
  "DATABASE_URL",
  "API_URL",
  "NEXT_PUBLIC_API_URL",
  "WEB_ORIGIN",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "REFRESH_TOKEN_PEPPER",
  "ENCRYPTION_KEY",
  "BACKUP_ENCRYPTION_KEY",
  "CRON_SECRET",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
  "REDIS_PASSWORD",
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_REGION",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "EMAIL_API_URL",
  "EMAIL_API_TOKEN",
  "EMAIL_CLINICAL_TO",
  "WHATSAPP_API_URL",
  "WHATSAPP_TOKEN",
  "WHATSAPP_EMERGENCY_TO",
  "MIDTRANS_SERVER_KEY",
  "MIDTRANS_PRODUCTION",
  "NEXT_PUBLIC_MEDICAL_TEAM_PHONE",
  "NEXT_PUBLIC_HOSPITAL_PHONE",
  "NEXT_PUBLIC_AMBULANCE_PHONE",
  "NEXT_PUBLIC_CONTACT_ADDRESS",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "NEXT_PUBLIC_CONTACT_PHONE",
  "NEXT_PUBLIC_WHATSAPP_URL",
  "NEXT_PUBLIC_MAP_URL",
  "NEXT_PUBLIC_COMPLAINT_EMAIL",
  "APP_VERSION",
  "GIT_SHA",
];
for (const key of required)
  if (!Object.hasOwn(entries, key)) fail(`missing key ${key}`);
if (templateMode) {
  console.log(JSON.stringify({ template: file, requiredKeys: required.length }));
  process.exit(0);
}

for (const key of required)
  if (!entries[key]) fail(`${key} is empty`);
const serialized = Object.values(entries).join("\n");
if (/replace[_ -]?me|change[_ -]?me|your-domain|example\.(com|local)/i.test(serialized))
  fail("placeholder value remains");
if (entries.NODE_ENV !== "production") fail("NODE_ENV must be production");
if (entries.MIDTRANS_PRODUCTION !== "true")
  fail("MIDTRANS_PRODUCTION must be true");

for (const key of [
  "API_URL",
  "NEXT_PUBLIC_API_URL",
  "WEB_ORIGIN",
  "S3_ENDPOINT",
  "EMAIL_API_URL",
  "WHATSAPP_API_URL",
  "NEXT_PUBLIC_WHATSAPP_URL",
  "NEXT_PUBLIC_MAP_URL",
])
  if (!entries[key].startsWith("https://")) fail(`${key} must use HTTPS`);
if (entries.WEB_ORIGIN.endsWith("/")) fail("WEB_ORIGIN must not end with /");
if (/localhost|127\.0\.0\.1/i.test(entries.API_URL + entries.WEB_ORIGIN))
  fail("public URLs must not use localhost");

const secrets = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "REFRESH_TOKEN_PEPPER",
  "ENCRYPTION_KEY",
  "BACKUP_ENCRYPTION_KEY",
  "CRON_SECRET",
  "POSTGRES_PASSWORD",
  "REDIS_PASSWORD",
];
for (const key of secrets)
  if (entries[key].length < 32) fail(`${key} must be at least 32 characters`);
if (new Set(secrets.map((key) => entries[key])).size !== secrets.length)
  fail("security secrets must be unique");

const e164 = /^\+[1-9]\d{7,14}$/;
for (const key of [
  "WHATSAPP_EMERGENCY_TO",
  "NEXT_PUBLIC_MEDICAL_TEAM_PHONE",
  "NEXT_PUBLIC_HOSPITAL_PHONE",
  "NEXT_PUBLIC_AMBULANCE_PHONE",
  "NEXT_PUBLIC_CONTACT_PHONE",
])
  if (!e164.test(entries[key])) fail(`${key} must use E.164 format`);
for (const key of [
  "EMAIL_CLINICAL_TO",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "NEXT_PUBLIC_COMPLAINT_EMAIL",
])
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entries[key]))
    fail(`${key} is not a valid email`);

console.log(
  JSON.stringify({
    environment: file,
    requiredKeys: required.length,
    https: "pass",
    emergencyContacts: "pass",
    secretStrength: "pass",
  }),
);