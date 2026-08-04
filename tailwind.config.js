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
      screens: {
        '3xl': '2000px',
      },
      colors: {
        primary: {
          DEFAULT: '#BD5B37',
          hover: '#A44B2B',
          light: '#F2E1D6',
          dark: '#8C3D20',
          veryLight: '#FAF0E6',
          accent: '#BD5B37',
          '500': '#BD5B37',
        },
        secondary: {
          DEFAULT: '#12192B',
          hover: '#263449',
          light: '#3E4652',
          dark: '#0B0F1A',
          '500': '#12192B',
        },
        terracotta: {
          DEFAULT: '#BD5B37',
          hover: '#A44B2B',
          light: '#F2E1D6',
        },
        dark: {
          DEFAULT: '#12192B',
          hover: '#263449',
        },
        paper: '#FDFCFA',
        cream: '#F3ECE1',
        ink: '#12192B',
        navy: '#263449',
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
