/**
 * Script d'analyse CSS pour trouver les classes inutilisées
 * Exécuter avec: node scripts/analyze-css.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const cssFiles = glob.sync('./app/styles/**/*.scss');
const jsxFiles = glob.sync('./app/**/*.{js,jsx,ts,tsx}');
const excludedPaths = ['node_modules', '.next'];

// Extrait les classes CSS des fichiers SCSS
function extractCssClasses(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Regex pour trouver les classes CSS (simplifiée)
  const classRegex = /\.([\w-]+)\s*(?:{|,|::|:)/g;
  const results = [];
  let match;
  
  while ((match = classRegex.exec(content)) !== null) {
    // Éviter les sélecteurs qui commencent par des pseudo-classes ou éléments
    if (!match[1].startsWith(':')) {
      results.push(match[1]);
    }
  }
  
  return [...new Set(results)]; // Éliminer les doublons
}

// Extrait les classes utilisées dans les fichiers JSX/TSX
function extractJsxClassUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Regex pour trouver les classes dans className
  const classNameRegex = /className\s*=\s*(?:"|'|{`|{")([^"'`}]*)/g;
  const results = [];
  let match;
  
  while ((match = classNameRegex.exec(content)) !== null) {
    // Diviser par espaces pour obtenir toutes les classes
    const classes = match[1].split(/\s+/);
    results.push(...classes.filter(c => c.trim() !== ''));
  }
  
  return [...new Set(results)]; // Éliminer les doublons
}

// Fonction principale
async function analyzeCSS() {
  console.log('🔍 Démarrage de l\'analyse CSS...');
  
  // 1. Extraire toutes les classes CSS définies
  let allCssClasses = [];
  console.log('\n📂 Analyse des fichiers SCSS:');
  cssFiles.forEach(file => {
    const classes = extractCssClasses(file);
    console.log(`  ${path.relative('.', file)}: ${classes.length} classes`);
    allCssClasses.push(...classes);
  });
  allCssClasses = [...new Set(allCssClasses)];
  console.log(`\n🎨 Total des classes CSS définies: ${allCssClasses.length}`);
  
  // 2. Extraire toutes les classes utilisées dans JSX/TSX
  let allJsxClasses = [];
  console.log('\n📂 Analyse des fichiers JSX/TSX:');
  jsxFiles.forEach(file => {
    const classes = extractJsxClassUsage(file);
    if (classes.length > 0) {
      console.log(`  ${path.relative('.', file)}: ${classes.length} classes utilisées`);
    }
    allJsxClasses.push(...classes);
  });
  allJsxClasses = [...new Set(allJsxClasses)];
  console.log(`\n🧩 Total des classes utilisées dans JSX/TSX: ${allJsxClasses.length}`);
  
  // 3. Identifier les classes inutilisées
  const unusedClasses = allCssClasses.filter(cls => !allJsxClasses.includes(cls));
  console.log(`\n🗑️ Total des classes potentiellement inutilisées: ${unusedClasses.length}`);
  
  // 4. Identifier les classes utilisées mais non définies
  const undefinedClasses = allJsxClasses.filter(cls => !allCssClasses.includes(cls) && 
                                                 cls.trim() !== '' && 
                                                 !cls.startsWith('{') && 
                                                 !cls.includes('$'));
  console.log(`\n⚠️ Classes utilisées mais potentiellement non définies: ${undefinedClasses.length}`);
  
  // 5. Enregistrer les résultats dans un fichier
  const report = {
    totalCssClasses: allCssClasses.length,
    totalJsxClasses: allJsxClasses.length,
    unusedClasses: unusedClasses,
    undefinedClasses: undefinedClasses,
    potentialSavingsPercentage: Math.round((unusedClasses.length / allCssClasses.length) * 100)
  };
  
  fs.writeFileSync('./css-analysis-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n📊 Résumé:');
  console.log(`  Classes CSS définies: ${allCssClasses.length}`);
  console.log(`  Classes utilisées dans JSX: ${allJsxClasses.length}`);
  console.log(`  Classes potentiellement inutilisées: ${unusedClasses.length} (${report.potentialSavingsPercentage}% d'économie potentielle)`);
  console.log(`  Rapport complet enregistré dans css-analysis-report.json`);
  
  // Afficher quelques exemples de classes inutilisées
  if (unusedClasses.length > 0) {
    console.log('\n📝 Exemples de classes potentiellement inutilisées:');
    console.log('  ' + unusedClasses.slice(0, 15).join(', ') + (unusedClasses.length > 15 ? '...' : ''));
  }
  
  // Afficher quelques exemples de classes non définies
  if (undefinedClasses.length > 0) {
    console.log('\n📝 Exemples de classes utilisées mais potentiellement non définies:');
    console.log('  ' + undefinedClasses.slice(0, 15).join(', ') + (undefinedClasses.length > 15 ? '...' : ''));
  }
  
  console.log('\n✅ Analyse terminée!');
}

analyzeCSS().catch(console.error); 