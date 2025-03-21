/**
 * Script pour nettoyer manuellement les classes CSS inutilisées
 * Exécuter avec: node scripts/clean-css.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Charger le rapport d'analyse
if (!fs.existsSync('./css-analysis-report.json')) {
  console.error('❌ Fichier css-analysis-report.json introuvable. Exécutez d\'abord npm run analyze-css');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync('./css-analysis-report.json', 'utf8'));
const unusedClasses = report.unusedClasses;

// Fonction pour rechercher une classe dans tous les fichiers SCSS
async function findClassInFiles(className) {
  const scssFiles = fs.readdirSync('./app/styles', { recursive: true })
    .filter(file => file.endsWith('.scss'))
    .map(file => path.join('./app/styles', file));
  
  const results = [];
  
  for (const file of scssFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`.${className}`)) {
        results.push({
          file,
          line: i + 1,
          content: lines[i].trim()
        });
      }
    }
  }
  
  return results;
}

// Interface pour interagir avec l'utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser() {
  console.log(`\n🔍 ${unusedClasses.length} classes CSS inutilisées trouvées.`);
  
  if (unusedClasses.length === 0) {
    console.log('✅ Aucune classe inutilisée à nettoyer!');
    rl.close();
    return;
  }
  
  console.log('\nQue souhaitez-vous faire?');
  console.log('1. Rechercher une classe spécifique');
  console.log('2. Afficher les 20 premières classes inutilisées');
  console.log('3. Générer un fichier CSS de sauvegarde avec seulement les classes utilisées');
  console.log('4. Quitter');
  
  rl.question('\nChoisissez une option (1-4): ', async (answer) => {
    switch (answer) {
      case '1':
        rl.question('Entrez le nom de la classe à rechercher: ', async (className) => {
          const results = await findClassInFiles(className);
          
          if (results.length === 0) {
            console.log(`❌ Classe "${className}" non trouvée dans les fichiers SCSS.`);
          } else {
            console.log(`\n✅ Classe "${className}" trouvée dans ${results.length} occurrence(s):`);
            results.forEach(result => {
              console.log(`  ${result.file}:${result.line} - ${result.content}`);
            });
          }
          
          promptUser();
        });
        break;
        
      case '2':
        console.log('\n📋 20 premières classes inutilisées:');
        for (let i = 0; i < Math.min(20, unusedClasses.length); i++) {
          const className = unusedClasses[i];
          const results = await findClassInFiles(className);
          
          if (results.length > 0) {
            console.log(`${i+1}. .${className} - Trouvée dans ${results.length} fichier(s), ex: ${results[0].file}:${results[0].line}`);
          } else {
            console.log(`${i+1}. .${className} - Aucune occurrence trouvée (peut être générée dynamiquement)`);
          }
        }
        
        promptUser();
        break;
        
      case '3':
        // Récupérer toutes les classes utilisées depuis le rapport
        const usedClasses = report.allJsxClasses || [];
        
        // Créer un fichier de sauvegarde avec des classes vides (pour préserver la structure)
        let backupCSS = '/* Fichier de sauvegarde avec seulement les classes utilisées */\n\n';
        
        usedClasses.forEach(className => {
          backupCSS += `.${className} { /* préservé */ }\n`;
        });
        
        fs.writeFileSync('./css-used-classes-backup.css', backupCSS);
        console.log('✅ Fichier de sauvegarde créé: css-used-classes-backup.css');
        
        promptUser();
        break;
        
      case '4':
        rl.close();
        break;
        
      default:
        console.log('❌ Option invalide. Veuillez choisir entre 1 et 4.');
        promptUser();
    }
  });
}

// Démarrer le script
console.log('🧹 Outil de nettoyage CSS');
console.log('======================');
promptUser(); 