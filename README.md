# KUFPEC Cafeteria

A Next.js + Prisma + PostgreSQL web app where KUFPEC employees browse the cafeteria
menu, order food to their office, and pay from a prepaid credit balance.

## Roles
- **Employee** — self-registers (restricted email domain), edits profile (office/floor),
  browses the menu, places orders, views invoices and top-up receipts, sees wallet history.
- **Cafeteria admin** — processes incoming orders, adjusts the final price (toppings/extras)
  and approves (which charges credit and issues an invoice), records cash top-ups and prints
  receipts, marks items sold out.
- **Super admin** — everything above, plus full menu management (categories, items, prices,
  photos), user management, balance adjustments, and app settings.

## Order flow
Employee places order (PENDING, no charge) → cafeteria admin reviews, sets the final
per-line price, approves → credit is deducted in one transaction and an invoice is created.
Orders may also be rejected or cancelled (no charge). Balances may go negative up to a
configurable limit.

## Money
All amounts are stored as integer **fils** (1 KWD = 1000 fils) to avoid floating-point
errors, and displayed as KWD to three decimals.

## Environment variables
Copy `.env.example` to `.env`:
- `DATABASE_URL` — Neon **pooled** connection string (for app queries)
- `DIRECT_URL` — Neon **non-pooled** string (for migrations / `db push`)
- `JWT_SECRET` — at least 32 random chars (`openssl rand -base64 48`). The app refuses to start without it.
- `APP_URL` — e.g. http://localhost:3000
- `ALLOWED_EMAIL_DOMAINS` — comma-separated; overrides the in-app setting if present.

## Local run
```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

## Seeded accounts
- Super admin:     superadmin@kufpec.com / Admin@12345
- Cafeteria admin: cafeteria@kufpec.com / Cafe@12345
- Employee:        sara@kufpec.com / Employee@123

## Deployment (Vercel + Neon)
1. Push to GitHub, import in Vercel (preset: Next.js, root: ./).
2. Add `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `APP_URL` (and optionally
   `ALLOWED_EMAIL_DOMAINS`) for Production + Preview.
3. Deploy. `postinstall` runs `prisma generate`; the build runs `prisma db push`.

> Note: the build uses `prisma db push --accept-data-loss`, which is convenient for a
> greenfield schema. Once you have real data, switch to committed migrations
> (`prisma migrate deploy`).

## Receipts & invoices
Both render as clean on-screen documents with a "Print / Save as PDF" button that uses the
browser's native print-to-PDF (the print stylesheet hides the rest of the page). No PDF
library needed.
