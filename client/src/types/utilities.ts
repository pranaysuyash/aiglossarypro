// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never;

// Common prop types
export interface WithClassName {
  className?: string | undefined;
}

export interface WithChildren {
  children?: React.ReactNode;
}

export interface WithStyle {
  style?: React.CSSProperties;
}
