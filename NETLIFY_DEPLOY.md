# Git → Netlify deployment

This repository is configured to deploy the Next.js web app from `apps/web` through `netlify.toml`.

## Architecture
Netlify hosts the Next.js frontend. The NestJS API, PostgreSQL, Redis, migrations, notification workers, and storage must run on a separate backend host. Configure both `API_URL` and `NEXT_PUBLIC_API_URL` with the public HTTPS API base URL.

## Required Netlify variables
- `API_URL=https://api.your-domain.example`
- `NEXT_PUBLIC_API_URL=https://api.your-domain.example`
- `NEXT_PUBLIC_CONTACT_ADDRESS=Jl. Kecubung No.20, Gomong Lama, Kota Mataram, NTB`
- `NEXT_PUBLIC_CONTACT_EMAIL=vitacare87@gmail.com`
- `NEXT_PUBLIC_CONTACT_PHONE=+6282227420800`
- `NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/6282227420800`
- `NEXT_PUBLIC_MAP_URL=https://www.google.com/maps/search/?api=1&query=Jl.%20Kecubung%20No.20%2C%20Gomong%20Lama%2C%20Kota%20Mataram%2C%20NTB`
- `NEXT_PUBLIC_COMPLAINT_EMAIL=vitacare87@gmail.com`
- `NEXT_PUBLIC_MEDICAL_TEAM_PHONE=+6282227420800`
- `NEXT_PUBLIC_HOSPITAL_PHONE=<official hospital number>`
- `NEXT_PUBLIC_AMBULANCE_PHONE=<official ambulance number>`

## Git-based deployment
1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Netlify choose **Add new site → Import an existing project**.
3. Select the repository. Netlify reads `netlify.toml` automatically.
4. Add the variables above in **Site configuration → Environment variables**.
5. Deploy and verify `/`, `/login`, `/direktori`, and `/informasi/kontak/hubungi-kami`.

The first Netlify build uses `--no-frozen-lockfile` because a lockfile could not be generated in the offline sandbox. After the first successful dependency install, generate and commit `pnpm-lock.yaml`, then change the install command to `pnpm install --frozen-lockfile`.
