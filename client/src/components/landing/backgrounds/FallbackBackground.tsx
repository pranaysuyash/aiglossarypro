interface FallbackBackgroundProps {
  className?: string | undefined;
}

export function FallbackBackground({ className = '' }: FallbackBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        background: `
          radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
        `,
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
