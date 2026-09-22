import { CONTACT } from "../lib/contact";
export function ContactDetails() {
  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-black text-slate-950">Kontak resmi Vita Care</h2>
      <dl className="mt-4 grid gap-4 text-sm md:grid-cols-3">
        <div>
          <dt className="font-black text-slate-900">Alamat</dt>
          <dd className="mt-1 leading-6 text-slate-600">{CONTACT.address}</dd>
        </div>
        <div>
          <dt className="font-black text-slate-900">Email</dt>
          <dd className="mt-1">
            <a
              className="font-bold text-teal-700 underline"
              href={`mailto:${CONTACT.email}`}
            >
              {CONTACT.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-black text-slate-900">Telepon / WhatsApp</dt>
          <dd className="mt-1 flex flex-col gap-1">
            <a
              className="font-bold text-teal-700 underline"
              href={`tel:${CONTACT.phone}`}
            >
              {CONTACT.phone}
            </a>
            <a
              className="font-bold text-teal-700 underline"
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              Buka WhatsApp
            </a>
          </dd>
        </div>
      </dl>
      <a
        href={CONTACT.mapUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex rounded-xl border border-teal-700 px-4 py-2 font-bold text-teal-800"
      >
        Buka lokasi di peta
      </a>
    </section>
  );
}
