module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'um-maize': '#FFCB05',
        'um-blue': '#00274C',
        'um-grey': '#333F48',
        'um-grey-dark-mode': '#9CA3AF',
      },
      fontFamily: {
        sans: ['RobotoFlex'],
      },
      keyframes: {
        'status-blink': {
          '0%, 60%, 100%': { opacity: 1 },
          '70%': { opacity: 0.7 },
        },
      },
      animation: {
        'status-blink': 'status-blink 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
