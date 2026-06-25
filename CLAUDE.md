# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

### Git & Version Control
- **NEVER** commit or push changes to git
- The user will handle all git operations (commit, push, branch management)
- Only make local file modifications; do not use git commands for version control

### Database & Prisma Schema
- **NEVER** run `prisma migrate` or `prisma db push` commands
- The Prisma schema (`prisma/schema.prisma`) is automatically updated via the `update:schema:inrealart` command in package.json
- Leave schema changes as-is; do not attempt database migrations
- Schema modifications are managed externally via the project's infrastructure

## Architecture Overview

This is a **Next.js 16 App Router** application (TypeScript, React 19) serving as the administrative backoffice for the InRealArt art marketplace. It combines art/inventory management, blockchain/NFT features, Shopify integration, and multilingual content.



