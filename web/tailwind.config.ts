import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        monolith: {
          primary: '#003361',
          primaryContainer: '#0e4a84',
          onPrimary: '#ffffff',
          surface: '#f9f9fe',
          surfaceLow: '#f3f3f9',
          surfaceContainer: '#ededf3',
          surfaceHigh: '#e7e8ed',
          surfaceLowest: '#ffffff',
          onSurface: '#191c20',
          onSurfaceMuted: '#53637c',
          outlineVariant: '#c2c6d1',
          secondaryContainer: '#d0e1fe',
          onSecondaryContainer: '#53637c',
          primaryFixed: '#d4e3ff',
          error: '#ba1a1a',
          errorContainer: '#ffdad6',
        },
      },
      borderRadius: {
        md: '0.375rem',
        lg: '0.5rem',
      },
      boxShadow: {
        ambient: '0 0 40px rgb(25 28 32 / 0.06)',
        monolith: '0 24px 48px rgb(25 28 32 / 0.08)',
      },
      backgroundImage: {
        'monolith-gradient': 'linear-gradient(135deg, #003361 0%, #0e4a84 100%)',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'body-lg': ['1rem', { lineHeight: '1.7' }],
        'label-md': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
