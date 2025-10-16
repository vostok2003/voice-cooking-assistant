/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // we'll toggle a class on <html> or body
  theme: {
    extend: {
      colors: {
        primaryStart: '#6b46ff',
        primaryEnd: '#ff3d7f'
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg,#6b46ff 0%, #ff3d7f 60%)',
      },
      keyframes: {
        'icon-swap': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.05)' },
          '100%': { transform: 'rotate(360deg) scale(1)' }
        },
        'typing': {
          '0%': { width: '0ch' },
        }
      },
      animation: {
        'swap': 'icon-swap 400ms ease-in-out',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
