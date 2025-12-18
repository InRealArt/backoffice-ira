# Configuration Multilingue FR/EN - InRealArt Backoffice

## 📋 Vue d'ensemble

L'application InRealArt Backoffice a été configurée pour supporter le multilingue (Français et Anglais) en utilisant **next-intl**, la solution recommandée pour Next.js 16 App Router.

## 🎯 Périmètre

- ✅ **Routes multilingues** : `(protected)` et `(public)`
- ❌ **Routes monolingues** : `(admin)` reste en français uniquement

## 🏗️ Architecture mise en place

### 1. Configuration i18n

#### Fichiers de configuration créés :

- **`i18n/routing.ts`** : Définit les locales supportées (en, fr) et la locale par défaut (fr)
- **`i18n/request.ts`** : Configure la récupération des messages pour chaque locale
- **`i18n/navigation.ts`** : Exporte les APIs de navigation typées (Link, useRouter, redirect, etc.)

### 2. Messages de traduction

- **`messages/fr.json`** : Contient les traductions en français
- **`messages/en.json`** : Contient les traductions en anglais

Structure des messages :

```json
{
  "common": { ... },
  "auth": { ... },
  "dashboard": { ... },
  "art": { ... },
  "navigation": { ... }
}
```

### 3. Structure des routes

```
app/
├── [locale]/                    # Routes multilingues
│   ├── layout.tsx              # Layout avec NextIntlClientProvider
│   ├── page.tsx                # Page d'accueil multilingue
│   ├── (protected)/            # Routes protégées multilingues
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   └── art/
│   └── (public)/               # Routes publiques multilingues
│       ├── sign-in/
│       ├── sign-up/
│       ├── forgot-password/
│       └── reset-password/
│
├── (admin)/                    # Routes admin (non multilingues)
│   ├── admin-art/
│   ├── blockchain/
│   ├── boAdmin/
│   ├── dataAdministration/
│   ├── landing/
│   ├── marketplace/
│   └── tools/
│
├── components/
│   ├── art/                    # Composants partagés entre admin et protected
│   │   ├── ArtworkForm/
│   │   ├── ArtistImageUpload.tsx
│   │   ├── OptionalImageUpload.tsx
│   │   ├── ProgressModal.tsx
│   │   ├── DisplayOrderManager.tsx
│   │   └── schema.ts
│   └── LanguageSwitcher/       # Sélecteur de langue
│
├── page.tsx                    # Redirige vers /fr ou /en
└── layout.tsx                  # Layout racine
```

### 4. Middleware / Proxy

Le fichier **`proxy.ts`** a été modifié pour :

- Intégrer le middleware i18n de next-intl
- Exclure les routes admin du système multilingue
- Gérer les redirections vers `/[locale]/sign-in` au lieu de `/sign-in`

### 5. Configuration Next.js

Dans **`next.config.ts`** :

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
// ...
export default withNextIntl(nextConfig);
```

## 🔧 Composants créés

### LanguageSwitcher

Composant ajouté à la Navbar permettant de basculer entre FR et EN :

```tsx
<LanguageSwitcher />
```

Il utilise les APIs de navigation de next-intl pour préserver la route actuelle lors du changement de langue.

## 📝 Utilisation

### 1. Dans les Server Components

```tsx
import { getTranslations } from "next-intl/server";

export default async function MyComponent() {
  const t = await getTranslations("common");

  return <h1>{t("welcome")}</h1>;
}
```

### 2. Dans les Client Components

```tsx
"use client";
import { useTranslations } from "next-intl";

export default function MyClientComponent() {
  const t = useTranslations("common");

  return <h1>{t("welcome")}</h1>;
}
```

### 3. Navigation

```tsx
import { Link, useRouter } from "@/i18n/navigation";

// Link automatiquement préfixé avec la locale
<Link href="/dashboard">Dashboard</Link>;

// Router qui gère automatiquement la locale
const router = useRouter();
router.push("/art/create");
```

## 🔄 URLs générées

### Routes multilingues

- `/fr/dashboard` → Dashboard en français
- `/en/dashboard` → Dashboard en anglais
- `/fr/sign-in` → Connexion en français
- `/en/sign-in` → Login en anglais

### Routes admin (sans locale)

- `/admin-art/collection`
- `/blockchain/collections`
- `/boAdmin/users`
- etc.

## ✅ Avantages de cette architecture

1. **Séparation claire** : Les routes admin restent simples, seules les routes utilisateur sont multilingues
2. **Type-safe** : Les APIs de navigation sont entièrement typées
3. **Performance** : next-intl est optimisé pour l'App Router de Next.js
4. **Maintainabilité** : Configuration centralisée dans `i18n/`
5. **SEO-friendly** : URLs propres avec préfixes de locale
6. **Composants partagés** : Les composants art sont dans `app/components/art/` et utilisables partout

## 🔮 Évolution future

Pour ajouter une nouvelle langue :

1. Créer `messages/es.json` (par exemple pour l'espagnol)
2. Ajouter `'es'` dans `i18n/routing.ts` :

```typescript
export const routing = defineRouting({
  locales: ["en", "fr", "es"],
  defaultLocale: "fr",
});
```

## 📚 Documentation

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

---

**Date de mise en place** : 18 décembre 2025  
**Version Next.js** : 16.0.10  
**Version next-intl** : Dernière version compatible
