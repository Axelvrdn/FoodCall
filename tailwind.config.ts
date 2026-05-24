import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#EA580B',
        secondary: '#F59E0B',
        success: '#16A34A',
        danger: '#DC2626',
        bg: '#FFEDD5',
        surface: '#FFFFFF',
        'surface-warm': '#FFF8F0',
        fg: '#1D1820',
        muted: '#6D6572',
        border: '#F0D4B8',
        soft: '#F4E4D2',
      },
      borderRadius: { card: '24px', radius: '24px' },
      fontFamily: {
        display: ['Limelight', 'serif'],
        body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 18px 45px rgba(125, 72, 24, 0.12)',
        soft: '0 10px 30px rgba(125, 72, 24, 0.08)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #EA580B 0%, #F59E0B 100%)',
      },
      screens: { md: '680px', lg: '1180px' },
    },
  },
  plugins: [],
} satisfies Config;
