/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        accent: '#7c3aed',
        neutral: {
          50: '#f9fafb',
          700: '#374151'
        }
      },
      borderRadius: {
        md: '8px'
      }
    }
  },
  plugins: []
}
