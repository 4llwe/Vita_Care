import Link from "next/link";
import { CONTACT } from "../lib/contact";
export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-black text-white">Vita Care Hospital at Home</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            Koordinasi layanan setara rumah sakit di rumah dengan patient safety,
            monitoring, dan eskalasi terstruktur.
          </p>
        </div>
        <div>
          <p className="font-bold text-white">Kontak resmi</p>
          <address className="mt-3 space-y-2 text-sm not-italic leading-6 text-slate-400">
            <p>{CONTACT.address}</p>
            <p>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-white">
                {CONTACT.email}
              </a>
            </p>
            <p>
              <a href={`tel:${CONTACT.phone}`} className="hover:text-white">
                {CONTACT.phone}
              </a>{" "}
              ·{" "}
              <a
                href={CONTACT.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                WhatsApp
              </a>
            </p>
          </address>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/direktori#layanan">Layanan</Link>
            <Link href="/direktori#kontak">Kontak dan pengaduan</Link>
          </div>
        </div>
        <div>
          <p className="font-bold text-white">Kegawatdaruratan</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Platform ini tidak menggantikan layanan gawat darurat. Gunakan tombol Darurat
            untuk jalur bantuan yang dikonfigurasi penyelenggara.
          </p>
        </div>
      </div>
    </footer>
  );
}
