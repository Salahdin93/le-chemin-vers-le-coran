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
        // Primary accent – fully dynamic via CSS variable
        accent: 'var(--accent-color)',
        primary: 'var(--accent-color)',

        // Premium fixed palette
        emerald: '#10b981',
        gold: '#f59e0b',
        navy: '#0d1b2a',

        // Theme-aware semantic tokens
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
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'emerald-glow': 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.15) 0%, transparent 60%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0,0,0,0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0,0,0,0.2)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.4)',
        'glow-gold': '0 0 20px rgba(245,158,11,0.35)',
        'glow-primary': '0 0 20px var(--accent-color)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
      },
      keyframes: {
        logoPop: {
          '0%': { transform: 'scale(0.2)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: { 'to': { opacity: '1' } },
        fadeOut: { 'to': { opacity: '0', visibility: 'hidden' } },
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(16,185,129,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(16,185,129,0.6)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        logoPop: 'logoPop 2s ease',
        fadeIn: 'fadeIn 1.5s ease-in forwards',
        fadeOut: 'fadeOut 1s ease-out 4s forwards',
        fadeSlideUp: 'fadeSlideUp 0.5s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite',
        slideIn: 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
      },
    },
  },
  plugins: [],
}