import Link from "next/link";
import { EmergencyButton } from "./emergency-button";
export function PublicHeader() {
  const [navigationMenu, setNavigationMenu] = useState(PUBLIC_MENU);
  useEffect(() => {
    void loadDynamicMenu().then((rows) => setNavigationMenu(asLegacyMenu(rows)));
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <Link href="/" className="min-w-0">
          <span className="block text-lg font-black tracking-tight text-slate-950">
            Vita Care <span className="text-teal-700">HaH</span>
          </span>
          <span className="hidden text-[10px] font-bold uppercase tracking-[.18em] text-slate-500 sm:block">
            Hospital-level care at home
          </span>
        </Link>
        <nav
          className="hidden items-center gap-5 text-sm font-bold text-slate-600 lg:flex"
          aria-label="Navigasi publik"
        >
          <Link href="/">Beranda</Link>
          <Link href="/direktori#tentang-kami">Tentang Kami</Link>
          <Link href="/direktori#layanan">Layanan</Link>
          <Link href="/direktori#tim-kesehatan">Tim Kesehatan</Link>
          <Link href="/direktori#pasien">Pasien</Link>
          <Link href="/direktori#monitoring-pasien">Monitoring</Link>
          <Link href="/direktori">Semua Menu</Link>
        </nav>
        <div className="flex items-center gap-2">
          <details className="relative lg:hidden">
            <summary className="grid min-h-11 cursor-pointer list-none place-items-center rounded-xl border px-3 text-xs font-extrabold text-slate-700">
              Menu
            </summary>
            <nav
              className="absolute right-0 mt-2 grid w-64 gap-1 rounded-2xl border bg-white p-3 text-sm font-bold text-slate-700 shadow-xl"
              aria-label="Navigasi publik mobile"
            >
              <Link className="rounded-lg p-3 hover:bg-teal-50" href="/">
                Beranda
              </Link>
              <Link className="rounded-lg p-3 hover:bg-teal-50" href="/direktori#layanan">
                Layanan
              </Link>
              <Link className="rounded-lg p-3 hover:bg-teal-50" href="/direktori#pasien">
                Pasien & Keluarga
              </Link>
              <Link
                className="rounded-lg p-3 hover:bg-teal-50"
                href="/direktori#edukasi-kesehatan"
              >
                Edukasi
              </Link>
              <Link className="rounded-lg p-3 hover:bg-teal-50" href="/direktori#kontak">
                Kontak
              </Link>
              <Link className="rounded-lg bg-slate-950 p-3 text-white" href="/direktori">
                Semua menu
              </Link>
            </nav>
          </details>
          <EmergencyButton />
          <Link
            href="/login"
            className="hidden min-h-11 items-center rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white sm:inline-flex"
          >
            Masuk / Login
          </Link>
        </div>
      </div>
    </header>
  );
}
