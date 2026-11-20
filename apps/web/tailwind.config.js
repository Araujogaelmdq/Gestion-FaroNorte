/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A1A1A',
          50: '#F5F5F5',
          100: '#E8E8E8',
          800: '#262626',
          900: '#1A1A1A',
          950: '#121212',
        },
        accent: {
          DEFAULT: '#E8863A',
          light: '#F0A860',
          dark: '#C86820',
        },
        club: {
          teal: '#5BB8C4',
          cream: '#F5E6C8',
          dark: '#1A1A1A',
          orange: '#E8863A',
        },
      },
    },
  },
  plugins: [],
};
