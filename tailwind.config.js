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
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2.5xl': '20px',
        'm3': '28px',
        '4xl': '32px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 8px 24px -4px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 16px 32px -6px rgba(0, 0, 0, 0.08)',
        'modal': '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 24px -4px rgba(99, 102, 241, 0.28)',
        'float': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'm3-ambient': '0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 10px 28px -6px rgba(15, 23, 42, 0.06)',
        'm3-elevated': '0 8px 24px -4px rgba(79, 70, 229, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
