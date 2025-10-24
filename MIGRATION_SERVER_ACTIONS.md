# Migration vers Server Actions - Guide Pratique

## 🎯 Pourquoi cette migration ?

**Problème** : Next.js 16 sur Vercel exécute les API Routes dans AWS Lambda, qui ne trouve pas les moteurs binaires Prisma.

**Solution** : Les Server Actions s'exécutent dans le runtime Node.js standard → Pas de problème Prisma !

## 📝 Fichiers à migrer

### 1. `app/page.tsx` (ligne 41)

**AVANT** (API Route) :

```typescript
const response = await fetch("/api/auth/checkAuthorizedUser", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: user.email }),
});
const data = await response.json();
if (data.authorized) {
  // ...
}
```

**APRÈS** (Server Action) :

```typescript
import { checkAuthorizedUser } from "@/lib/actions/auth-actions";

const result = await checkAuthorizedUser(user.email);
if (result.authorized) {
  // ...
}
```

---

### 2. `app/components/Auth/AuthObserver.tsx` (ligne 25)

**AVANT** :

```typescript
const response = await fetch("/api/auth/checkAuthorizedUser", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: user.email }),
});
const data = await response.json();
```

**APRÈS** :

```typescript
import { checkAuthorizedUser } from "@/lib/actions/auth-actions";

const result = await checkAuthorizedUser(user.email);
```

---

### 3. `app/components/SideMenu/useSideMenuLogic.ts` (ligne 184)

**AVANT** :

```typescript
const response = await fetch("/api/auth/checkAuthorizedUser", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: userEmail }),
});
const data = await response.json();
```

**APRÈS** :

```typescript
import { checkAuthorizedUser } from "@/lib/actions/auth-actions";

const result = await checkAuthorizedUser(userEmail);
```

---

## ✅ Avantages de cette migration

| Critère                   | API Route                       | Server Action            |
| ------------------------- | ------------------------------- | ------------------------ |
| **Fonctionne sur Vercel** | ❌ Problème Prisma              | ✅ Pas de problème       |
| **Type-safe**             | ❌ Besoin de typer manuellement | ✅ TypeScript end-to-end |
| **Code**                  | 5-6 lignes                      | 1-2 lignes               |
| **Performance**           | ❌ Cold start Lambda            | ✅ Pas de cold start     |
| **Recommandé Next.js 16** | ❌ Déprécié                     | ✅ Recommandé            |

## 🚀 Après la migration

1. **Supprimez** l'API Route : `app/api/auth/checkAuthorizedUser/route.ts`
2. **Testez** : L'authentification doit fonctionner sans erreur Prisma
3. **Commitez** :

```bash
git add .
git commit -m "Migrate checkAuthorizedUser to Server Action

- Replace API route with Server Action
- Fixes Prisma engine issue on Vercel
- Improves type safety and performance"
git push origin main
```

## 📚 Pour aller plus loin

Vous pouvez migrer **toutes vos API Routes qui utilisent Prisma** vers des Server Actions :

- `/api/user/linkedWallets` → `getLinkedWallets()` (déjà créé)
- `/api/shopify/isAdmin` → `checkIsAdmin()` (déjà créé)
- Etc.

**Règle simple** : Si ça utilise Prisma et c'est appelé depuis le client → Server Action !
