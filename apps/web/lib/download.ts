import { API_URL } from "./api";
import { getToken } from "./auth";

/**
 * Unduh berkas terproteksi (PDF/Excel/CSV) dengan menyertakan bearer token.
 * Karena `<a href>` biasa tidak membawa Authorization, kita fetch sebagai blob
 * lalu memicu unduhan di sisi klien.
 */
export async function downloadAuth(
  path: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Gagal mengunduh (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
