// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Superficies */
        app: 'var(--bg-app)',
        panel: 'var(--bg-panel)',
        chat: 'var(--bg-chat)',
        hover: 'var(--bg-hover)',
        selected: 'var(--bg-selected)',
        muted: 'var(--bg-muted)',

        /* Texto */
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',

        /* Bordes */
        'border-soft': 'var(--border-soft)',
        'border-mid': 'var(--border-mid)',
        'border-strong': 'var(--border-strong)',

        /* Primario */
        primary: {
          DEFAULT: 'var(--c-primary)',
          dark: 'var(--c-primary-dark)',
          soft: 'var(--c-primary-soft)',
          border: 'var(--c-primary-border)',
        },
        secondary: {
          DEFAULT: 'var(--c-secondary)',
          soft: 'var(--c-secondary-soft)',
        },

        /* Estados */
        online: {
          DEFAULT: 'var(--c-online)',
          soft: 'var(--c-online-soft)',
        },
        pending: {
          DEFAULT: 'var(--c-pending)',
          soft: 'var(--c-pending-soft)',
        },
        attention: {
          DEFAULT: 'var(--c-attention)',
          soft: 'var(--c-attention-soft)',
        },
        closed: {
          DEFAULT: 'var(--c-closed)',
          soft: 'var(--c-closed-soft)',
        },
        danger: {
          DEFAULT: 'var(--c-danger)',
          soft: 'var(--c-danger-soft)',
        },
        success: 'var(--c-online)',
        warning: 'var(--c-pending)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};