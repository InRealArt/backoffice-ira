module.exports = {
  plugins: [
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