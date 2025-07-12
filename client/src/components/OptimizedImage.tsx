import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  fallbackSrc?: string;
  webpSrc?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoadComplete?: () => void;
}

export function OptimizedImage({
  src,
  fallbackSrc,
  webpSrc,
  alt,
  className,
  sizes,
  priority = false,
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  onLoadComplete,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string) => {
    const widths = [320, 640, 768, 1024, 1280, 1536, 1920];
    return widths
      .map(w => {
        const url = baseSrc.includes('?') 
          ? `${baseSrc}&w=${w}&q=${quality}`
          : `${baseSrc}?w=${w}&q=${quality}`;
        return `${url} ${w}w`;
      })
      .join(', ');
  };

  // Default sizes if not provided
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Determine which source to use based on browser support
  useEffect(() => {
    if (!isInView) return;

    const checkWebPSupport = async () => {
      const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
      const blob = await fetch(webpData).then(r => r.blob());
      const isWebPSupported = blob.type === 'image/webp';

      if (isWebPSupported && webpSrc) {
        setCurrentSrc(webpSrc);
      } else {
        setCurrentSrc(src);
      }
    };

    checkWebPSupport();
  }, [isInView, src, webpSrc]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  // Handle image error
  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  // Generate blur placeholder
  const getPlaceholder = () => {
    if (placeholder === 'empty' || !blurDataURL) {
      return undefined;
    }

    return blurDataURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJibHVyIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyMCIgLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIgZmlsdGVyPSJ1cmwoI2JsdXIpIiAvPjwvc3ZnPg==';
  };

  return (
    <picture className={cn('relative block', className)}>
      {/* WebP source */}
      {isInView && webpSrc && (
        <source
          type="image/webp"
          srcSet={generateSrcSet(webpSrc)}
          sizes={defaultSizes}
        />
      )}

      {/* Original format source */}
      {isInView && currentSrc && (
        <source
          srcSet={generateSrcSet(currentSrc)}
          sizes={defaultSizes}
        />
      )}

      {/* Placeholder background */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{
            backgroundImage: `url(${getPlaceholder()})`,
          }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={isInView ? currentSrc : getPlaceholder()}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />

      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
    </picture>
  );
}

// Preload critical images
export function preloadImage(src: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

// Utility to generate optimized image URLs
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
) {
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('fm', options.format);
  
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}${params.toString()}`;
}