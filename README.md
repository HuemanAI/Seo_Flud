# SEOflud — Production Deployment Guide

## What this is
AI programmatic SEO generator. User types a business description → gets a complete
Next.js project with 100K location pages ready to deploy to Google.

## Stack
- Next.js 14 (App Router)
- Claude API (claude-haiku — fast + cheap)
- Prisma + PostgreSQL (Neon.tech — free)
- Stripe (payments)
- Resend (email)
- Vercel (hosting — free tier)

---

## Deploy in 30 minutes

### 1. Clone and install
```bash
git clone <your-repo>
cd seoflud
npm install
```

### 2. Set up database (free on Neon.tech)
1. Go to neon.tech → create free account → create database "seoflud"
2. Copy the connection string
3. Add to .env.local: DATABASE_URL=postgresql://...
4. Run: npm run db:push

### 3. Set up environment variables
Copy .env.example to .env.local and fill in:
- ANTHROPIC_API_KEY — from console.anthropic.com
- DATABASE_URL — from Neon.tech
- NEXTAUTH_SECRET — run: openssl rand -base64 32
- STRIPE_SECRET_KEY — from dashboard.stripe.com (test mode first)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — from Stripe dashboard

### 4. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Test with HuemanAI prompt
Paste this in the prompt box:
"HuemanAI is an AI voice agent platform helping UK businesses deploy intelligent 
voice agents for sales calls, customer support, 24/7 answering, reservations, 
outbound cold calling, and inbound call handling."

Select FREE tier → hit generate → verify pages look correct → download zip.

### 6. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
# (same as .env.local)
```

### 7. Add Stripe products
In Stripe dashboard → Products → Create:
- Starter: £29/month recurring
- Growth: £99/month recurring  
- Agency: £299/month recurring
Copy the price IDs to .env.local

---

## Testing HuemanAI

After deploying SEOflud and generating the HuemanAI project:

1. Download the zip from SEOflud
2. Unzip into a new folder: huemanai-seo/
3. cd huemanai-seo && npm install
4. Add .env.local: NEXT_PUBLIC_BASE_URL=https://locations.huemanai.com
5. npm run build
6. vercel --prod
7. In HuemanAI's domain settings: add subdomain locations.huemanai.com → Vercel
8. Submit locations.huemanai.com/sitemap.xml to Google Search Console

Expected: Pages indexed within 48 hours, ranking for location keywords within 8-12 weeks.

---

## File structure
```
src/
  app/
    page.tsx              ← Main UI (prompt → results)
    api/
      generate/route.ts   ← Core API (streaming generation)
  lib/
    engine.ts             ← AI generation logic
    zip-builder.ts        ← Project packaging
  
prisma/
  schema.prisma           ← Database schema
```

---

## Cost per user (FREE tier)
- Strategy generation: ~$0.002 (claude-haiku)
- 100 page contents: ~$0.10 (claude-haiku)
- Total per free user: ~$0.10

At 100 free users: ~$10 API cost. Trivially affordable.

## Cost per STARTER user (1,000 pages)
- 1,000 page contents: ~$1.00
- Stripe fees on £29: ~£1.20
- Net margin: ~£26.80 per customer/month (92%)
