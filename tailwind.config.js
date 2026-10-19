/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        chatgpt: {
          main: 'var(--main-bg)',
          sidebar: 'var(--sidebar-bg)',
          primary: 'var(--primary-text)',
          secondary: 'var(--secondary-text)',
          border: 'var(--border-color)',
          hover: 'var(--hover-bg)',
          input: 'var(--input-bg)',
          btn: 'var(--btn-primary-bg)',
          btnText: 'var(--btn-primary-text)',
          surface: 'var(--subtle-surface)',
        },
        brand: {
          50: '#f7f7f8',
          100: '#ececee',
          200: '#e5e5e7',
          500: '#10a37f', // ChatGPT subtle green accent if ever needed
          600: '#212121',
          700: '#0d0d0d',
        },
      },
    },
  },
  plugins: [],
}
