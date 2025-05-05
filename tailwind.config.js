/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          100: '#2D2D2D',
          200: '#1E1E1E',
          300: '#121212',
        },
      },
      fontFamily: {
        arabic: ['"Amiri"', 'Arial', 'sans-serif'],
      },
      animation: {
        'scroll-hint': 'scroll-hint 1.5s ease-in-out infinite',
      },
      keyframes: {
        'scroll-hint': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
      },
    },
  },
  plugins: [],
};


