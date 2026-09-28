-- Phase 1.4: explicit document grants and PostgreSQL row-level security.
CREATE TYPE "DocumentAccessLevel" AS ENUM ('READ', 'EDIT', 'REVIEW');

CREATE TABLE "DocumentAccess" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "DocumentAccessLevel" NOT NULL,
    "grantedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentAccess_documentId_userId_key" ON "DocumentAccess"("documentId", "userId");
CREATE INDEX "DocumentAccess_userId_level_idx" ON "DocumentAccess"("userId", "level");
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text
LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('app.user_id', true), '') $$;

CREATE OR REPLACE FUNCTION app_has_role(role_name text) RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT role_name = ANY(string_to_array(COALESCE(NULLIF(current_setting('app.roles', true), ''), ''), ','));
$$;

CREATE OR REPLACE FUNCTION app_document_access(target_document_id text, required_level text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    app_has_role('SUPER_ADMIN')
    OR app_has_role('COORDINATOR')
    OR (required_level = 'READ' AND (app_has_role('DIRECTOR') OR app_has_role('AUDITOR')))
    OR (required_level = 'REVIEW' AND app_has_role('DIRECTOR'))
    OR EXISTS (
      SELECT 1 FROM "Document" d
      WHERE d."id" = target_document_id AND d."ownerId" = app_current_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM "DocumentAccess" a
      WHERE a."documentId" = target_document_id
        AND a."userId" = app_current_user_id()
        AND CASE a."level"
          WHEN 'READ' THEN 1 WHEN 'EDIT' THEN 2 WHEN 'REVIEW' THEN 3
        END >= CASE required_level
          WHEN 'READ' THEN 1 WHEN 'EDIT' THEN 2 WHEN 'REVIEW' THEN 3 ELSE 99
        END
    );
$$;

ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentAccess" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_read" ON "Document" FOR SELECT USING (app_document_access("id", 'READ'));
CREATE POLICY "document_insert" ON "Document" FOR INSERT WITH CHECK (
  "ownerId" = app_current_user_id() OR app_has_role('SUPER_ADMIN') OR app_has_role('COORDINATOR')
);
CREATE POLICY "document_update" ON "Document" FOR UPDATE USING (app_document_access("id", 'EDIT')) WITH CHECK (app_document_access("id", 'EDIT'));
CREATE POLICY "document_delete" ON "Document" FOR DELETE USING (app_document_access("id", 'EDIT'));

CREATE POLICY "document_version_read" ON "DocumentVersion" FOR SELECT USING (app_document_access("documentId", 'READ'));
CREATE POLICY "document_version_insert" ON "DocumentVersion" FOR INSERT WITH CHECK (app_document_access("documentId", 'EDIT'));
CREATE POLICY "document_version_update" ON "DocumentVersion" FOR UPDATE USING (app_document_access("documentId", 'EDIT')) WITH CHECK (app_document_access("documentId", 'EDIT'));
CREATE POLICY "document_version_delete" ON "DocumentVersion" FOR DELETE USING (app_document_access("documentId", 'EDIT'));

CREATE POLICY "document_access_read" ON "DocumentAccess" FOR SELECT USING (app_document_access("documentId", 'READ'));
CREATE POLICY "document_access_insert" ON "DocumentAccess" FOR INSERT WITH CHECK (app_document_access("documentId", 'EDIT'));
CREATE POLICY "document_access_update" ON "DocumentAccess" FOR UPDATE USING (app_document_access("documentId", 'EDIT')) WITH CHECK (app_document_access("documentId", 'EDIT'));
CREATE POLICY "document_access_delete" ON "DocumentAccess" FOR DELETE USING (app_document_access("documentId", 'EDIT'));
