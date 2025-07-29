import { cn } from '@/lib/utils';

interface SkipLinksProps {
  className?: string | undefined;
}

export function SkipLinks({ className }: SkipLinksProps) {
  return (
    <nav className={cn('sr-only focus-within:not-sr-only', className)} aria-label="Skip navigation">
      <div className="fixed top-0 left-0 z-50 bg-primary text-primary-foreground p-4 rounded-br-md">
        <h2 className="sr-only">Skip Navigation Links</h2>
        <ul className="flex space-x-4">
          <li>
            <a
              href="#main-content"
              className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 underline hover:no-underline"
            >
              Skip to main content
            </a>
          </li>
          <li>
            <a
              href="#navigation"
              className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 underline hover:no-underline"
            >
              Skip to navigation
            </a>
          </li>
          <li>
            <a
              href="#search"
              className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 underline hover:no-underline"
            >
              Skip to search
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default SkipLinks;
