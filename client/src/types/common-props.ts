/**
 * Common prop types and interfaces used across components
 * This ensures consistency in prop naming and types
 */

import { HTMLAttributes, ReactNode } from 'react';

/**
 * Base props that most components should extend
 */
export interface BaseComponentProps {
  className?: string;
  id?: string;
  children?: ReactNode;
}

/**
 * Props for components that can be shown/hidden
 */
export interface ToggleableProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Props for components with loading states
 */
export interface LoadableProps {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Props for components with error states
 */
export interface ErrorableProps {
  error?: Error | null;
  onError?: (error: Error) => void;
}

/**
 * Common size variants used across components
 */
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Common style variants used across components
 */
export type StyleVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';

/**
 * Props for components with size variants
 */
export interface SizeProps {
  size?: SizeVariant;
}

/**
 * Props for components with style variants
 */
export interface VariantProps {
  variant?: StyleVariant;
}

/**
 * Props for components that handle form data
 */
export interface FormComponentProps<T = any> {
  value?: T;
  onChange?: (value: T) => void;
  onSubmit?: (value: T) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

/**
 * Props for components that display data items
 */
export interface DataDisplayProps<T = any> {
  data?: T;
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
}

/**
 * Standard callback naming conventions
 */
export interface CallbackProps {
  onClick?: () => void;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

/**
 * Props for modal/dialog components
 */
export interface ModalProps extends BaseComponentProps, ToggleableProps {
  title?: string;
  description?: string;
  onClose?: () => void;
}

/**
 * Props for list components
 */
export interface ListProps<T = any> extends BaseComponentProps {
  items: T[];
  renderItem?: (item: T, index: number) => ReactNode;
  onItemClick?: (item: T, index: number) => void;
  emptyMessage?: string;
}

/**
 * Utility type to make all properties of T optional
 */
export type PartialProps<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Utility type to omit certain props
 */
export type OmitProps<T, K extends keyof T> = Omit<T, K>;

/**
 * Utility type to extend HTML element props
 */
export type ExtendHTMLProps<T extends HTMLAttributes<any>, P = {}> = OmitProps<T, keyof P> & P;