
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          light: '#DCF8C6',
          dark: '#075E54',
          green: '#128C7E',
          teal: '#25D366',
          background: '#ECE5DD',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'typing': 'typing 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
