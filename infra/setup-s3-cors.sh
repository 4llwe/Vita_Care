#!/usr/bin/env bash
# Terapkan kebijakan CORS agar browser dapat PUT langsung ke bucket (presigned URL).
# Sesuaikan AllowedOrigins di infra/s3-cors.json sebelum menjalankan.
set -euo pipefail

BUCKET="${S3_BUCKET:-vitacare-evidence}"
REGION="${S3_REGION:-ap-southeast-1}"
ENDPOINT="${S3_ENDPOINT:-}"   # kosongkan untuk AWS S3; isi untuk MinIO mis. http://localhost:9000
CORS_FILE="$(dirname "$0")/s3-cors.json"

echo "Menerapkan CORS ke bucket: ${BUCKET} (region ${REGION})"

if [[ -n "${ENDPOINT}" ]]; then
  # MinIO / S3-compatible via AWS CLI dengan --endpoint-url
  aws --endpoint-url "${ENDPOINT}" s3api put-bucket-cors \
    --bucket "${BUCKET}" \
    --cors-configuration "file://${CORS_FILE}"
else
  aws s3api put-bucket-cors \
    --bucket "${BUCKET}" \
    --region "${REGION}" \
    --cors-configuration "file://${CORS_FILE}"
fi

echo "Selesai. Verifikasi:"
if [[ -n "${ENDPOINT}" ]]; then
  aws --endpoint-url "${ENDPOINT}" s3api get-bucket-cors --bucket "${BUCKET}"
else
  aws s3api get-bucket-cors --bucket "${BUCKET}" --region "${REGION}"
fi
