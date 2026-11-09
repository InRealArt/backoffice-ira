# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

### Git & Version Control
- Committing and pushing are allowed on any branch **except `main`**
- **NEVER** commit or push directly to `main` (no commit while `main` is checked out, no `git push` targeting `main`, no force-push, no merge into `main`)
- Commit messages must **never** mention Claude, Claude Code or AI, and must not include any `Co-Authored-By` or "Generated with" line or any other text indicating that Claude Code wrote the change
- Branch management for `main` (merging PRs, etc.) stays with the user

### Database & Prisma Schema
- **NEVER** run `prisma migrate` or `prisma db push` commands
- The Prisma schema (`prisma/schema.prisma`) is automatically updated via the `update:schema:inrealart` command in package.json
- Leave schema changes as-is; do not attempt database migrations
- Schema modifications are managed externally via the project's infrastructure

## Architecture Overview

This is a **Next.js 16 App Router** application (TypeScript, React 19) serving as the administrative backoffice for the InRealArt art marketplace. It combines art/inventory management, blockchain/NFT features, Shopify integration, and multilingual content.




## Security: Server Actions, API routes and R2 storage

**Every Server Action and every API route handler is a public HTTP endpoint.** `proxy.ts` is not an authorization layer: it ignores `/api/*`, POST and HEAD requests, only checks that a session exists (not the role), and does not cover locale-prefixed paths such as `/fr/...`. Each action and route must protect itself.

### Rules
- The guard must be the **first statement** of the function, before any `try`, so a refusal is never swallowed by a fallback. In a route handler, put it first inside the `try` and start the `catch` with `const denied = unauthorizedResponse(error); if (denied) return denied`.
- This applies to **every** file starting with `'use server'`, wherever it lives (not only `lib/actions/`). Never put a `'use server'` directive inside a function of an already-`'use server'` file (it breaks compilation while `tsc` still passes).
- Never trust an identifier coming from the client (`artistId`, `userId`, `email`, an entity id, a storage path): check it against the session, or load the owner from the database.
- Run `npm run check:guards` (also run by CI). It fails on a new unguarded action/route and on a stale baseline. Do **not** add entries to `scripts/action-guards-baseline.json` to silence it; the remaining ones (`checkIsAdmin`, `checkAuthorizedUser`, `getUserByEmail`, `getBackofficeUserByEmail`) are intentional.

### Helpers
- `lib/auth-helpers.ts`: `requireAdmin()`, `requireBackofficeUser()` (admin, artist or galleryManager), `requireRole(...roles)`, `requireArtistAccess(artistId)` (admin, or the artist whose `artistId` is in the session), `requireAuthUserAccess(userId)`, `requireSession()` (pages). They throw `UnauthorizedError` (message `Non authentifié` → 401, otherwise 403).
- `lib/auth-ownership.ts` (loads the owner in the database): `requirePresaleArtworkAccess(id)`, `requireItemAccess(id)`, `requirePhysicalItemAccess(id)`, `requirePhysicalCollectionAccess(id)`, `requireArtistAddressAccess(id)`.
- `lib/api-auth.ts`: `unauthorizedResponse(error)` turns an `UnauthorizedError` into a 401/403 `NextResponse` (null otherwise).
- Fields reserved to admins (`isFeatured`, `isTopArtwork`, `order`, changing an `artistId`, item status other than `pending`) are ignored or refused for other roles in the actions themselves.

### R2 storage
- A non-admin may only write/delete under `artists/<own folder>/…`, `marketplace/<own folder>/…` or `temp/<uuid>/…`. The folder is compared by canonical key (lowercase, no accents, letters/digits only) with the **first name + last name** of the session artist read from the database; the pseudonym is deliberately excluded (the artist can edit it).
- Use `assertStorageAccess(session, path, 'write' | 'delete')` from `lib/r2/storage-access.ts` in every route or action that touches a key (`/api/r2/presign`, `/api/r2/delete`, `convertAndFinalize`). `lib/r2/path-guard.ts` rejects `..`, `//`, `\`, control characters and absolute paths for everyone, including admins.
- A new artist name is validated by `validateNewArtistName` (`lib/r2/folder-keys.ts`): it must not collide with an existing artist, because the name is the storage key.

### Forms and zod 4
- Use `zodFormResolver(schema)` (`lib/forms/zod-form-resolver.ts`) instead of `zodResolver` when a schema has `.default()` fields: it types the form on the schema output.
- In zod 4, `.default(value)` returns the value **without validating it**. For a constrained field that must still fail when absent (e.g. `z.array(...).min(1)`), use `.prefault(value)`.

### Tests
- `npm test` (Vitest) includes the guard helpers, ownership checks, R2 path/folder rules, API route access and key zod schemas. Add a test with each new guard or access rule.
