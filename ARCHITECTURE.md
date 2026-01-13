ARCHITECTURE
=============

This document describes the high-level architecture of the backend kit. It is written for a senior
developer evaluating the product for integration into a commercial project.

1. High-level system overview
-----------------------------

This repository implements a production-oriented backend and admin kit built on Next.js (App Router).
It provides an authenticated web backend, role-based dashboards, an API surface for shop/courses/blogs,
and a database schema (PostgreSQL via Prisma). The kit focuses on secure authentication, role-based
authorization, input validation, audit logging, and pragmatic developer ergonomics.

Primary responsibilities:
- Authenticate users (credentials provider)
- Authorize actions via server-side RBAC guards
- Provide API routes and server components for dashboards and public pages
- Maintain audit logs and soft-delete patterns in the DB

2. Why Next.js App Router
-------------------------

- Server-first rendering: Server components reduce client bundle size and simplify data fetching.
- Server Actions and the App Router provide a clean separation between UI and server logic.
- Edge middleware support enables fast authentication checks at the CDN/edge layer.
- Single framework for UI and backend reduces context switching for buyers integrating admin UI.

3. Server Actions vs API routes
-------------------------------

When to use Server Actions:
- Tight coupling with a server-rendered page or a form action where the server call returns a UI
  response directly. Server Actions simplify flows by running in the same server context as the
  component and can return results directly to the server component.

When to use API routes:
- Public or third-party-facing endpoints, background jobs, or endpoints expected to be consumed by
  external clients. API routes are preferred where a stable HTTP contract is required.

Guideline: prefer Server Actions for internal UI interactions and API routes for public or reusable
endpoints.

4. Authentication flow
----------------------

Flow summary:
1. User submits credentials via the UI (login form or credentials provider).
2. Credentials are validated server-side (Zod schema) before any DB lookup.
3. NextAuth CredentialsProvider `authorize()` checks user record and password hash.
4. Successful auth issues a session (database-backed via Prisma adapter). JWT claims or session data
   are accessible in server components via `getServerSession()` or `getToken()`.
5. Edge middleware performs an authentication-only check (token presence and validity).
6. Server-side guards re-validate role & permissions using authoritative DB reads before rendering
   or performing privileged operations.

Security rationale:
- Never trust client-provided role claims. Middleware performs a fast auth check but defers
  authorization to the server where the role is fetched from the database.
- Validation of inputs occurs before DB writes to prevent malformed data and maintain safe default
  behaviors.

5. Role-Based Access Control (RBAC)
----------------------------------

Design:
- Roles defined in the Prisma schema (enum `Role`).
- Coarse-grained checks: middleware enforces authentication.
- Fine-grained checks: server-side `requireServerRole()` / `requireRole()` functions validate role
  and return proper status or redirect to `/403`.

Enforcement points:
- Middleware: authentication-only (presence & token validity).
- Server components: call `requireServerRole()` early in page load.
- API routes: call `requireRole()` inside route handler before any side-effect operations.

6. Middleware responsibility
----------------------------

The middleware shipped with the kit is intentionally authentication-only:
- Fast token validation at the edge
- Redirect unauthenticated requests to login with `callbackUrl`

Rationale: enforcing authorization at the edge is insecure if JWT claims are accepted as authoritative.
The correct pattern is fast edge-level auth + server-side DB-backed authorization.

7. Validation strategy
----------------------

- Zod is used for server-side validation. Schemas live in `lib/validation/`.
- All inputs are validated with `schema.safeParse()` before any DB write or privileged operation.
- Standardized response shape is provided by `lib/validation/base-response.ts` returning `{ success, data, error }`.

Pattern example (APIs / Server Actions):
1. Parse JSON body (if applicable).
2. `const parsed = schema.safeParse(body)`.
3. If invalid, return 400 with a structured error payload describing issues.
4. If valid, proceed to business logic and DB writes.

8. Error-handling and response contract
---------------------------------------

- API responses follow a predictable contract: success responses include `success: true` and `data`;
  errors use `success: false` and `error`.
- Server-side exceptions are caught at the route or page level and mapped to explicit HTTP codes.
- Validation errors map to `400`; authorization to `401/403`; unexpected failures to `500`.

9. Audit logging philosophy
---------------------------

What is logged:
- Access attempts (allowed and denied), including `userId`, `route`, `userRole`, `reason`.
- Authentication failures and role validation failures.
- Important state changes (create/update/delete) with `createdBy` / `updatedBy` audit fields.

Implementation notes:
- Audit logging is done via Prisma and is failure-safe: logging failures do not block main flows.
- Logs are indexed for efficient investigation (`userId`, `timestamp`, `action`).

10. How to extend safely
-------------------------

Guidelines for developers who buy this kit:
- Keep validation schemas in `lib/validation` and reuse them across server actions and API routes.
- Keep middleware authentication-only; add new authorization checks server-side.
- When adding roles or permissions, update the Prisma enum and associated server guards.
- For any DB write that is multi-step (orders, inventory updates), use Prisma transactions.
- Add tests for new guarded routes and automation in CI.

Diagrams-as-text (simplified):

Client → Edge (Middleware: token check) → Server Component/API Route
                                            ↳ requireServerRole() / requireRole() → DB

Client (external integration) → API Route → Zod validation → requireRole() → DB / Worker

11. Ownership and distribution notes
-----------------------------------

This product is intended to be a starting commercial backend kit. It focuses on correctness,
security, and extensibility rather than providing a complete application UI. Buyers should treat
this codebase as a foundation: adapt roles, extend schemas, and implement production-grade
monitoring and backups per their infrastructure.
