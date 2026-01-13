A production-ready backend and admin foundation for Next.js App Router — with real auth, RBAC, validation, and clean architecture.  
Built to save weeks, not hours.

# MonAlo Backend Kit

**Production-oriented backend and admin kit** built with Next.js App Router, Prisma, and NextAuth.

---

## One-line value proposition

A secure, extensible backend foundation for SaaS and marketplace products that includes authentication,
RBAC, validation, audit logging, and CI-ready developer workflows.

---

## Production readiness & implementation status

### Fully implemented:

- Authentication system (NextAuth with credentials, registration, session management)
- Database schema with 15+ models (User, Product, Course, Blog, Order, ActivityLog, etc.)
- Role-Based Access Control (RBAC) with **5 roles**:
  - CUSTOMER
  - LEARNER
  - WRITER
  - SELLER
  - ADMIN

This is not a demo backend — it is a working, production-oriented foundation.

---

## Who this kit is for (and who it is not for)

### For:
- Engineering teams and independent developers who need a secure backend starting point.
- Buyers who want a clean authentication and RBAC foundation they can customize and extend.

### Not for:
- Products that require a finished, themed UI.
- Teams that need billing-ready, multi-tenant SaaS infrastructure out-of-the-box (requires adaptation).

---

## Problems this kit solves

- Fast, correct setup for authentication, sessions, and authorization.
- Consistent server-side input validation with predictable response shapes.
- Audit trails and soft-delete patterns for safer operations.
- CI-enforced quality checks (linting, type-safety, Prisma sanity).

---

## What is included

- Next.js App Router project with server components and example admin dashboards.
- Credentials-based authentication via NextAuth with Prisma adapter.
- RBAC enforcement primitives and guarded route examples.
- Zod validation schemas and standardized response helpers.
- Prisma schema covering users, products, orders, courses, lessons, and activity logs.
- Example API routes and server actions demonstrating secure patterns.
- GitHub Actions CI workflow (lint, typecheck, build, Prisma checks).

---

## Tech stack

- Next.js (App Router)
- React
- TypeScript (strict)
- Prisma + PostgreSQL
- NextAuth.js (credentials provider)
- Zod for server-side validation

---

## Quick start (developer)

1. Clone the repository.
2. Copy `.env.example` to `.env.local` and fill required values (see `docs/SETUP.md`).
3. Install dependencies and generate Prisma client:

```bash
npm ci
npx prisma generate --schema=prisma/schema.prisma
