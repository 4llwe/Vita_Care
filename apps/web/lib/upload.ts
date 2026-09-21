import { api } from "./api";
import { getToken } from "./auth";

type UploadTicket = {
  key: string;
  uploadUrl: string;
  method: "PUT";
  fileUrl: string;
  headers: Record<string, string>;
  storage: "s3" | "local";
};

/**
 * Unggah berkas via presigned URL (S3) atau endpoint lokal (dev).
 * 1) minta tiket ke /storage/presign, 2) PUT berkas ke uploadUrl, 3) kembalikan fileUrl publik.
 */
export async function uploadFile(
  file: File,
  folder = "documents",
): Promise<string> {
  const ticket = await api<UploadTicket>("/storage/presign", {
    token: getToken(),
    method: "POST",
    body: {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
    },
  });

  const res = await fetch(ticket.uploadUrl, {
    method: ticket.method,
    headers: ticket.headers,
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Unggah gagal (${res.status})`);
  }
  return ticket.fileUrl;
}
