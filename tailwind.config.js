/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-deep': '#0a0f1e',
        'accent-teal': '#00f5ff',
        'accent-violet': '#7000ff',
        'text-primary': 'rgba(255, 255, 255, 0.95)',
        'text-secondary': 'rgba(255, 255, 255, 0.6)',
        'glass-bg': 'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        spin: 'spin 1s linear infinite',
        fadeIn: 'fadeIn 0.3s ease',
      },
      keyframes: {
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
