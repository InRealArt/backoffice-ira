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



