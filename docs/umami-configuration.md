# Configuration Umami Analytics

Ce document explique comment configurer Umami Analytics pour afficher les statistiques des œuvres dans le backoffice.

## Configuration Umami Cloud (recommandé)

Si vous utilisez [Umami Cloud](https://umami.is/docs/cloud/api-key), la configuration est simplifiée.

### Variables d'environnement requises

Ajoutez les variables suivantes dans votre fichier `.env.local` ou `.env` :

```env
# Configuration Umami Cloud
UMAMI_API_KEY=votre-api-key
UMAMI_API_CLIENT_ENDPOINT=https://api.umami.is/v1
UMAMI_WEBSITE_ID=votre-website-id
```

### Comment obtenir votre clé API

1. Connectez-vous à [Umami Cloud](https://app.umami.is)
2. Cliquez sur le menu déroulant dans la barre latérale
3. Cliquez sur **Settings**
4. Naviguez vers **API keys**
5. Cliquez sur **Create key**
6. Copiez votre clé API (vous pouvez la révéler en cliquant sur l'icône "visible")

Référence : [Documentation Umami Cloud - API Key](https://umami.is/docs/cloud/api-key)

### UMAMI_WEBSITE_ID

L'ID du site web configuré dans Umami pour lequel vous souhaitez récupérer les statistiques. C'est généralement l'ID du site `inrealart.com`.

Pour obtenir l'ID :

1. Connectez-vous à Umami Cloud
2. Allez dans la section "Websites"
3. Trouvez le site correspondant à `inrealart.com`
4. L'ID du site est visible dans l'URL ou dans les paramètres du site

## Configuration instance auto-hébergée

Si vous utilisez une instance Umami auto-hébergée, utilisez :

```env
# Configuration Umami (instance auto-hébergée)
UMAMI_API_ENDPOINT=https://votre-instance-umami.com/api
UMAMI_API_KEY=votre-api-key
UMAMI_WEBSITE_ID=votre-website-id
```

### UMAMI_API_ENDPOINT

L'URL de base de votre instance Umami avec le chemin `/api`. Par exemple :

- `https://analytics.inrealart.com/api`
- `https://umami.example.com/api`

## Utilisation

Une fois configuré, les statistiques Umami seront automatiquement disponibles dans la page `/art/my-artworks` :

1. Cliquez sur le bouton "Statistiques" dans la colonne "Actions"
2. Une modale s'ouvre avec :
   - Les statistiques globales (30 derniers jours) : pages vues, visiteurs uniques, visites, taux de rebond
   - Un graphique des vues mensuelles (12 derniers mois)
   - Un détail par mois

## Format des URLs suivies

Les statistiques sont récupérées pour les URLs au format :

```
https://www.inrealart.com/artwork/<slug-oeuvre>
```

Le slug est généré automatiquement à partir du nom de l'œuvre en utilisant la fonction `normalizeString()`.

## Dépannage

### Erreur "UMAMI_API_KEY n'est pas configuré"

Vérifiez que la clé API est bien définie dans votre fichier `.env.local`. Pour Umami Cloud, utilisez `UMAMI_API_CLIENT_ENDPOINT=https://api.umami.is/v1`.

### Erreur "UMAMI_WEBSITE_ID n'est pas configuré"

Assurez-vous que l'ID du site web est correct et correspond bien au site `inrealart.com` dans votre instance Umami.

### Limites de l'API

Chaque clé API Umami Cloud est limitée à **50 appels toutes les 15 secondes**. Si vous dépassez cette limite, vous recevrez une erreur de rate limiting.

### Aucune statistique disponible

- Vérifiez que Umami suit bien les pages `/artwork/<slug>`
- Assurez-vous que le slug généré correspond à l'URL réelle de la page
- Vérifiez que les données sont bien collectées dans Umami pour cette URL

## Documentation Umami

Pour plus d'informations sur l'API Umami, consultez :

- [Documentation Umami API](https://umami.is/docs/api)
- [Umami Cloud - API Key](https://umami.is/docs/cloud/api-key)
- [Umami API Client](https://github.com/umami-software/api-client)
