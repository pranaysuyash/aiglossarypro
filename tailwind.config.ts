import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './client/index.html',
    './client/src/**/*.{js,jsx,ts,tsx}',
    // Exclude test and story files from CSS scanning
    '!./client/src/**/*.{test,spec,stories}.{js,jsx,ts,tsx}',
    '!./client/src/**/__tests__/**/*',
    '!./client/src/**/*.d.ts',
  ],
  theme: {
    screens: {
      xs: '350px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      // Custom intermediate breakpoints for better responsive design
      xxs: '320px', // Ultra-small phones
      tablet: '900px', // Tablet landscape
    },
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          300: 'hsl(var(--primary-300))',
          400: 'hsl(var(--primary-400))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
          800: 'hsl(var(--primary-800))',
          900: 'hsl(var(--primary-900))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
  // Optimize CSS output
  corePlugins: {
    // Disable unused core plugins to reduce bundle size
    preflight: true, // Keep for reset styles
    container: false, // We use custom responsive utilities
    accessibility: true, // Keep for a11y
    appearance: false, // Rarely used
    backgroundAttachment: false, // Rarely used
    backgroundClip: true, // Used for gradient text
    backgroundImage: true, // Used for gradients
    backgroundOpacity: true, // Used frequently
    backgroundPosition: false, // Rarely used
    backgroundRepeat: false, // Rarely used
    backgroundSize: false, // Rarely used
    borderCollapse: false, // Table-specific, rarely used
    borderSpacing: false, // Table-specific, rarely used
    caretColor: false, // Rarely used
    clear: false, // Rarely used
    columns: false, // CSS columns, rarely used
    content: false, // CSS content property, rarely used
    cursor: true, // Used for interactive elements
    display: true, // Essential
    divideColor: false, // Rarely used
    divideOpacity: false, // Rarely used
    divideStyle: false, // Rarely used
    divideWidth: false, // Rarely used
    fill: false, // SVG-specific, handled separately
    flex: true, // Essential for layout
    flexBasis: true, // Used in flex layouts
    flexDirection: true, // Essential for flex
    flexGrow: true, // Used frequently
    flexShrink: true, // Used frequently
    flexWrap: true, // Used in responsive layouts
    float: false, // Rarely used in modern layouts
    fontFamily: true, // Essential
    fontSize: true, // Essential
    fontSmoothing: true, // Used for better text rendering
    fontStyle: true, // Used for italic text
    fontVariantNumeric: false, // Rarely used
    fontWeight: true, // Essential
    gap: true, // Essential for grid/flex
    gradientColorStops: true, // Used for gradients
    gridAutoColumns: false, // Advanced grid, rarely used
    gridAutoFlow: false, // Advanced grid, rarely used
    gridAutoRows: true, // Used in some layouts
    gridColumn: true, // Used in grid layouts
    gridColumnEnd: false, // Advanced grid, rarely used
    gridColumnStart: false, // Advanced grid, rarely used
    gridRow: false, // Rarely used
    gridRowEnd: false, // Advanced grid, rarely used
    gridRowStart: false, // Advanced grid, rarely used
    gridTemplateColumns: true, // Essential for grid
    gridTemplateRows: false, // Rarely used
    height: true, // Essential
    hueRotate: false, // Filter effect, rarely used
    inset: true, // Used for positioning
    isolation: false, // Rarely used
    justifyContent: true, // Essential for flex/grid
    justifyItems: false, // Advanced grid, rarely used
    justifySelf: false, // Advanced grid, rarely used
    letterSpacing: true, // Used for typography
    lineHeight: true, // Essential for typography
    listStylePosition: false, // List-specific, rarely used
    listStyleType: false, // List-specific, rarely used
    margin: true, // Essential
    maxHeight: true, // Used frequently
    maxWidth: true, // Used frequently
    minHeight: true, // Used frequently
    minWidth: true, // Used frequently
    mixBlendMode: false, // Advanced effect, rarely used
    objectFit: true, // Used for images
    objectPosition: false, // Advanced image positioning, rarely used
    opacity: true, // Used frequently
    order: false, // Advanced flex, rarely used
    outline: true, // Used for focus states
    overflow: true, // Essential
    overscrollBehavior: false, // Advanced scrolling, rarely used
    padding: true, // Essential
    placeContent: false, // Advanced grid, rarely used
    placeItems: false, // Advanced grid, rarely used
    placeSelf: false, // Advanced grid, rarely used
    placeholderColor: true, // Used in forms
    placeholderOpacity: false, // Rarely used
    pointerEvents: true, // Used for interactive elements
    position: true, // Essential
    resize: false, // Rarely used
    ringColor: true, // Used for focus states
    ringOffsetColor: true, // Used for focus states
    ringOffsetWidth: true, // Used for focus states
    ringOpacity: false, // Rarely used
    ringWidth: true, // Used for focus states
    rotate: false, // Transform, rarely used
    saturate: false, // Filter effect, rarely used
    scale: false, // Transform, rarely used
    scrollBehavior: false, // Rarely used
    scrollMargin: false, // Advanced scrolling, rarely used
    scrollPadding: false, // Advanced scrolling, rarely used
    scrollSnapAlign: false, // Advanced scrolling, rarely used
    scrollSnapStop: false, // Advanced scrolling, rarely used
    scrollSnapType: false, // Advanced scrolling, rarely used
    sepia: false, // Filter effect, rarely used
    skew: false, // Transform, rarely used
    space: true, // Used for spacing between elements
    stroke: false, // SVG-specific, handled separately
    strokeWidth: false, // SVG-specific, handled separately
    tableLayout: false, // Table-specific, rarely used
    textAlign: true, // Essential
    textColor: true, // Essential
    textDecoration: true, // Used for links
    textDecorationColor: false, // Advanced typography, rarely used
    textDecorationStyle: false, // Advanced typography, rarely used
    textDecorationThickness: false, // Advanced typography, rarely used
    textIndent: false, // Rarely used
    textOpacity: false, // Rarely used
    textOverflow: true, // Used for truncation
    textTransform: true, // Used for uppercase/lowercase
    textUnderlineOffset: false, // Advanced typography, rarely used
    transform: true, // Used for animations
    transformOrigin: false, // Advanced transform, rarely used
    transitionDelay: false, // Advanced animation, rarely used
    transitionDuration: true, // Used for animations
    transitionProperty: true, // Used for animations
    transitionTimingFunction: true, // Used for animations
    translate: false, // Transform, rarely used
    userSelect: true, // Used for text selection control
    verticalAlign: false, // Rarely used in modern layouts
    visibility: true, // Used for show/hide
    whitespace: true, // Used for text formatting
    width: true, // Essential
    willChange: false, // Performance hint, rarely used
    wordBreak: false, // Advanced typography, rarely used
    zIndex: true, // Used for layering
  },
} satisfies Config;
