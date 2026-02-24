/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Renommage pour la clarté : la couleur principale est maintenant "accent"
        accent: 'var(--accent-color)',
        // Garder `primary` par compatibilité, pointant vers accent
        primary: 'var(--accent-color)',
        
        // Nouvelles couleurs d'accent vives
        'accent-orange': '#F57C00', // Orange vibrant
        'accent-blue': '#1976D2',   // Bleu électrique
        'accent-green': '#00796B',  // Vert émeraude

        // Variables de thème globales
        'bg-main': 'var(--bg)',
        'text-main': 'var(--text)',
        'card-bg': 'var(--card-bg)',
        'border-main': 'var(--border-color)',
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        danger: 'var(--danger-color)',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
      },
      keyframes: {
        logoPop: {
          '0%': { transform: 'scale(0.2)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          'to': { opacity: '1' },
        },
        fadeOut: {
          'to': { opacity: '0', visibility: 'hidden' },
        },
        zoomOut: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.3)', opacity: '0' },
        }
      },
      animation: {
        logoPop: 'logoPop 2s ease',
        fadeIn: 'fadeIn 1.5s ease-in forwards',
        fadeOut: 'fadeOut 1s ease-out 4s forwards',
        zoomOut: 'zoomOut 3s ease forwards 1s',
      }
    },
  },
  plugins: [],
}