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
        primary: {
          DEFAULT: 'hsl(210, 80%, 55%)',
          light: 'hsl(210, 80%, 65%)',
          dark: 'hsl(210, 80%, 45%)',
        },
        subtle: {
          light: 'hsl(210, 30%, 96%)',
          dark: 'hsl(220, 20%, 12%)',
        },
        accent: {
          light: 'hsl(210, 15%, 90%)',
          dark: 'hsl(220, 15%, 25%)',
        },
        bkg: {
          light: 'hsl(210, 20%, 98%)',
          dark: 'hsl(220, 20%, 10%)',
        },
        content: {
          light: 'hsl(220, 15%, 20%)',
          dark: 'hsl(210, 20%, 95%)',
        }
      }
    }
  },
  plugins: [],
}
