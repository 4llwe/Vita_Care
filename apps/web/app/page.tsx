import Link from "next/link";
import { PublicHeader } from "../components/public-header";
import { PublicFooter } from "../components/public-footer";
const services = [
  "Konsultasi kebutuhan pelayanan di rumah",
  "Kunjungan tenaga kesehatan terjadwal",
  "Pemantauan dan dokumentasi pelayanan",
  "Koordinasi tindak lanjut pasien",
];
export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main className="bg-white">
        <section className="relative overflow-hidden border-b bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(13,148,136,.34),transparent_35%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-28">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-teal-300">
                Hospital-level care at home
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
                Pelayanan kesehatan di rumah yang terkoordinasi dan berpusat pada pasien.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Vita Care menghubungkan pasien, keluarga, dokter, perawat,
                laboratorium, farmasi, dan rumah sakit dalam satu clinical
                workflow yang dapat diaudit.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-teal-500 px-6 py-3 font-extrabold text-slate-950"
                >
                  Masuk ke platform
                </Link>
                <Link
                  href="/direktori#layanan"
                  className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white"
                >
                  Jelajahi layanan
                </Link>
              </div>
            </div>
            <div className="self-end rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm font-bold text-teal-300">
                Alur keselamatan klinis
              </p>
              <ol className="mt-5 space-y-4">
                {[
                  "Screening & eligibility",
                  "Admission & individual care plan",
                  "Monitoring & multidisciplinary visits",
                  "Escalation, transfer, or discharge",
                ].map((x, i) => (
                  <li key={x} className="flex gap-4 text-white">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-500 font-black text-slate-950">
                      {i + 1}
                    </span>
                    <span className="pt-1 font-semibold">{x}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="eyebrow">Ringkasan Hospital at Home</p>
            <h2 className="section-title">
              Clinical workflow lengkap, bukan sekadar kunjungan rumah.
            </h2>
            <p className="section-copy">
              Episode akut dikelola dari asesmen hingga discharge dengan
              observasi, obat, diagnostik, peralatan, alert, dan rujukan yang
              terhubung.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {services.map((x, i) => (
              <article key={x} className="medical-card">
                <span className="text-xs font-black text-teal-700">
                  0{i + 1}
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-slate-950">
                  {x}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Terintegrasi dengan dokumentasi klinis, hak akses, dan audit
                  trail.
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <p className="eyebrow">Keunggulan layanan</p>
            <div className="mt-7 grid gap-5 lg:grid-cols-3">
              {[
                [
                  "Patient safety",
                  "Eligibility, early warning, clinical alert, dan jalur transfer terstruktur.",
                ],
                [
                  "Care coordination",
                  "Satu episode menghubungkan tim multidisiplin, farmasi, diagnostik, dan keluarga.",
                ],
                [
                  "Privacy by design",
                  "Akses berbasis role, autentikasi, audit mutasi, dan konfigurasi produksi fail-closed.",
                ],
              ].map(([a, b]) => (
                <div key={a} className="medical-card">
                  <h3 className="text-xl font-black">{a}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Statistik & mutu layanan</p>
              <h2 className="section-title">
                Indikator operasional ditampilkan dari data terverifikasi.
              </h2>
              <p className="section-copy">
                Dashboard internal menyajikan episode aktif, response time
                alert, kepatuhan monitoring, hasil diagnostik, dan aktivitas
                discharge tanpa membuat klaim publik yang tidak terverifikasi.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Admin", "Konfigurasi layanan"],
                ["Scoped", "Akses sesuai kewenangan"],
                ["Audit", "Aktivitas sensitif tercatat"],
                ["Terpadu", "Permintaan–tindak lanjut"],
              ].map(([a, b]) => (
                <div
                  key={b}
                  className="rounded-2xl bg-slate-950 p-5 text-white"
                >
                  <div className="text-2xl font-black text-teal-300">{a}</div>
                  <div className="mt-2 text-sm text-slate-300">{b}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-teal-700">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-14 text-white lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-teal-100">
                Patient experience
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Akses perawatan yang jelas bagi pasien dan keluarga.
              </h2>
              <p className="mt-3 max-w-2xl text-teal-50">
                Testimoni hanya ditampilkan setelah persetujuan dan verifikasi
                untuk menjaga privasi. Pengalaman pasien dikumpulkan melalui
                kanal kritik, saran, dan pengaduan.
              </p>
            </div>
            <Link
              href="/direktori#kontak"
              className="shrink-0 rounded-xl bg-white px-6 py-3 font-extrabold text-teal-800"
            >
              Hubungi kami
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
