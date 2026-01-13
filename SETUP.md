SETUP
=====

Purpose: step-by-step instructions to prepare the repository locally for development.

Prerequisites
-------------
- Node.js (recommended 18.x)
- PostgreSQL instance (local or managed) or a compatible Postgres service
- `npm` (or `pnpm`) installed

Quick local setup
-----------------

1. Clone the repository

```bash
git clone <repo-url>
cd monalo_complete_backend
```

2. Copy environment file and fill secrets

```bash
cp .env.example .env.local
# Edit .env.local and fill DATABASE_URL and NEXTAUTH_SECRET
```

Generate a `NEXTAUTH_SECRET`:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

3. Install dependencies

```bash
npm ci
```

4. Generate Prisma client

```bash
npx prisma generate --schema=prisma/schema.prisma
```

5. (Optional) Run seed data

Make sure `DATABASE_URL` points to a writable database before running seed.

```bash
npm run seed
```

6. Build and run development server

```bash
npm run dev
```

Notes & caveats
---------------
- `prisma migrate` commands are not run by default. If you want to apply migrations, ensure you
  understand the target DB and run migrations manually.
- Do not commit `.env.local` or any real credentials. Use `.env.example` as the source-of-truth for
  required variables.

If you intend to deploy, follow your cloud provider's recommendations for environment variables,
secrets management, and database backups.
