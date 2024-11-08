/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'game': {
            dark: '#0a0a0b',     // Darker main background
            'dark-800': '#121214', // Very dark
            'dark-600': '#18181b', // Slightly lighter dark
            'dark-400': '#27272a', // Even lighter dark
            'dark-300': '#3f3f46', // Accent dark
            light: '#fafafa',    // Light text
            'light-600': '#e4e4e7', // Slightly darker light
            'light-400': '#a1a1aa', // Even darker light
            primary: '#8b5cf6',  // Violet as primary
            'primary-dark': '#7c3aed',
            'primary-light': '#a78bfa',
            secondary: '#10b981', // Emerald as secondary
            'secondary-dark': '#059669',
            'secondary-light': '#34d399',
          }
        },
        backdropBlur: {
          'xs': '2px',
        },
        animation: {
          'fadeIn': 'fadeIn 0.3s ease-out',
          'slideIn': 'slideIn 0.3s ease-out',
          'float': 'float 6s ease-in-out infinite',
          'gradient': 'gradient 8s linear infinite',
          'shine': 'shine 2s linear infinite',
          'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          slideIn: {
            '0%': { transform: 'translateX(-20px)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' },
          },
          gradient: {
            '0%, 100%': { 'background-position': '0% 50%' },
            '50%': { 'background-position': '100% 50%' },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-20px)' },
          },
          shine: {
            'from': { backgroundPosition: '200% 0' },
            'to': { backgroundPosition: '-200% 0' },
          },
        },
        backgroundSize: {
          '300%': '300%',
        },
      }
    },
    plugins: []
};