# Système de création d'articles SEO — Analyse technique

## Architecture globale

Le module est structuré en 4 couches :

1. **Présentation** — pages RSC + composants React client
2. **Logique métier** — server actions (`'use server'`)
3. **Génération de contenu** — utilitaires HTML/JSON-LD
4. **Persistance** — Prisma + PostgreSQL (schema `landing`)

---

## Routes

| Route | Fichier | Rôle |
|---|---|---|
| `/landing/seo-posts` | `app/(admin)/landing/seo-posts/page.tsx` | Liste avec filtres |
| `/landing/seo-posts/create` | `app/(admin)/landing/seo-posts/create/page.tsx` | Création (alias de `/new`) |
| `/landing/seo-posts/new` | `app/(admin)/landing/seo-posts/new/page.tsx` | Création (doublon historique) |
| `/landing/seo-posts/[id]/edit` | `app/(admin)/landing/seo-posts/[id]/edit/page.tsx` | Édition par ID |

Les pages création et édition partagent le même composant `<SeoPostForm>` — la prop `isEditing` bascule le mode.

---

## Composant central : `SeoPostForm`

**Fichier :** `app/(admin)/landing/seo-posts/components/SeoPostForm.tsx` (~730 lignes)

### Props

```typescript
interface SeoPostFormProps {
  categories: SeoCategory[]
  seoPost?: SeoPost | null   // null = mode création
  isEditing?: boolean        // false par défaut
}
```

### Validation Zod (lignes 24-41)

```typescript
const formSchema = z.object({
  title: z.string().min(1),
  categoryId: z.string().min(1),
  metaDescription: z.string().min(1),
  metaKeywords: z.string().optional(),  // géré par useState séparé
  slug: z.string().min(1),
  content: z.string().min(1),
  blogContent: z.any().optional(),
  excerpt: z.string().optional(),
  author: z.string().min(1),
  authorLink: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  pinned: z.boolean().optional(),
  mainImageUrl: z.string().optional(),
  mainImageAlt: z.string().optional(),
  mainImageCaption: z.string().optional(),
  creationDate: z.date().optional(),
})
```

> `keywords` et `tags` sont des `string[]` gérés en `useState` séparé avec validation manuelle dans `onSubmit`.

### États principaux

| État | Type | Rôle |
|---|---|---|
| `keywords` | `string[]` | Mots-clés SEO (métadonnées) |
| `tags` | `string[]` | Tags de l'article |
| `blogContent` | `BlogContent` | Contenu structuré JSON de l'éditeur |
| `isSEOAssistantOpen` | `boolean` | Ouverture de la modal SEO assistant |
| `generatedSlug` | `string` | Slug auto-généré depuis le titre |
| `availableLanguages` | `Language[]` | Langues pour l'auto-traduction |

### Comportements automatiques (useEffect)

- **Initialisation édition** (lignes 109-134) : parse `metaKeywords`, `listTags`, `content` depuis `seoPost`
- **Chargement langues** (lignes 137-150) : appel client `getAllLanguages()` pour l'auto-traduction
- **Slug auto** (lignes 204-210) : `generateSlug(title)` à chaque changement de titre
- **Ouverture accordéons** (lignes 213-272) : ouvre automatiquement les sections contenant des erreurs de validation

### Actions rapides en mode édition

- **Publish/Unpublish** : appelle directement `updateSeoPost(id, { status })` sans re-soumettre
- **Pin/Unpin** : appelle `pinSeoPost(id)` qui synchronise sur toutes les traductions du groupe

---

## Server Actions

**Fichier :** `lib/actions/seo-post-actions.ts`

### `createSeoPost(data)` — Pipeline en 8 étapes

```
1. Résolution langue par défaut (prisma.language.findFirst { isDefault: true })
2. Parse JSON content → BlogContent
3. Build SeoPostData
4. generateSeoHtml() → calculateReadingTime()
5. generateSeoJsonLd() + generateSeoHtml() (avec readTime) + generateArticleHtml()
6. prisma.seoPost.create({ title, slug, content, generatedHtml, jsonLd, ... })
7. SQL raw UPDATE listTags + upsert SeoTag + create SeoPostTag
8. Si autoTranslate: handleSeoPostTranslationsOnUpdate().then() [NON BLOQUANT]
```

### `updateSeoPost(id, data)`

Même pipeline de génération, puis :
- Mise à jour des tags : `deleteMany` + re-création
- Synchronisation statut/épinglage sur toutes les traductions si post pivot
- Re-traduction asynchrone si contenu modifié

### `pinSeoPost(id)`

Logique de groupe : identifie le post pivot (`originalPostId = null`), collecte tous les IDs (pivot + traductions), dépingle tout ce qui est hors groupe, puis épingle tout le groupe.

### `getAllSeoPosts()` / `getSeoPostById(id)`

Récupèrent avec `include: { language, category, tags: { include: { tag } } }`.

---

## Schéma Prisma

**Fichier :** `prisma/schema.prisma` — schema PostgreSQL `landing`

### `SeoPost` (lignes 1308-1346)

```
id                   Int        @id @default(autoincrement())
languageId           Int
originalPostId       Int?       -- null = post original, sinon = traduction
title                String
mainImageUrl         String?
mainImageAlt         String?
mainImageCaption     String?
metaDescription      String
metaKeywords         String[]
content              String     -- JSON BlogContent sérialisé
slug                 String
excerpt              String?
status               PostStatus @default(DRAFT)
createdAt            DateTime   @default(now())
updatedAt            DateTime   @updatedAt
author               String
authorLink           String?
viewsCount           Int        @default(0)
estimatedReadTime    Int?       -- calculé automatiquement en minutes
generatedHtml        String?    -- HTML complet pré-généré
generatedArticleHtml String?    -- fragment <article> pré-généré
jsonLd               String?    -- JSON-LD Schema.org
pinned               Boolean    @default(false)
categoryId           Int
listTags             String[]   -- doublon des tags pour lisibilité rapide

@@unique([slug, languageId])
```

### Relations

```
SeoCategory  1──* SeoPost
Language     1──* SeoPost
SeoPost      1──* SeoPost     (self-relation: original → traductions)
SeoPost      *──* SeoTag      (via SeoPostTag pivot)
```

### Enum `PostStatus`

```
DRAFT | PUBLISHED
```

---

## Générateurs HTML/SEO

**Fichier :** `lib/utils/seo-generators.ts`

| Fonction | Rôle |
|---|---|
| `generateSeoJsonLd(postData)` | JSON-LD Schema.org `BlogPosting` |
| `generateSeoHtml(postData)` | Document HTML complet (meta, OG, Twitter Card, article) |
| `generateArticleHtml(postData)` | Fragment `<article>` seul |

La génération est effectuée **au moment de la sauvegarde**, pas à la lecture — cela évite la re-génération côté frontend public.

### Types de contenu supportés par `generateBlogContentHtml`

`H2`, `H3`, `PARAGRAPH` (avec rich content : liens, gras, italique, souligné), `IMAGE`, `VIDEO`, `LIST`, `ORDERED_LIST`, `ACCORDION`

---

## Éditeur de contenu blog (BlogEditor)

**Dossier :** `app/components/BlogEditor/`

### Types (`types.ts`)

```
BlogContent        = BlogSection[]
BlogSection        = { id, title, elements: ContentElement[] }
ContentElement     = H2 | H3 | PARAGRAPH | IMAGE | VIDEO | LIST | ORDERED_LIST | ACCORDION
RichContent        = { segments: TextSegment[] }
TextSegment        = { id, text, isLink, linkUrl, linkText, isBold, isItalic, isUnderline }
```

### Composants

| Composant | Rôle |
|---|---|
| `BlogContentEditor.tsx` | Orchestrateur principal, délègue à `useSectionOrdering` |
| `BlogSection.tsx` | Section éditable avec factory `createNewElement(type)` |
| `hooks/useSectionOrdering.ts` | État sections : add, update, delete, moveUp/moveDown |

À chaque changement, `onChange(sections)` → `setValue('content', JSON.stringify(sections))` dans le formulaire parent.

---

## Système de traduction automatique

**Fichier :** `lib/services/translation-service.ts`

### API utilisée

Google Translate **non officielle** (`client=gtx`) :
```
https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl={lang}&dt=t&q={texte}
```

> Attention : API informelle sans garantie de stabilité ni quota.

### `translateSeoPostFields(fields, targetLanguageCode)`

Traduit en parallèle :
- Champs simples : `title`, `metaDescription`, `excerpt`, `mainImageAlt`, `mainImageCaption`
- Tableaux : `metaKeywords`, `listTags` (item par item)
- Contenu JSON structuré : via `translateJsonContent()` (récursif sur les sections)
- Champs HTML : via le service `html-translation-service.ts`

Génère le slug de la traduction : `{code}-{titre-traduit-slugifié}`

Fallback si Google Translate échoue : préfixe `[CODE]` sur chaque champ.

### `handleSeoPostTranslationsOnUpdate(postId, updatedFields)`

Appelé de façon **non-bloquante** (`.then()` sans `await`) depuis `createSeoPost` et `updateSeoPost` :

1. Récupère toutes les langues non-par-défaut
2. Pour chaque langue : traduit, puis `create` ou `update` selon existence

---

## SEO Assistant

**Dossier :** `app/components/SEOAssistant/`

Modal accessible depuis un bouton flottant dans le formulaire. 3 onglets :

1. **Preview** — rendu visuel de l'article via `BlogPreviewRenderer`
2. **HTML Structure** — code HTML pré-généré dans un `<pre>`
3. **SEO Score** — analyse automatique via `SEOScoreAnalyzer`

### Critères `SEOScoreAnalyzer` (6 critères × 10pts)

| Critère | Condition optimale |
|---|---|
| Titre H1 | 30-60 caractères |
| Meta description | 150-160 caractères |
| Longueur contenu | ≥1500 chars (≥300 = 7pts) |
| Mot-clé dans le titre | Présence d'un keyword |
| Slug (URL) | ≤60 caractères |
| Image principale | Présence d'une URL |

---

## Composants UI réutilisables

| Composant | Fichier | Rôle |
|---|---|---|
| `TagInput` | `app/components/Forms/TagInput.tsx` | Input de tags avec Enter/Backspace, max configurable, animation |
| `Accordion` | `app/components/Accordion/` | Sections repliables, état contrôlé par le formulaire parent |
| `InputField` | `app/components/Forms/InputField.tsx` | Input texte avec label + erreur RHF |
| `TextareaField` | `app/components/Forms/TextareaField.tsx` | Textarea avec props similaires |
| `SelectField` | `app/components/Forms/SelectField.tsx` | Select avec options |
| `DatePickerField` | `app/components/Forms/DatePickerField.tsx` | Sélecteur de date |

---

## Utilitaires

### `generateSlug` — `lib/utils.ts` (lignes 104-118)

1. Gestion des ligatures (`œ→oe`, `æ→ae`)
2. Suppression des apostrophes typographiques
3. `normalize('NFD')` + suppression des diacritiques
4. Lowercase, suppression non-alphanumériques, espaces→tirets

### `calculateReadingTime` — `lib/utils/reading-time-calculator.ts`

Extrait le texte brut du HTML, compte les mots, divise par 220 mots/min. Minimum 1 minute.

---

## Flux complet de création

```
[Utilisateur] saisit le formulaire
  │
  ├─ Titre → useEffect → generateSlug() → setValue('slug')
  ├─ Keywords/Tags → useState[]
  ├─ BlogContentEditor → useSectionOrdering → setValue('content', JSON.stringify)
  │
  ▼
[onSubmit] validation Zod + manuelle (keywords.length > 0, tags.length > 0)
  │
  ├─ Formate : { categoryId: parseInt, metaKeywords: keywords, listTags: tags }
  ├─ Si création : { autoTranslate: true, targetLanguageCodes: [...] }
  │
  ▼
[createSeoPost()] server action
  │
  ├─ 1. Langue par défaut
  ├─ 2. Parse content JSON
  ├─ 3-5. Génération HTML + JSON-LD + calcul temps de lecture
  ├─ 6. prisma.seoPost.create()
  ├─ 7. Mise à jour tags (raw SQL + upsert)
  └─ 8. handleSeoPostTranslationsOnUpdate().then() [non-bloquant]
          └─ Google Translate → create/update pour chaque langue
  │
  revalidatePath('/landing/seo-posts')
  return { success: true }
  │
  ▼
[SeoPostForm] → toast succès → setTimeout(1s) → redirect liste
```

---

## Points de vigilance

| Problème | Détail |
|---|---|
| Double route `/create` et `/new` | Pages identiques — doublon historique à nettoyer |
| API Google Translate non officielle | `client=gtx` — sans quota ni garantie de stabilité |
| Raw SQL pour `listTags` | `prisma.$executeRaw` pour les tableaux PostgreSQL — dette technique |
| Slug verrouillé à la création | Champ `disabled` en mode création — personnalisation uniquement via édition post-création |

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `app/(admin)/landing/seo-posts/components/SeoPostForm.tsx` | Formulaire central (création + édition) |
| `lib/actions/seo-post-actions.ts` | CRUD + orchestration traduction |
| `lib/services/translation-service.ts` | Traduction automatique |
| `lib/utils/seo-generators.ts` | Génération HTML/JSON-LD |
| `app/components/BlogEditor/types.ts` | Types du contenu structuré |
| `app/components/BlogEditor/BlogContentEditor.tsx` | Éditeur de contenu par sections |
| `app/components/BlogEditor/hooks/useSectionOrdering.ts` | État sections |
| `app/components/SEOAssistant/SEOScoreAnalyzer.tsx` | Score SEO temps réel |
| `app/(admin)/landing/seo-posts/SeoPostClient.tsx` | Liste filtrée + triée |
| `prisma/schema.prisma` (lignes 1294-1391) | Schéma DB des modèles SEO |
