/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        oatmeal: {
          50: '#FAF8F5',
          100: '#F5F2EB',
          200: '#EAE5DA',
          300: '#DBD4C4',
          400: '#C2B8A3',
        },
        night: {
          950: '#0C1311',
          900: '#111A18',
          850: '#15211E',
          800: '#1A2925',
          700: '#253B35',
        },
        gold: {
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#E5A93C',
          600: '#C98A2C',
        }
      }
    },
  },
  plugins: [],
}
