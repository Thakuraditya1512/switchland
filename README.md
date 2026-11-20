
# Switchland.in — Land & Plot Store

A full-stack land and plot storefront with nearby essentials comparison.

## Included
- React + Vite + TypeScript frontend
- Node.js + Express + TypeScript API
- PostgreSQL schema and seed data
- JWT authentication (register/login)
- Plot search, budget, approval, water and market-distance filtering
- Side-by-side comparison for two plots
- Property detail pages
- Property enquiry / visit booking workflow
- Customer dashboard for enquiries
- Admin endpoints and role-aware property management

> This starter records purchase enquiries and visit appointments. It does **not** transfer property ownership, provide legal verification, or collect full property purchase payments. Add a verified payment provider and legal/KYC workflows before production use.

## Requirements
- Node.js 20+
- PostgreSQL 14+
- npm

## 1. Database setup
Create a PostgreSQL database named `estatehub`, then run:

```bash
psql -U postgres -d estatehub -f server/sql/schema.sql
psql -U postgres -d estatehub -f server/sql/seed.sql
```

## 2. Start the backend

```bash
cd server
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
npm install
npm run dev
```

API runs at `http://localhost:5000`; health check: `http://localhost:5000/api/health`.

## 3. Start the frontend

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo accounts
The seed script adds twelve illustrative plot listings, including Boduppal and Yadagirigutta. It does not create demo users. Register through the website. Seeded prices, approvals and amenity details are examples and must be independently verified. To make a user an admin, run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Log out and back in after changing the role.

## Main API
- `GET /api/properties` — list/search properties
- `GET /api/properties/:id` — property detail
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — login
- `GET /api/bookings/mine` — signed-in user's enquiries
- `POST /api/bookings` — create purchase enquiry / visit request
- `GET /api/admin/bookings` — admin booking list
- `POST /api/admin/properties` — admin create property
- `PATCH /api/admin/properties/:id` — admin update property
- `DELETE /api/admin/properties/:id` — admin delete property
- `PATCH /api/admin/bookings/:id` — admin update booking status

## Production checklist
- Use HTTPS and a strong unique JWT secret.
- Add email verification, password reset, rate limiting and audit logs.
- Use cloud image storage (e.g. S3/Cloudinary) instead of demo image URLs.
- Add property ownership verification, RERA / local compliance checks as applicable, and legal review.
- Add a real payment gateway only for clearly defined, refundable/non-refundable booking fees; never treat an enquiry as a completed sale.
- Add privacy policy, terms, consent and data-retention controls.
