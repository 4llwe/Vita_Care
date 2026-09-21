# Final deployment checklist

1. Generate and commit `pnpm-lock.yaml`; run frozen install.
2. Run Prisma generate and all migrations including dynamic menu seed.
3. Confirm `/api/menus` returns 14 default groups and 117 items.
4. Log in as SUPER_ADMIN and test create/edit/deactivate group and submenu.
5. Verify a newly created submenu appears in header, directory, and its public page without rebuild.
6. Run lint, unit, build, E2E, SBOM, Trivy, migration, backup, restore, provider, accessibility, load, and penetration tests.
7. Store TLS and application secrets outside the repository.
8. Obtain engineering, security, clinical, privacy, and regulatory sign-off.
