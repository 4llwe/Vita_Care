export function Loading({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="animate-pulse rounded-xl bg-slate-100 p-6 text-sm text-slate-400">
      {label}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <strong className="font-bold">Gagal memuat data.</strong> {message}
      <div className="mt-1 text-xs text-red-500">
        Pastikan API berjalan dan Anda sudah login.
      </div>
    </div>
  );
}

export function Empty({ label = "Belum ada data." }: { label?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}
