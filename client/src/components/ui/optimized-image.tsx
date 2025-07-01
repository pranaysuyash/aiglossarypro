import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
  quality?: number;
  blur?: boolean;
  priority?: boolean;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component with WebP/AVIF support, lazy loading, and blur placeholder
 * Automatically serves the best image format supported by the browser
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  lazy = true,
  quality = 85,
  blur = true,
  priority = false,
  fallback,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState<string>("");

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px 0px", // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  // Generate optimized source URLs
  const generateOptimizedSrc = (originalSrc: string, format?: string) => {
    if (!originalSrc) return "";
    
    // If it's already a data URL or external URL, return as-is
    if (originalSrc.startsWith("data:") || originalSrc.startsWith("http")) {
      return originalSrc;
    }

    // For local images, we could integrate with an image optimization service
    // For now, we'll return the original src
    // TODO: Integrate with image optimization service or build-time optimization
    if (format) {
      // Replace extension with the desired format
      const extensionRegex = /\.(jpg|jpeg|png|gif)$/i;
      if (extensionRegex.test(originalSrc)) {
        return originalSrc.replace(extensionRegex, `.${format}`);
      }
    }
    
    return originalSrc;
  };

  // Check WebP and AVIF support
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  const supportsAVIF = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  };

  // Prioritize format based on browser support
  useEffect(() => {
    if (!isInView) return;

    let optimizedSrc = src;
    
    // Try AVIF first (best compression)
    if (supportsAVIF()) {
      optimizedSrc = generateOptimizedSrc(src, 'avif');
    } 
    // Fallback to WebP (good compression)
    else if (supportsWebP()) {
      optimizedSrc = generateOptimizedSrc(src, 'webp');
    }
    // Fallback to original format
    else {
      optimizedSrc = src;
    }

    setCurrentSrc(optimizedSrc);
  }, [src, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    
    // Try fallback image if provided
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setHasError(false);
      return;
    }
    
    // Try original source if we were using an optimized version
    if (currentSrc !== src) {
      setCurrentSrc(src);
      setHasError(false);
      return;
    }
    
    onError?.();
  };

  // Generate placeholder dimensions
  const aspectRatio = width && height ? height / width : undefined;
  const placeholderStyle = aspectRatio
    ? { aspectRatio: `${width} / ${height}` }
    : undefined;

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        !isLoaded && blur && "animate-pulse bg-gray-200 dark:bg-gray-800",
        className
      )}
      style={placeholderStyle}
    >
      {/* Blur placeholder */}
      {!isLoaded && blur && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && (
        <picture>
          {/* AVIF source */}
          <source
            srcSet={generateOptimizedSrc(src, 'avif')}
            type="image/avif"
          />
          
          {/* WebP source */}
          <source
            srcSet={generateOptimizedSrc(src, 'webp')}
            type="image/webp"
          />
          
          {/* Fallback image */}
          <img
            src={currentSrc || src}
            alt={alt}
            width={width}
            height={height}
            loading={lazy && !priority ? "lazy" : "eager"}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              hasError && "hidden"
            )}
            {...props}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && !fallback && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
          role="img"
          aria-label={`Failed to load image: ${alt}`}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Loading indicator for priority images */}
      {priority && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"
            aria-hidden="true"
          />
          <span className="sr-only">Loading image...</span>
        </div>
      )}
    </div>
  );
};

/**
 * Hook to preload critical images
 */
export const useImagePreload = (src: string, priority = false) => {
  useEffect(() => {
    if (!priority || !src) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    
    // Add WebP preload if supported
    if (src.includes('.jpg') || src.includes('.png')) {
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      link.href = webpSrc;
      link.type = "image/webp";
    }
    
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [src, priority]);
};

export default OptimizedImage;