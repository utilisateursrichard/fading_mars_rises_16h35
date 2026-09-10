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
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        m3: {
          surface: '#F8FAFC',
          container: '#F1F5F9',
          'container-low': '#F8FAFC',
          'container-high': '#E2E8F0',
          outline: '#E2E8F0',
          'outline-variant': '#CBD5E1',
        }
      },
      borderRadius: {
        'm3-sm': '10px',
        'm3-md': '16px',
        'm3-lg': '20px',
        'm3-xl': '24px',
        'm3-pill': '9999px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 6px 16px -4px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 12px 24px -6px rgba(15, 23, 42, 0.05)',
        'modal': '0 16px 36px -8px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06)',
        'glow': '0 0 20px -5px rgba(99, 102, 241, 0.25)',
      }
    },
  },
  plugins: [],
}
