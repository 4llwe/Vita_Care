import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "../../../../components/public-header";
import { PublicFooter } from "../../../../components/public-footer";
import { ContactDetails } from "../../../../components/contact-details";
import { OperationalActionPanel } from "../../../../components/operational-action-panel";
import { menuOperation, operationFromItem } from "../../../../lib/menu-operation";
import { api } from "../../../../lib/api";
import { findPublicItem } from "../../../../lib/public-menu";

const accessSections = new Set([
  "pasien",
  "keluarga-caregiver",
  "monitoring-pasien",
  "pemesanan",
  "farmasi-obat",
  "pembayaran",
]);
const sectionGuides: Record<string, string[]> = {
  "tentang-kami": [
    "Profil dan tata kelola penyelenggara",
    "Standar mutu dan keselamatan",
    "Jejaring fasilitas rujukan",
  ],
  layanan: [
    "Indikasi dan cakupan layanan",
    "Asesmen kelayakan pasien",
    "Jadwal, biaya, dan tindak lanjut",
  ],
  "tim-kesehatan": [
    "Kredensial dan izin praktik",
    "Penugasan berdasarkan kebutuhan pasien",
    "Kolaborasi multidisiplin",
  ],
  "edukasi-kesehatan": [
    "Materi ditinjau tenaga kesehatan",
    "Instruksi praktis untuk pasien dan caregiver",
    "Tanda bahaya dan kapan mencari bantuan",
  ],
  mitra: [
    "Ruang lingkup kerja sama",
    "Koordinasi rujukan dan diagnostik",
    "Perlindungan data dan mutu layanan",
  ],
  informasi: [
    "Informasi terverifikasi",
    "Tanggal publikasi dan pembaruan",
    "Kanal tindak lanjut resmi",
  ],
  kontak: [
    "Kanal komunikasi resmi",
    "Jam operasional dan SLA respons",
    "Eskalasi kritik atau pengaduan",
  ],
};
function actionFor(section: string, slug: string) {
  if (slug === "whatsapp")
    return {
      href: process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "/informasi/kontak/hubungi-kami",
      label: "Buka WhatsApp",
    };
  if (slug === "email")
    return {
      href: `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "vitacare87@gmail.com"}`,
      label: "Kirim email",
    };
  if (slug === "lokasi")
    return {
      href: process.env.NEXT_PUBLIC_MAP_URL ?? "/informasi/kontak/hubungi-kami",
      label: "Buka lokasi",
    };
  if (slug.includes("pengaduan") || slug.includes("kritik"))
    return {
      href: `mailto:${process.env.NEXT_PUBLIC_COMPLAINT_EMAIL ?? process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "vitacare87@gmail.com"}`,
      label: "Kirim laporan",
    };
  if (accessSections.has(section))
    return { href: "/login", label: "Masuk ke layanan aman" };
  return { href: "/direktori", label: "Jelajahi direktori" };
}
export default async function InfoPage({
  params,
}: {
  params: { section: string; slug: string };
}) {
  const fallback = findPublicItem(params.section, params.slug);
  const remote = await api<any>(`/menus/${params.section}/${params.slug}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!remote && !fallback) notFound();
  const group = remote?.group ?? fallback!.group;
  const itemRecord = remote?.item ?? { label: fallback!.item };
  const item = itemRecord.label;
  const action = actionFor(group.key, params.slug);
  const operation = operationFromItem(itemRecord, group.key, params.slug);
  const guides = sectionGuides[group.key] ?? [
    "Informasi layanan",
    "Alur dan persyaratan",
    "Kanal tindak lanjut",
  ];
  return (
    <>
      <PublicHeader />
      <main className="min-h-[65vh] bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
          <nav className="text-sm font-semibold text-slate-500">
            <Link href="/">Beranda</Link> /{" "}
            <Link href={`/direktori#${group.key}`}>{group.label}</Link> /{" "}
            <span className="text-slate-800">{item}</span>
          </nav>
          <article className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="eyebrow">{group.label}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {item}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {accessSections.has(group.key)
                ? `${item} tersedia di ruang layanan yang dilindungi. Setelah masuk, sistem hanya menampilkan data sesuai identitas, penugasan, dan hak akses pengguna.`
                : `${item} merupakan bagian dari layanan Hospital at Home yang mengutamakan keselamatan pasien, koordinasi klinis, transparansi, dan pengalaman pasien.`}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {guides.map((x, i) => (
                <section key={x} className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-xs font-black text-teal-700">0{i + 1}</span>
                  <h2 className="mt-3 font-extrabold text-slate-900">{x}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Informasi operasional mengikuti protokol penyelenggara, persetujuan
                    pasien, dan kebijakan privasi.
                  </p>
                </section>
              ))}
            </div>
            <OperationalActionPanel
              section={group.key}
              slug={params.slug}
              operation={operation}
            />
          </article>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
