# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Development server with Turbopack
npm run dev:webpack  # Development server with Webpack (fallback)
npm run build        # Runs `prisma generate` then `next build`
npm run lint         # ESLint
npm run cleanDev     # Remove .next cache and restart dev server
```

Scripts for one-off tasks use `tsx` (e.g., `tsx scripts/some-script.ts`). The `postinstall` hook runs `scripts/postinstall.sh` after `npm install`.

## Architecture Overview

This is a **Next.js 16 App Router** application (TypeScript, React 19) serving as the administrative backoffice for the InRealArt art marketplace. It combines art/inventory management, blockchain/NFT features, Shopify integration, and multilingual content.

### Routing Structure

```
app/
├── (admin)/          # Protected admin UI routes grouped by domain
│   ├── boAdmin/      # Backoffice user management
│   ├── admin-art/    # Artwork management
│   ├── blockchain/   # NFT / smart contract management
│   ├── marketplace/  # Marketplace management
│   ├── landing/      # Landing page CMS
│   └── tools/        # Admin utilities
├── [locale]/         # i18n routes (en/fr) — public and protected sub-routes
└── api/              # API route handlers (auth, shopify, blockchain, inventory…)
```

The `[locale]` segment wraps public and protected pages for internationalization via **next-intl** (locales: `fr` default, `en`). Admin routes under `(admin)/` are separate from locale routes.

### Database & Server Actions

**Prisma** with PostgreSQL across **8 schemas**: `auth`, `public`, `landing`, `marketplace`, `blockchain`, `landingUi`, `backoffice`, `statistics`. The Prisma client is a singleton in `lib/prisma.ts`.

All database mutations go through **Next.js Server Actions** in `lib/actions/` (33 files). The central file is `lib/actions/prisma-actions.ts` (2100+ lines). Use `USE_DIRECT_PRISMA=1` env var when running scripts directly (bypasses connection pooler).

### Authentication

**better-auth** (`lib/auth.ts`) with a Prisma adapter and PostgreSQL backend. Models live in the `backoffice` schema (prefixed `BackofficeAuth*`). Sessions use cookies with a 5-minute cache TTL. Email delivery via Brevo. Client-side auth helpers are in `lib/auth-client.ts` and `lib/auth-helpers.ts`.

### Internationalization

**next-intl** handles routing and translations. Translation JSON files are in `messages/en.json` and `messages/fr.json`. Automated translation uses Google Translate (`lib/services/translation-service.ts`). i18n routing config is in `i18n/routing.ts`.

### Styling

**Tailwind CSS** + **DaisyUI** (component library). CSS variables define the color system (see `tailwind.config.ts`). Dark mode is class-based. SCSS is also supported. Global styles in `app/globals.css`.

### Web3 / Blockchain

**wagmi** + **viem** for smart contract interaction; **Dynamic Labs SDK** for wallet connection. Supported chains: mainnet, Sepolia, Polygon, Mumbai. Contract ABIs are in `lib/contracts/`. IPFS uploads go through Pinata (`lib/pinata/`).

### External Services

| Service | Purpose | Integration |
|---|---|---|
| Firebase | Image storage/CDN | `lib/firebase/` |
| Brevo | Transactional email | `lib/services/brevo.ts` |
| Google Translate | Auto-translation | `lib/services/translation-service.ts` |
| Shopify | E-commerce | `app/api/shopify/` |
| Pinata | IPFS/NFT metadata | `lib/pinata/` |
| Umami | Analytics | `scripts/get-umami-stats.ts` |
| Shippo | Shipping rates | API routes |

### Key Libraries

- **Forms:** react-hook-form + zod + @hookform/resolvers
- **State:** zustand, TanStack React Query, nuqs (URL state)
- **UI extras:** Radix UI primitives, Lucide icons, recharts, react-dropzone, react-hot-toast
- **Data export:** exceljs (Excel), react-pdf (PDF)
- **Images:** sharp (server-side processing), next/image with Firebase/S3/Unsplash remote patterns

## Deployment

Optimized for **Vercel** (`output: standalone` in `next.config.ts`). Prisma engine binaries are explicitly bundled via `outputFileTracingIncludes` for the Vercel runtime. The build script always runs `prisma generate` first.
