import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { imageOptimizationService, ImageOptimizationService } from "@/services/imageOptimizationService";

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

  // Generate optimized source URLs using the optimization service
  const generateOptimizedSrc = (originalSrc: string, format?: string) => {
    if (!originalSrc) return "";
    
    const params = {
      width,
      height,
      quality,
      format: format as 'webp' | 'avif' | 'jpeg' | 'png' | undefined,
      blur: blur ? 5 : undefined,
    };
    
    return imageOptimizationService.generateOptimizedUrl(originalSrc, params);
  };

  // Use the optimization service's format detection
  const [optimalFormat, setOptimalFormat] = useState<'avif' | 'webp' | 'jpeg'>('jpeg');
  
  useEffect(() => {
    ImageOptimizationService.getOptimalFormat().then(setOptimalFormat);
  }, []);

  // Generate optimized source based on optimal format
  useEffect(() => {
    if (!isInView) return;

    const optimizedSrc = generateOptimizedSrc(src, optimalFormat);
    setCurrentSrc(optimizedSrc);
  }, [src, isInView, optimalFormat, width, height, quality, blur]);

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
 * Hook to preload critical images using the optimization service
 */
export const useImagePreload = (src: string, priority = false, params?: { width?: number; height?: number; quality?: number }) => {
  useEffect(() => {
    if (!priority || !src) return;

    // Use the optimization service for preloading
    const preloadImage = async () => {
      try {
        const optimalFormat = await ImageOptimizationService.getOptimalFormat();
        await imageOptimizationService.preloadImage(src, {
          format: optimalFormat,
          ...params
        });
      } catch (error) {
        console.warn('Failed to preload image:', src, error);
      }
    };
    
    preloadImage();
  }, [src, priority, params]);
};

export default OptimizedImage;