# Exemples d'utilisation de l'i18n avec next-intl

## 🎯 Objectif

Ce document fournit des exemples pratiques d'utilisation du système de traduction dans l'application.

## 📦 Imports nécessaires

### Pour les Server Components

```typescript
import { getTranslations } from "next-intl/server";
```

### Pour les Client Components

```typescript
"use client";
import { useTranslations } from "next-intl";
```

### Pour la navigation

```typescript
import { Link, useRouter, redirect } from "@/i18n/navigation";
```

## 💡 Exemples pratiques

### 1. Utiliser les traductions dans un Server Component

```tsx
// app/[locale]/(protected)/dashboard/page.tsx
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("overview")}</p>
    </div>
  );
}
```

### 2. Utiliser les traductions dans un Client Component

```tsx
"use client";
import { useTranslations } from "next-intl";

export default function DashboardStats() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <div>
      <h2>{t("stats")}</h2>
      <button>{tCommon("save")}</button>
    </div>
  );
}
```

### 3. Navigation avec locale automatique

```tsx
"use client";
import { Link, useRouter } from "@/i18n/navigation";

export default function MyComponent() {
  const router = useRouter();

  const handleClick = () => {
    // La locale est automatiquement préservée
    router.push("/art/create");
  };

  return (
    <div>
      {/* Le Link ajoute automatiquement la locale */}
      <Link href="/dashboard">Dashboard</Link>

      <button onClick={handleClick}>Create Artwork</button>
    </div>
  );
}
```

### 4. Redirection côté serveur

```tsx
import { redirect } from "@/i18n/navigation";

export default async function MyServerAction() {
  // La locale est automatiquement ajoutée
  redirect("/dashboard");
}
```

### 5. Traductions avec interpolation

#### Dans messages/fr.json :

```json
{
  "welcome": "Bienvenue, {name}!",
  "itemCount": "Vous avez {count} œuvres"
}
```

#### Dans messages/en.json :

```json
{
  "welcome": "Welcome, {name}!",
  "itemCount": "You have {count} artworks"
}
```

#### Utilisation :

```tsx
"use client";
import { useTranslations } from "next-intl";

export default function WelcomeMessage({ userName, artworkCount }) {
  const t = useTranslations("common");

  return (
    <div>
      <h1>{t("welcome", { name: userName })}</h1>
      <p>{t("itemCount", { count: artworkCount })}</p>
    </div>
  );
}
```

### 6. Traductions avec pluralisation

#### Dans messages/fr.json :

```json
{
  "items": "{count, plural, =0 {Aucune œuvre} =1 {Une œuvre} other {# œuvres}}"
}
```

#### Dans messages/en.json :

```json
{
  "items": "{count, plural, =0 {No artworks} =1 {One artwork} other {# artworks}}"
}
```

#### Utilisation :

```tsx
const t = useTranslations("art");
return <p>{t("items", { count: artworkCount })}</p>;
```

### 7. Traductions de dates et nombres

```tsx
import { useFormatter } from "next-intl";

export default function FormattedData() {
  const format = useFormatter();

  const date = new Date("2025-01-15");
  const price = 1500.5;

  return (
    <div>
      {/* Date formatée selon la locale */}
      <p>{format.dateTime(date, { dateStyle: "long" })}</p>

      {/* Prix formaté selon la locale */}
      <p>{format.number(price, { style: "currency", currency: "EUR" })}</p>
    </div>
  );
}
```

### 8. Obtenir la locale actuelle

```tsx
"use client";
import { useParams } from "next/navigation";

export default function MyComponent() {
  const params = useParams();
  const locale = params.locale; // 'fr' ou 'en'

  return <div>Locale actuelle : {locale}</div>;
}
```

### 9. Traductions imbriquées

#### Dans messages/fr.json :

```json
{
  "form": {
    "title": "Créer une œuvre",
    "fields": {
      "name": "Nom",
      "description": "Description",
      "price": "Prix"
    },
    "validation": {
      "required": "Ce champ est requis",
      "minLength": "Minimum {min} caractères"
    }
  }
}
```

#### Utilisation :

```tsx
const t = useTranslations("form");

return (
  <form>
    <h1>{t("title")}</h1>

    <label>{t("fields.name")}</label>
    <input />
    <span>{t("validation.required")}</span>

    <label>{t("fields.description")}</label>
    <textarea />
  </form>
);
```

### 10. Rich Text (HTML dans les traductions)

#### Dans messages/fr.json :

```json
{
  "termsAndConditions": "J'accepte les <terms>conditions d'utilisation</terms> et la <privacy>politique de confidentialité</privacy>"
}
```

#### Utilisation :

```tsx
import { useTranslations } from "next-intl";

export default function TermsCheckbox() {
  const t = useTranslations("legal");

  return (
    <label>
      {t.rich("termsAndConditions", {
        terms: (chunks) => <a href="/terms">{chunks}</a>,
        privacy: (chunks) => <a href="/privacy">{chunks}</a>,
      })}
    </label>
  );
}
```

## 🎨 Exemples de mise à jour de composants existants

### Avant (sans i18n) :

```tsx
export default function SignInPage() {
  return (
    <div>
      <h1>Se connecter</h1>
      <button>Connexion</button>
    </div>
  );
}
```

### Après (avec i18n) :

```tsx
import { useTranslations } from "next-intl";

export default function SignInPage() {
  const t = useTranslations("auth");

  return (
    <div>
      <h1>{t("signIn")}</h1>
      <button>{t("signIn")}</button>
    </div>
  );
}
```

## 🔧 Bonnes pratiques

1. **Organisation des clés** : Utilisez des namespaces logiques (auth, dashboard, common, etc.)
2. **Nommage** : Utilisez camelCase pour les clés de traduction
3. **Réutilisation** : Mettez les traductions communes dans le namespace `common`
4. **Typage** : Les traductions sont automatiquement typées par next-intl
5. **Fallback** : Toujours fournir une traduction par défaut en français

## 📚 Référence des namespaces disponibles

- `common` : Boutons, actions communes (save, cancel, delete, etc.)
- `auth` : Authentification (signIn, signUp, password, etc.)
- `dashboard` : Tableau de bord
- `art` : Gestion des œuvres d'art
- `navigation` : Navigation et menus

## 🚀 Pour aller plus loin

- Consultez la [documentation officielle de next-intl](https://next-intl-docs.vercel.app/)
- Ajoutez de nouvelles clés dans `messages/fr.json` et `messages/en.json`
- Créez de nouveaux namespaces selon vos besoins
