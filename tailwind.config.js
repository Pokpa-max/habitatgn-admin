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
          DEFAULT: '#0A4D9C',
          hover: '#083B78',
          light: '#E8F0FA',
          dark: '#072B57',
          veryLight: '#F2F6FC',
          accent: '#FF5E00',
          '500': '#0A4D9C',
        },
        secondary: {
          DEFAULT: '#0A192F',
          hover: '#1E293B',
          light: '#334155',
          dark: '#050D1A',
          '500': '#0A192F',
        },
        accent: {
          DEFAULT: '#FF5E00',
          hover: '#E05300',
          light: '#FFF1E8',
        },
        dark: {
          DEFAULT: '#0A192F',
          hover: '#1E293B',
        },
        paper: '#F8FAFC',
        cream: '#FFF1E8',
        ink: '#0F172A',
        navy: '#0A192F',
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
