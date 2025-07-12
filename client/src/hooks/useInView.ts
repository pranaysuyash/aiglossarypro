import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {}
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = true,
  } = options;

  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);
          
          if (inView && triggerOnce) {
            setHasTriggered(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, root, rootMargin, triggerOnce, hasTriggered]);

  return { ref, isInView };
}