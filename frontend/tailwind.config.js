/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050c18',
          900: '#0a1628',
          800: '#0d1f3c',
          700: '#1a3358',
          600: '#1e3a6e',
          500: '#2d5086',
          400: '#3d6ba3',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          light: '#22d3ee',
          dark: '#0891b2',
          glow: '#38bdf8',
        },
        glass: {
          white: 'rgba(255,255,255,0.08)',
          card: 'rgba(255,255,255,0.04)',
          dark: 'rgba(10,22,40,0.75)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        glow: {
          from: { boxShadow: '0 0 8px rgba(6, 182, 212, 0.3), 0 0 16px rgba(6, 182, 212, 0.2)' },
          to: { boxShadow: '0 0 16px rgba(34, 211, 238, 0.6), 0 0 32px rgba(6, 182, 212, 0.4)' },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 100%)',
        'hero-gradient': 'radial-gradient(ellipse at top, #0f2b52 0%, #0a1628 60%, #050c18 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        'glass-lg': '0 20px 50px rgba(0, 0, 0, 0.35)',
        glow: '0 0 25px rgba(6, 182, 212, 0.35)',
        'glow-lg': '0 0 45px rgba(6, 182, 212, 0.45)',
        'inner-glow': 'inset 0 0 20px rgba(6, 182, 212, 0.1)',
        '3d': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

