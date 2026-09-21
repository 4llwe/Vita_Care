export function ServiceBoundaryNotice() {
  return (
    <aside
      className="border-y border-amber-300/70 bg-amber-50 px-5 py-4"
      aria-label="Batas dan ketersediaan layanan"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm leading-6 text-amber-950 lg:flex-row lg:items-center lg:justify-between lg:px-3">
        <div className="max-w-5xl">
          <strong className="font-black">Informasi layanan:</strong>{" "}
          Vita Care Hospital At Home merupakan model pelayanan kesehatan
          berbasis rumah. Ketersediaan layanan mengikuti asesmen klinis,
          kewenangan tenaga kesehatan, area operasional, kesiapan jejaring,
          dan ketentuan perizinan yang berlaku.
        </div>

        <div className="shrink-0 font-bold text-red-700">
          Bukan pengganti layanan kegawatdaruratan.
        </div>
      </div>
    </aside>
  );
}
