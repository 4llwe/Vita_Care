import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const fail = (message) => {
  throw new Error(`Clinical acceptance failed: ${message}`);
};
const requireText = (content, values, source) => {
  for (const value of values)
    if (!content.includes(value)) fail(`${source} is missing ${value}`);
};

const publicMenu = read("apps/web/lib/public-menu.ts");
const groupKeys = [...publicMenu.matchAll(/^\s{4}key: "([^"]+)",$/gm)].map(
  (match) => match[1],
);
const submenu = [...publicMenu.matchAll(/^\s{6}"(.+)",$/gm)].map(
  (match) => match[1],
);
const requiredGroups = [
  "beranda",
  "tentang-kami",
  "layanan",
  "tim-kesehatan",
  "pasien",
  "keluarga-caregiver",
  "monitoring-pasien",
  "pemesanan",
  "farmasi-obat",
  "pembayaran",
  "edukasi-kesehatan",
  "mitra",
  "informasi",
  "kontak",
];
if (groupKeys.length !== 14) fail(`expected 14 public groups, found ${groupKeys.length}`);
if (submenu.length !== 117) fail(`expected 117 submenu entries, found ${submenu.length}`);
for (const group of requiredGroups)
  if (!groupKeys.includes(group)) fail(`missing public group ${group}`);

const sidebar = read("apps/web/components/sidebar.tsx");
const roleLabels = {
  admin: [
    "Manajemen Pasien",
    "Tenaga Kesehatan & Layanan",
    "Pembayaran",
    "Manajemen Pengguna",
    "Pengaturan Sistem",
  ],
  doctor: [
    "Daftar Pasien",
    "Monitoring Pasien",
    "Rekam Medis",
    "Rencana Terapi",
    "Resep",
    "Hasil Laboratorium",
    "Telekonsultasi",
    "Rujukan",
  ],
  nurse: [
    "Papan Tugas",
    "Asesmen Keperawatan",
    "Tanda Vital",
    "Rencana Asuhan",
    "Pemberian Obat",
    "Perawatan Luka",
    "Eskalasi Klinis",
  ],
  patient: [
    "Dashboard Pasien",
    "Jadwal Kunjungan",
    "Rencana Perawatan",
    "Rekam Medis",
    "Monitoring Kondisi",
    "Tagihan",
  ],
  caregiver: [
    "Dashboard Keluarga",
    "Jadwal Perawatan",
    "Instruksi Perawatan",
    "Edukasi Caregiver",
    "Komunikasi Tim",
  ],
};
for (const [role, labels] of Object.entries(roleLabels))
  requireText(sidebar, labels.map((label) => `"${label}"`), `sidebar ${role}`);

const internalHrefs = [
  ...sidebar.matchAll(/\["(\/[^"]+)",\s*"[^"]+"\]/g),
  ...read("apps/web/components/mobile-nav.tsx").matchAll(
    /\["(\/[^"]+)",\s*"[^"]+"\]/g,
  ),
].map((match) => match[1].split("?")[0]);
for (const href of new Set(internalHrefs)) {
  const path = href.replace(/^\//, "");
  const exact = `apps/web/app/(dashboard)/${path}/page.tsx`;
  const workspace = href.startsWith("/workspace/");
  if (!fs.existsSync(exact) && !workspace)
    fail(`navigation target has no page: ${href}`);
}

const emergency = read("apps/web/components/emergency-button.tsx");
requireText(
  emergency,
  [
    "Hubungi Tim Medis",
    "Hubungi Rumah Sakit",
    "Panggil Ambulans",
    "Lokasi pasien",
    "Ringkasan medis",
    "Kontak keluarga",
    "Jika pasien mengalami kondisi yang mengancam nyawa",
  ],
  "emergency workflow",
);
requireText(
  read("apps/web/components/mobile-nav.tsx"),
  ["md:hidden", "<EmergencyButton compact />"],
  "mobile navigation",
);
requireText(
  read("apps/web/app/(dashboard)/layout.tsx"),
  ["<MobileNav />", "<EmergencyButton />"],
  "dashboard layout",
);

const schema = read("prisma/schema.prisma");
const clinicalModels = [
  "HaHPatient",
  "HaHEpisode",
  "HaHCarePlan",
  "HaHObservation",
  "ClinicalAlert",
  "HaHVisit",
  "MedicationOrder",
  "HaHDiagnosticOrder",
  "HaHTransfer",
  "HaHTeleconsultation",
  "HaHDischargeChecklist",
  "HaHPostDischargeFollowUp",
  "HaHClinicalMessage",
  "HaHClinicalMessageReceipt",
  "HaHAllergy",
  "HaHMedicationReconciliation",
  "HaHSafetyIncident",
];
for (const model of clinicalModels)
  if (!schema.includes(`model ${model} {`)) fail(`missing clinical model ${model}`);

const hahController = read("apps/api/src/modules/hah/hah.controller.ts");
requireText(
  hahController,
  [
    'episodes/:id/observations',
    'episodes/:id/emergency-events',
    'episodes/:id/transfer',
    'episodes/:id/discharge',
    'episodes/:id/post-discharge-followups',
    'episodes/:id/safety-incidents',
    'episodes/:id/messages',
    'episodes/:id/medication-reconciliations',
  ],
  "Hospital at Home API",
);

const vercel = JSON.parse(read("vercel.json"));
if (!vercel.functions?.["api/[...path].ts"])
  fail("Vercel API catch-all function is missing");
const cronSchedules = new Map(
  (vercel.crons ?? []).map((cron) => [cron.path, cron.schedule]),
);
const expectedCronSchedules = new Map([
  ["/api/cron/clinical-minute", "0 1 * * *"],
  ["/api/cron/capa-daily", "0 0 * * *"],
]);
for (const [path, schedule] of expectedCronSchedules) {
  if (cronSchedules.get(path) !== schedule)
    fail(`Vercel cron ${path} must use ${schedule} for the Hobby deployment`);
}
requireText(
  read(
    "apps/api/src/modules/serverless-cron/serverless-cron.controller.ts",
  ),
  ["timingSafeEqual", "CRON_SECRET", "processMedicationSchedules", "runDailyReminders"],
  "Vercel serverless cron",
);

console.log(
  JSON.stringify({
    publicNavigation: { groups: groupKeys.length, submenu: submenu.length },
    roleNavigation: Object.keys(roleLabels).length,
    internalTargets: new Set(internalHrefs).size,
    emergencyWorkflow: "pass",
    clinicalModels: clinicalModels.length,
    clinicalApi: "pass",
    vercelServerless: "pass",
  }),
);