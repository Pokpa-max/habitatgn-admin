module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    debugScreens: {
      position: ['bottom', 'left'],
    },
    extend: {
      fontFamily: {
        stratos: ['stratos', 'cursive'],
        'stratos-light': ['stratos-light', 'cursive'],
        'stratos-extrabold': ['stratos-extrabold', 'cursive'],
      },
      screens: {
        '3xl': '2000px',
      },
      colors: {
        primary: {
          light: '#00c7b6',
          DEFAULT: '#000',
          accent: '#20b2aa',
          "500": "#000",
        },
      },
    },
    patterns: {
      opacities: {
        100: '1',
        80: '.80',
        60: '.60',
        40: '.40',
        20: '.20',
        10: '.10',
        5: '.05',
      },
      sizes: {
        1: '0.25rem',
        2: '0.5rem',
        4: '1rem',
        6: '1.5rem',
        8: '2rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-debug-screens'),
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/line-clamp'),
    require('tailwindcss-bg-patterns'),
    require('@tailwindcss/forms'),
  ],
}
