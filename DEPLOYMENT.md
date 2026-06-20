# Karn's WiFi — Vercel Deployment Guide

## Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account

---

## Step 1 — Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to provision (~2 min).
3. Open **SQL Editor** and run the migrations in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_seed_data.sql
```

4. Under **Authentication → Providers**, enable **Email** sign-in.

### Create the first admin user

In the Supabase dashboard:

1. Go to **Authentication → Users → Invite user** and invite your admin email.
2. After the user accepts the invite, copy their **User ID** from the Users table.
3. Open **SQL Editor** and run:

```sql
INSERT INTO admins (user_id, email, full_name)
VALUES ('<paste-user-uuid-here>', 'admin@yourdomain.com', 'Your Name');
```

---

## Step 2 — Deploy to Vercel

### Option A — Via Vercel Dashboard (recommended)

1. Push this repository to GitHub.
2. Go to [https://vercel.com/new](https://vercel.com/new) and import your GitHub repo.
3. Vercel will auto-detect Next.js — click **Deploy**.
4. After the first deploy, go to **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (**keep secret!**) |
| `NEXT_PUBLIC_MOBILE_MONEY_NUMBER` | Your Mobile Money number (e.g. `055-123-4567`) |

5. Trigger a **Redeploy** after adding env vars.

### Option B — Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Follow the prompts and add env vars when asked.

---

## Step 3 — Post-Deploy Checklist

- [ ] Visit `https://your-domain.vercel.app` — customer portal loads with packages
- [ ] Visit `https://your-domain.vercel.app/admin/login` — admin login works
- [ ] Log in as admin — dashboard shows stats
- [ ] Add test vouchers under **Vouchers** tab
- [ ] Submit a test payment as a customer and approve it as admin

---

## Supabase Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — never expose it on the client.
- Row Level Security (RLS) is enabled on all tables.
- Customers can only INSERT payments; they cannot read or modify other data.
- Admins are verified both server-side (layout.tsx) and via the `admins` table lookup.

---

## Environment Variables Reference

See `.env.example` for all required variables.

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your Supabase credentials

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
