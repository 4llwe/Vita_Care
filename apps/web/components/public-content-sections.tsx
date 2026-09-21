import type { PublicContent } from "../lib/public-content";

export function PublicContentSections({
  content,
}: {
  content: PublicContent;
}) {
  return (
    <div className="mt-8 space-y-8">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
        {content.reviewStatus}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">
            Kelayakan awal
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Layanan ini dapat dipertimbangkan untuk
          </h2>
          <ul className="mt-5 space-y-3">
            {content.suitability.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">
            Cakupan
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Yang dilakukan saat kunjungan
          </h2>
          <ul className="mt-5 space-y-3">
            {content.scope.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                <span className="font-black text-emerald-700">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">
          Alur pelayanan
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">
          Dari permintaan hingga tindak lanjut
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {content.process.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-700 text-sm font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-black text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black text-slate-950">
            Yang perlu dipersiapkan
          </h2>
          <ul className="mt-4 space-y-3">
            {content.preparation.map((item) => (
              <li key={item} className="text-sm leading-6 text-slate-700">
                • {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="text-xs font-black uppercase tracking-[.16em] text-red-700">
            Bukan untuk kondisi darurat
          </p>
          <h2 className="mt-2 text-xl font-black text-red-950">
            Segera gunakan layanan kegawatdaruratan jika terdapat
          </h2>
          <ul className="mt-4 space-y-3">
            {content.emergencySigns.map((item) => (
              <li key={item} className="text-sm font-semibold leading-6 text-red-900">
                • {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-300">
          Mutu, persetujuan, dan privasi
        </p>
        <h2 className="mt-2 text-2xl font-black">
          Batas pelayanan dan tata kelola
        </h2>
        <ul className="mt-5 grid gap-3 lg:grid-cols-2">
          {content.governance.map((item) => (
            <li key={item} className="text-sm leading-6 text-slate-300">
              ✓ {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
