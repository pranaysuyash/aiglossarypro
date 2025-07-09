// Design System Utilities for AI/ML Glossary Pro
// Standardizes button variants, spacing, and design patterns

import { cva, type VariantProps } from 'class-variance-authority';

// Standardized Button Variants
export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Standardized Spacing Scale
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
} as const;

// Standardized Typography Scale
export const typography = {
  // Headings
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
  h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',

  // Body text
  body: 'leading-7 [&:not(:first-child)]:mt-6',
  bodyLarge: 'text-lg leading-7 [&:not(:first-child)]:mt-6',
  bodySmall: 'text-sm leading-6 [&:not(:first-child)]:mt-4',

  // Special text
  lead: 'text-xl text-muted-foreground',
  muted: 'text-sm text-muted-foreground',
  caption: 'text-xs text-muted-foreground',

  // Code
  code: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
} as const;

// Standardized Icon Sizes
export const iconSizes = {
  xs: 'h-3 w-3', // 12px
  sm: 'h-4 w-4', // 16px
  md: 'h-5 w-5', // 20px (default)
  lg: 'h-6 w-6', // 24px
  xl: 'h-8 w-8', // 32px
  '2xl': 'h-12 w-12', // 48px
} as const;

// Standardized Card Variants
export const cardVariants = cva('rounded-lg border bg-card text-card-foreground shadow-sm', {
  variants: {
    variant: {
      default: 'border-border',
      elevated: 'shadow-md',
      outlined: 'border-2',
      ghost: 'border-transparent shadow-none',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

// Standardized Badge Variants
export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
        warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
        info: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Standardized Animation Classes
export const animations = {
  fadeIn: 'animate-in fade-in-0 duration-200',
  fadeOut: 'animate-out fade-out-0 duration-150',
  slideIn: 'animate-in slide-in-from-bottom-2 duration-200',
  slideOut: 'animate-out slide-out-to-bottom-2 duration-150',
  scaleIn: 'animate-in zoom-in-95 duration-100',
  scaleOut: 'animate-out zoom-out-95 duration-75',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
} as const;

// Standardized Layout Patterns
export const layouts = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 md:py-12 lg:py-16',
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    dense: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
    wide: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    column: 'flex flex-col',
    wrap: 'flex flex-wrap',
  },
} as const;

// Standardized Focus Styles
export const focusStyles = {
  default: 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  visible: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  within: 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
} as const;

// Color Palette Helper
export const colors = {
  semantic: {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  },
  interactive: {
    primary: 'text-primary hover:text-primary/80',
    secondary: 'text-secondary-foreground hover:text-secondary-foreground/80',
    muted: 'text-muted-foreground hover:text-foreground',
  },
} as const;

// Utility function to combine classes consistently
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Export types for TypeScript support
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type CardVariants = VariantProps<typeof cardVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;

export default {
  buttonVariants,
  cardVariants,
  badgeVariants,
  spacing,
  typography,
  iconSizes,
  animations,
  layouts,
  focusStyles,
  colors,
  cn,
};
