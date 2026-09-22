-- Vita Care uses a server-side API for all application data access.
-- Public Supabase Data API roles must not access clinical or operational data.

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

DO $$
DECLARE
  target_role TEXT;
BEGIN
  FOREACH target_role IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = target_role
    ) THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I',
        target_role
      );

      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %I',
        target_role
      );

      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM %I',
        target_role
      );

      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I',
        target_role
      );

      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I',
        target_role
      );

      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I',
        target_role
      );
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE
  target_table RECORD;
BEGIN
  FOR target_table IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      target_table.tablename
    );
  END LOOP;
END
$$;
