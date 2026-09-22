#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?required}" "${BACKUP_ENCRYPTION_KEY:?required}"
out="${BACKUP_DIR:-./backups}";mkdir -p "$out";stamp=$(date -u +%Y%m%dT%H%M%SZ);file="$out/vitacare-$stamp.dump"
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl > "$file"
openssl enc -aes-256-cbc -pbkdf2 -salt -in "$file" -out "$file.enc" -pass env:BACKUP_ENCRYPTION_KEY;rm -f "$file"
sha256sum "$file.enc" > "$file.enc.sha256"
find "$out" -type f -mtime +"${BACKUP_RETENTION_DAYS:-30}" -delete
echo "$file.enc"
