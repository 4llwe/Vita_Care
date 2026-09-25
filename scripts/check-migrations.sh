#!/usr/bin/env sh
set -eu
files=$(find prisma/migrations -mindepth 2 -maxdepth 2 -name migration.sql | sort)
[ -n "$files" ]||{ echo "No migrations";exit 1;}
duplicates=$(printf '%s
' "$files"|sed 's|/migration.sql||;s|.*/||'|sort|uniq -d)
[ -z "$duplicates" ]||{ echo "Duplicate migration names: $duplicates";exit 1;}
if grep -Ein 'DROP DATABASE|DROP SCHEMA|TRUNCATE TABLE' $files;then echo "Destructive migration statement found";exit 1;fi
python3 scripts/verify-migration-coverage.py
echo "Migration hygiene passed: $(printf '%s
' "$files"|wc -l) migrations"
