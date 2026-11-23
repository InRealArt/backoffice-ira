module.exports = {
  plugins: [
    'tailwindcss',
    'autoprefixer',
    [
      'postcss-purgecss',
      {
        content: [
          './app/**/*.{js,ts,jsx,tsx}',
          './components/**/*.{js,ts,jsx,tsx}',
          './lib/**/*.{js,ts,jsx,tsx}',
        ],
        safelist: [
          // Classes qui doivent toujours être préservées
          // Ajouter ici les classes générées dynamiquement ou utilisées dans JS
          /^btn-/,
          /^status-/,
          /^toast-/,
          /^spinner-/,
          /^product-/,
          /^dashboard-/,
          /^role-/,
          /^blockchain-/,
          /^address-/,
          // Classes à opacité sur le doré (primary/purple) : l'extracteur par défaut de PurgeCSS coupe sur « / »
          /^((focus|hover|focus-visible|focus-within)\\?:)?(bg|border|ring|from|to|via)-(primary|purple)\\?\/(5|10|20|40|50|80|90)$/,
          // Classes pour les animations
          /^animate-/,
          // Utilitaires
          /^d-/,
          /^gap-/,
          // Préserver les classes pour les modes clairs/sombres
          'dark',
          'light',
          // Classes pour les modales
          /^modal-/,
          // Préfixes pour les classes de formulaire
          /^form-/,
          // Classes pour les structures de page
          /^page-/,
          // Classes pour les tableaux
          /^table-/,
          // Classes pour les états
          /^is-/,
          /^has-/,
          // Classes DaisyUI à préserver
          /^alert-/, /^badge-/, /^btn-/, /^card-/, /^drawer-/, /^dropdown-/, /^menu-/,
          /^tab-/, /^tooltip-/, /^loading-/, /^input-/, /^select-/, /^textarea-/,
          /^checkbox-/, /^radio-/, /^toggle-/, /^range-/, /^progress-/, /^radial-progress-/,
          /^stat-/, /^join-/, /^hero-/, /^divider-/, /^mask-/, /^swap-/, /^indicator-/,
          /^countdown-/, /^carousel-/, /^rating-/, /^stack-/, /^steps-/, /^link-/,
          /^label-/, /^artboard-/, /^mockup-/, /^collapse-/, /^chat-/,
        ],
        // Éviter la purge en développement
        rejected: process.env.NODE_ENV === 'development',
        // Activer en production uniquement
        enabled: process.env.NODE_ENV === 'production',
        // Journaliser les classes supprimées en mode verbeux
        verbose: true,
      },
    ],
  ],
}; 