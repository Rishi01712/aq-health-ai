/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',  // ← THIS LINE IS CRITICAL
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'bg-dark': '#0a0a1a',
        'card': 'rgba(20, 25, 40, 0.85)',
        'border-glow': 'rgba(100, 150, 255, 0.3)',
        'neon-blue': '#00f5ff',
        'neon-purple': '#9d4edd',
        'neon-green': '#39ff14',
        'neon-red': '#ff006e',
        'neon-yellow': '#ffea00',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 245, 255, 0.4)',
        'neon-lg': '0 0 40px rgba(157, 78, 221, 0.5)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 245, 255, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 245, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}