/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat-Regular', 'system-ui', 'sans-serif'],
        medium: ['Montserrat-Medium', 'system-ui', 'sans-serif'],
        semibold: ['Montserrat-SemiBold', 'system-ui', 'sans-serif'],
        bold: ['Montserrat-Bold', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

