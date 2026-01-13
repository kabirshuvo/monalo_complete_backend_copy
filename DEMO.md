DEMO: Sample SaaS Narrative
=============================

Purpose
-------

This document paints a short, practical demo narrative to help buyers imagine this backend as the
backend for a real SaaS product.

Fictional product: "LearnShop"
--------------------------------

LearnShop is a combined learning platform and digital storefront targeting independent
education creators. The backend in this repository maps cleanly to the following features:

- Authentication & Accounts: Credentials-based login, session persistence, and account management
  allow creators and customers to sign in and manage their data.
- Courses: `Course` and `Lesson` models map to paid/free courses, content, and lesson progress.
- Shop & Orders: `Product`, `Order`, and `OrderItem` models represent downloadable products or
  course add-ons with order history and payment tracking (stripe session ID placeholder included).
- RBAC: Roles (`ADMIN`, `WRITER`, `LEARNER`, `CUSTOMER`) support separate experiences:
  - `ADMIN`: platform and user management
  - `WRITER`: content authors who can create courses and blog posts
  - `LEARNER`: enrolled students with progress tracking
  - `CUSTOMER`: shoppers and purchasers
- Audit Logging: `ActivityLog` enables audit trails required for billing disputes or compliance.

Mapping major code areas to demo features
-----------------------------------------

- `app/dashboard/*` → Role-specific admin dashboards (admin, writer, learner, customer).
- `app/api/courses` → Course listing, create course (guarded by role), and lesson APIs.
- `app/api/shop` → Product listing and order creation endpoint (validated by Zod).
- `lib/validation` → Input schemas used by all critical write paths.
- `prisma/schema.prisma` → Data model for users, products, courses, and audit logs.

How a buyer adapts the demo
---------------------------

1. Branding & content: Replace UI views and copy in `app/` with brand assets and product text.
2. Payments: Integrate a payments provider (Stripe) in `lib/payments.ts` and replace placeholder
   payment fields with real flows.
3. Onboarding: Extend seed data or add onboarding server actions to create demo organizations and
   sample users.

Example quick adaptation: Add subscription tiers
------------------------------------------------
1. Extend Prisma with `Plan` and `Subscription` models.
2. Add payment webhooks and enforce access to paid courses by verifying `Subscription` status.
3. Update RBAC checks for paid feature gating.

This narrative is intentionally concise; its goal is to make it easy for buyers to envision how the
kit maps to a real SaaS product and what next steps are required to go live.
