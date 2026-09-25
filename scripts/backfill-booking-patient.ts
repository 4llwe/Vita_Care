import { PrismaClient, Role } from "@prisma/client";
import { readFile } from "node:fs/promises";

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const mappingArg = process.argv.find((x) => x.startsWith("--mapping="));
const mappingPath = mappingArg?.slice("--mapping=".length);
const apply = args.has("--apply");
const actorId = process.env.BACKFILL_ACTOR_ID?.trim();

type Mapping = { bookingId: string; patientUserId: string };

function parseCsv(input: string): Mapping[] {
  const lines = input.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (lines.shift()?.toLowerCase() !== "bookingid,patientuserid") {
    throw new Error("Header mapping wajib: bookingId,patientUserId");
  }
  const seen = new Set<string>();
  return lines.map((line, index) => {
    const [bookingId, patientUserId, extra] = line.split(",").map((x) => x.trim());
    if (!bookingId || !patientUserId || extra) throw new Error(`Baris ${index + 2} tidak valid`);
    if (seen.has(bookingId)) throw new Error(`Booking duplikat pada mapping: ${bookingId}`);
    seen.add(bookingId);
    return { bookingId, patientUserId };
  });
}

async function main() {
  if (!mappingPath) throw new Error("Gunakan --mapping=<path.csv>");
  if (apply && !actorId) throw new Error("BACKFILL_ACTOR_ID wajib untuk mode --apply");
  const mappings = parseCsv(await readFile(mappingPath, "utf8"));
  let eligible = 0;
  for (const row of mappings) {
    const [booking, patient] = await Promise.all([
      prisma.booking.findUnique({ where: { id: row.bookingId }, select: { id: true, patientUserId: true } }),
      prisma.user.findUnique({ where: { id: row.patientUserId }, select: { id: true, role: true, isActive: true } }),
    ]);
    if (!booking) throw new Error(`Booking tidak ditemukan: ${row.bookingId}`);
    if (!patient?.isActive || patient.role !== Role.PATIENT) throw new Error(`Akun pasien tidak valid: ${row.patientUserId}`);
    if (booking.patientUserId && booking.patientUserId !== patient.id) throw new Error(`Booking sudah dimiliki akun lain: ${row.bookingId}`);
    if (booking.patientUserId === patient.id) continue;
    eligible++;
    if (apply) {
      await prisma.$transaction([
        prisma.booking.update({ where: { id: booking.id }, data: { patientUserId: patient.id } }),
        prisma.auditLog.create({ data: { actorId: actorId!, action: "PATIENT_OWNERSHIP_BACKFILLED", entity: "Booking", entityId: booking.id, after: { patientUserId: patient.id } } }),
      ]);
    }
  }
  console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY_RUN", mappings: mappings.length, eligible, unchanged: mappings.length - eligible }));
}

main().finally(() => prisma.$disconnect());
