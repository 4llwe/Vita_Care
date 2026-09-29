# Production configuration

## Safe preparation

1. Generate a protected file:

   ```bash
   sh scripts/generate-production-env.sh .env.production
   ```

2. Replace every remaining placeholder with approved production values.
3. Keep the file permission at `600`; never commit it.
4. Validate without printing secret values:

   ```bash
   node scripts/verify-production-env.mjs .env.production
   ```

5. Run the full deployment precheck:

   ```bash
   ENV_FILE=.env.production sh scripts/predeploy-check.sh
   ```

## Required operator decisions

- Official HTTPS web and API domains.
- Medical team, receiving hospital, ambulance, WhatsApp, and complaint contacts.
- Clinical and complaint email recipients.
- PostgreSQL, Redis, object storage, mail, WhatsApp, Midtrans, and maps credentials.
- Independent random authentication, encryption, backup, database, and Redis secrets.
- Approved legal entity, licensing/accreditation wording, partners, service area, prices, and operating hours.

The validator checks completeness, HTTPS, E.164 telephone format, email syntax, placeholder removal, minimum secret length, and secret uniqueness. It intentionally never prints configured secret values.

Production promotion still requires reviewed database migrations, encrypted backups, restore evidence, smoke tests, monitoring, and responsible clinical/operator sign-off.