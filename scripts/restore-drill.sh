#!/usr/bin/env sh
set -eu
: "${BACKUP_FILE:?required}" "${BACKUP_ENCRYPTION_KEY:?required}" "${RESTORE_DATABASE_URL:?required}"
sha256sum -c "$BACKUP_FILE.sha256";tmp=$(mktemp);trap 'rm -f "$tmp"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -in "$BACKUP_FILE" -out "$tmp" -pass env:BACKUP_ENCRYPTION_KEY
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$RESTORE_DATABASE_URL" "$tmp"
psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null
echo "Restore drill passed"
