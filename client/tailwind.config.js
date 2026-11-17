/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'volt-bg': '#0d1117',
        'volt-bg-secondary': '#161b22',
        'volt-bg-tertiary': '#21262d',
        'volt-border': '#30363d',
        'volt-green': '#39ff14',
        'volt-cyan': '#00f5ff',
        'volt-purple': '#bf5af2',
        'volt-red': '#ff453a',
        'volt-yellow': '#ffd60a',
        'volt-text': '#e6edf3',
        'volt-text-muted': '#8b949e',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'confetti': 'confetti 3s ease-in-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glow: {
          'from': { textShadow: '0 0 10px #39ff14, 0 0 20px #39ff14' },
          'to': { textShadow: '0 0 20px #39ff14, 0 0 40px #39ff14, 0 0 60px #39ff14' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
