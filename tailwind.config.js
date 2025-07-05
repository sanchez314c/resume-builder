/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx,html}',
    './src/renderer/index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neo-Noir Glass Monitor — dark glass theme with teal accents
        background: {
          DEFAULT: 'var(--color-background)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
          elevated: 'var(--color-background-elevated)',
        },
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          active: 'var(--color-surface-active)',
          border: 'var(--color-surface-border)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        // shadcn-style semantic tokens — wired to Neo-Noir CSS variables
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          light: 'var(--color-accent-light)',
          muted: 'var(--color-accent-muted)',
          foreground: 'var(--accent-foreground)',
        },
        // Teal palette — the Neo-Noir signature
        teal: {
          50: '#e6faf7',
          100: '#b8f0e8',
          200: '#8ae6d9',
          300: '#5cdcca',
          400: '#2ed2bb',
          500: '#00d2be',
          600: '#00a896',
          700: '#007a6e',
          800: '#004d45',
          900: '#001f1c',
          glow: '#00e5cc',
        },
        status: {
          success: '#3fb950',
          warning: '#d29922',
          error: '#f85149',
          info: '#388bfd',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        // Message bubble colors
        message: {
          user: 'var(--color-message-user)',
          assistant: 'var(--color-message-assistant)',
        },
        // Sidebar colors
        sidebar: {
          DEFAULT: 'var(--color-sidebar)',
          hover: 'var(--color-sidebar-hover)',
          active: 'var(--color-sidebar-active)',
        },
        // Resume section colors — retuned to teal family
        resume: {
          header: '#00d2be',
          section: '#00a896',
          highlight: '#00e5cc',
          skill: '#3fb950',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Söhne',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Ubuntu',
          'Cantarell',
          'Noto Sans',
          'sans-serif',
          'Helvetica Neue',
          'Arial',
        ],
        mono: [
          'JetBrains Mono',
          'Söhne Mono',
          'Monaco',
          'Andale Mono',
          'Ubuntu Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
        display: [
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        // Teal glow — Neo-Noir accents
        glow: '0 0 20px rgba(0, 210, 190, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 210, 190, 0.4)',
        'glow-xl': '0 0 60px rgba(0, 210, 190, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(0, 210, 190, 0.1)',
        // Depth layers — floating glass panels
        'glass-sm': '0 4px 12px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-lg': '0 12px 40px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-xl': '0 24px 64px rgba(0, 0, 0, 0.8), 0 8px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
        'elevation-2': '0 3px 6px rgba(0, 0, 0, 0.5), 0 3px 6px rgba(0, 0, 0, 0.4)',
        'elevation-3': '0 10px 20px rgba(0, 0, 0, 0.6), 0 6px 6px rgba(0, 0, 0, 0.4)',
        'elevation-4': '0 14px 28px rgba(0, 0, 0, 0.7), 0 10px 10px rgba(0, 0, 0, 0.5)',
        'elevation-5': '0 19px 38px rgba(0, 0, 0, 0.8), 0 15px 12px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        // Fade animations
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        // Slide animations
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'slide-in-from-right': 'slideInFromRight 0.3s ease-out',
        'slide-in-from-left': 'slideInFromLeft 0.3s ease-out',
        'slide-in-from-top': 'slideInFromTop 0.3s ease-out',
        'slide-in-from-bottom': 'slideInFromBottom 0.3s ease-out',
        // Scale animations
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        // Pulse and spin
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'spin-fast': 'spin 0.6s linear infinite',
        // Skeleton loading
        shimmer: 'shimmer 2s infinite linear',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
        // Toast animations
        'toast-enter': 'toastEnter 0.35s ease-out',
        'toast-leave': 'toastLeave 0.35s ease-in forwards',
        // Progress
        'progress-indeterminate': 'progressIndeterminate 1.5s infinite linear',
        // Bounce
        'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
      },
      keyframes: {
        // Fade keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slide keyframes
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Scale keyframes
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        popIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Skeleton shimmer
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        // Toast keyframes
        toastEnter: {
          '0%': { transform: 'translateY(-100%) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        toastLeave: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-100%) scale(0.9)', opacity: '0' },
        },
        // Progress keyframes
        progressIndeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Bounce keyframes
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};
