/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#FAF7F2',
          light: '#FDFBF7',
          soft: '#F4EFEB',
          muted: '#EEE7DF',
          border: '#E4DCD0',
        },
        sage: {
          50: '#F2F6F3',
          100: '#E3EDE5',
          200: '#C7DACB',
          300: '#A3C2A9',
          400: '#7AA383',
          500: '#587B64',
          600: '#466450',
          700: '#385040',
          800: '#2A3C30',
        },
        moss: {
          100: '#EFF3EB',
          300: '#AEC1A3',
          500: '#7E9473',
          600: '#64785A',
        },
        clay: {
          50: '#FDF7F3',
          100: '#F7E7DD',
          300: '#E1A78B',
          500: '#BD7755',
          600: '#A46343',
        },
        ochre: {
          50: '#FEFAF0',
          100: '#FBF2D8',
          500: '#C99E3A',
        },
        earth: {
          900: '#262320',
          800: '#383430',
          700: '#4F4A45',
          600: '#68615A',
        },
        stone: {
          400: '#948D85',
          300: '#B6AEA5',
          200: '#D5CEC5',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'Newsreader',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'serif',
        ],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(46, 38, 32, 0.04)',
        'soft-md': '0 4px 16px rgba(46, 38, 32, 0.07)',
        'soft-lg': '0 8px 24px rgba(46, 38, 32, 0.09)',
      }
    },
  },
  plugins: [],
}
