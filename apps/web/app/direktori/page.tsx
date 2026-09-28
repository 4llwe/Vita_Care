import Link from "next/link";
import { PublicHeader } from "../../components/public-header";
import { PublicFooter } from "../../components/public-footer";
import { publicItemHref } from "../../lib/public-menu";
import { loadDynamicMenu } from "../../lib/dynamic-menu";
export default async function Directory() {
  const menu = await loadDynamicMenu();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <p className="eyebrow">Direktori platform</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Semua layanan dan informasi
        </h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Navigasi terstruktur untuk pasien, keluarga, tenaga kesehatan, mitra, dan
          masyarakat.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {menu.map((g) => (
            <section key={g.key} id={g.key} className="medical-card scroll-mt-24">
              <h2 className="text-xl font-black text-slate-950">{g.label}</h2>
              <ul className="mt-5 space-y-1">
                {g.items.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={publicItemHref(g.key, i)}
                      className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-800"
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
