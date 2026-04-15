/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aura: {
          bg:      '#000008',
          surface: '#0a0a1a',
          border:  '#1a1a3a',
          neon:    '#39ff14',
          cyan:    '#00f5ff',
          violet:  '#8b5cf6',
          amber:   '#f59e0b',
          text:    '#e2e8f0',
          muted:   '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        neon:   '0 0 20px #39ff1480, 0 0 60px #39ff1430',
        cyan:   '0 0 20px #00f5ff80, 0 0 60px #00f5ff30',
        violet: '0 0 20px #8b5cf680, 0 0 60px #8b5cf630',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'slide-up':   'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scan-line':  'scanLine 2s linear infinite',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%':      { opacity: '0.7', filter: 'brightness(1.5)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        scanLine: {
          '0%':   { top: '0%' },
          '100%': { top: '100%' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
