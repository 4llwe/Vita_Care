# Controlled Booking Ownership Backfill

Do not match patients by name or phone automatically. Prepare a reviewed CSV outside the repository:

```csv
bookingId,patientUserId
<booking-cuid>,<patient-user-cuid>
```

Dry-run first:

```bash
DATABASE_URL=... pnpm backfill:booking-patient --mapping=/secure/path/mapping.csv
```

Apply only after review, backup, and named operator approval:

```bash
DATABASE_URL=... BACKFILL_ACTOR_ID=<operator-user-id> \
  pnpm backfill:booking-patient --mapping=/secure/path/mapping.csv --apply
```

The apply path is idempotent, rejects conflicting ownership, and writes an `AuditLog` row for each change. Never commit mapping files.
