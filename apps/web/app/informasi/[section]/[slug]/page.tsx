import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "../../../../components/public-header";
import { PublicFooter } from "../../../../components/public-footer";
import { OperationalActionPanel } from "../../../../components/operational-action-panel";
import { operationFromItem } from "../../../../lib/menu-operation";
import { api } from "../../../../lib/api";
import { findPublicItem } from "../../../../lib/public-menu";
import { publicPageContent } from "../../../../lib/public-content";

const accessSections = new Set([
  "pasien",
  "keluarga-caregiver",
  "monitoring-pasien",
  "pemesanan",
  "farmasi-obat",
  "pembayaran",
]);


export default async function InfoPage({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  const fallback = findPublicItem(section, slug);
  const remote = await api<any>(`/menus/${section}/${slug}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!remote && !fallback) notFound();
  const group = remote?.group ?? fallback!.group;
  const itemRecord = remote?.item ?? { label: fallback!.item };
  const item = itemRecord.label;
  const content = publicPageContent(group.key, slug, item);
  const operation = operationFromItem(itemRecord, group.key, slug);
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
            <p className="mt-5 text-lg leading-8 text-slate-600">{content.summary}</p>
            {content.audience ? <p className="mt-3 text-sm font-semibold text-teal-800">Untuk: {content.audience}</p> : null}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {content.highlights.map((highlight, index) => (
                <section key={highlight} className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-xs font-black text-teal-700">0{index + 1}</span>
                  <h2 className="mt-3 font-extrabold text-slate-900">{highlight}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Pelaksanaan mengikuti protokol, persetujuan pasien, kompetensi petugas, dan kebijakan privasi.</p>
                </section>
              ))}
            </div>
            {content.safety ? <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950"><b>Keselamatan:</b> {content.safety}</aside> : null}
            {accessSections.has(group.key) ? <p className="mt-5 text-sm text-slate-500">Data personal hanya tersedia setelah login dan dibatasi berdasarkan identitas, consent, penugasan, serta hak akses pengguna.</p> : null}
            <OperationalActionPanel
              section={group.key}
              slug={slug}
              operation={operation}
            />
          </article>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
