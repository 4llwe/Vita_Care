import { createHash, createHmac } from 'crypto';

/**
 * Pembuatan presigned URL AWS Signature V4 (query-string) untuk S3 / S3-compatible,
 * tanpa dependensi eksternal. Mendukung operasi PUT (unggah) dan GET (unduh).
 *
 * Menggunakan path-style endpoint (`/bucket/key`) agar kompatibel dengan MinIO dll.
 */
export type PresignInput = {
  method: 'PUT' | 'GET';
  key: string;
  expiresSec?: number;
  now?: Date; // untuk pengujian deterministik
};

export type S3Config = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
};

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}
function sha256hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/** RFC3986 encoding untuk komponen query (AWS-compatible). */
function enc(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}
/** Encode key path namun pertahankan pemisah '/'. */
function encodeKey(key: string): string {
  return key.split('/').map(enc).join('/');
}

export function loadS3Config(env: NodeJS.ProcessEnv = process.env): S3Config | null {
  const endpoint = env.S3_ENDPOINT;
  const bucket = env.S3_BUCKET;
  const accessKey = env.S3_ACCESS_KEY;
  const secretKey = env.S3_SECRET_KEY;
  if (!endpoint || !bucket || !accessKey || !secretKey) return null;
  return { endpoint, bucket, region: env.S3_REGION || 'us-east-1', accessKey, secretKey };
}

export function presignS3(cfg: S3Config, input: PresignInput): string {
  const { method, key } = input;
  const expires = input.expiresSec ?? 900;
  const now = input.now ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);

  const url = new URL(cfg.endpoint);
  const host = url.host;
  const canonicalUri = `/${cfg.bucket}/${encodeKey(key)}`;
  const credential = `${cfg.accessKey}/${dateStamp}/${cfg.region}/s3/aws4_request`;

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${enc(k)}=${enc(query[k])}`)
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const canonicalRequest = [method, canonicalUri, canonicalQuery, canonicalHeaders, 'host', payloadHash].join('\n');

  const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n');

  const kDate = hmac('AWS4' + cfg.secretKey, dateStamp);
  const kRegion = hmac(kDate, cfg.region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  return `${url.protocol}//${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/** URL publik objek (untuk bucket/objek yang dapat dibaca publik). */
export function publicS3Url(cfg: S3Config, key: string): string {
  const url = new URL(cfg.endpoint);
  return `${url.protocol}//${url.host}/${cfg.bucket}/${encodeKey(key)}`;
}
