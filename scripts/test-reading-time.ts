import { calculateReadingTime, calculateReadingTimeFromBlogContent } from '../lib/utils/reading-time-calculator'

console.log('🧪 Test du calculateur de temps de lecture\n')

// Test 1: Contenu vide
console.log('Test 1: Contenu vide')
console.log('Résultat:', calculateReadingTime(''), 'minutes (attendu: 1)')
console.log()

// Test 2: Texte simple
console.log('Test 2: Texte simple (220 mots)')
const words220 = Array(220).fill('mot').join(' ')
console.log('Résultat:', calculateReadingTime(words220), 'minutes (attendu: 1)')
console.log()

// Test 3: HTML avec contenu
console.log('Test 3: HTML avec contenu')
const htmlContent = `
<html>
  <head><title>Test</title></head>
  <body>
    <h1>Titre principal de l'article</h1>
    <p>Ceci est un paragraphe avec du contenu textuel pour tester le calcul du temps de lecture. Il contient plusieurs mots pour simuler un vrai article de blog avec du contenu substantiel.</p>
    <div>
      <p>Un autre paragraphe dans une div avec encore plus de contenu pour augmenter le nombre de mots et voir comment le calcul se comporte avec plus de texte.</p>
      <ul>
        <li>Premier élément de liste avec du texte</li>
        <li>Deuxième élément de liste avec encore plus de texte</li>
        <li>Troisième élément pour compléter la liste</li>
      </ul>
    </div>
    <p>Un dernier paragraphe pour conclure cet exemple de contenu HTML avec suffisamment de mots pour tester le calcul du temps de lecture de manière réaliste.</p>
  </body>
</html>
`
console.log('Résultat:', calculateReadingTime(htmlContent), 'minutes')
console.log()

// Test 4: Contenu JSON de blog
console.log('Test 4: Contenu JSON de blog')
const blogContent = JSON.stringify([
    {
        id: 1,
        elements: [
            {
                type: 'h2',
                content: 'Introduction à notre sujet principal'
            },
            {
                type: 'paragraph',
                content: 'Ceci est un paragraphe d\'introduction qui explique le sujet de l\'article. Il contient plusieurs phrases pour donner du contexte et introduire les concepts principaux qui seront développés dans la suite de l\'article.'
            },
            {
                type: 'h3',
                content: 'Première sous-section importante'
            },
            {
                type: 'paragraph',
                content: 'Voici le développement de la première partie de notre article. Cette section contient des informations détaillées et des explications approfondies sur le premier aspect du sujet traité.'
            },
            {
                type: 'list',
                items: [
                    'Premier point important à retenir',
                    'Deuxième point avec des détails supplémentaires',
                    'Troisième point pour compléter cette liste'
                ]
            },
            {
                type: 'paragraph',
                content: 'Pour conclure cette section, nous pouvons dire que ces éléments sont essentiels pour comprendre le sujet dans son ensemble et permettent d\'avoir une vision globale de la problématique.'
            }
        ]
    }
])

console.log('Résultat:', calculateReadingTimeFromBlogContent(blogContent), 'minutes')
console.log()

console.log('✅ Tests terminés !') 