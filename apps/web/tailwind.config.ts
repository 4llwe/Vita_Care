import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palet Vita Care: hijau islami, biru profesional
        vita: {
          green: '#0B7A5B',
          greenDark: '#075F47',
          blue: '#1F6FB2',
          blueDark: '#0E4C8A',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
