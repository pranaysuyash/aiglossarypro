/**
 * Image Optimization Service
 * Handles image transformations, format conversion, and optimization
 */

interface ImageOptimizationParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  sharpen?: boolean;
  progressive?: boolean;
}

interface OptimizationConfig {
  baseUrl?: string;
  cloudinary?: {
    cloudName: string;
    apiKey: string;
  };
  imagekit?: {
    publicKey: string;
    urlEndpoint: string;
  };
  custom?: {
    endpoint: string;
    apiKey?: string;
  };
}

class ImageOptimizationService {
  private config: OptimizationConfig;
  private cache = new Map<string, string>();

  constructor(config: OptimizationConfig = {}) {
    this.config = {
      baseUrl: '/api/images/optimize',
      ...config,
    };
  }

  /**
   * Generate optimized image URL based on the configured service
   */
  generateOptimizedUrl(src: string, params: ImageOptimizationParams = {}): string {
    // Return original if it's a data URL or external URL
    if (src.startsWith('data:') || src.startsWith('http')) {
      return src;
    }

    // Generate cache key
    const cacheKey = `${src}-${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let optimizedUrl: string;

    // Choose optimization service based on configuration
    if (this.config.cloudinary) {
      optimizedUrl = this.generateCloudinaryUrl(src, params);
    } else if (this.config.imagekit) {
      optimizedUrl = this.generateImageKitUrl(src, params);
    } else if (this.config.custom) {
      optimizedUrl = this.generateCustomUrl(src, params);
    } else {
      optimizedUrl = this.generateLocalOptimizedUrl(src, params);
    }

    this.cache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  }

  /**
   * Generate Cloudinary URL with transformations
   */
  private generateCloudinaryUrl(src: string, params: ImageOptimizationParams): string {
    const { cloudName } = this.config.cloudinary!;
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/fetch`;

    const transformations: string[] = [];

    if (params.width) {transformations.push(`w_${params.width}`);}
    if (params.height) {transformations.push(`h_${params.height}`);}
    if (params.quality) {transformations.push(`q_${params.quality}`);}
    if (params.format) {transformations.push(`f_${params.format}`);}
    if (params.fit) {transformations.push(`c_${params.fit}`);}
    if (params.blur) {transformations.push(`e_blur:${params.blur}`);}
    if (params.sharpen) {transformations.push('e_sharpen');}
    if (params.progressive) {transformations.push('fl_progressive');}

    const transformationString = transformations.join(',');
    return `${baseUrl}/${transformationString}/${encodeURIComponent(src)}`;
  }

  /**
   * Generate ImageKit URL with transformations
   */
  private generateImageKitUrl(src: string, params: ImageOptimizationParams): string {
    const { urlEndpoint } = this.config.imagekit!;
    const baseUrl = urlEndpoint.endsWith('/') ? urlEndpoint.slice(0, -1) : urlEndpoint;

    const transformations: string[] = [];

    if (params.width) {transformations.push(`w-${params.width}`);}
    if (params.height) {transformations.push(`h-${params.height}`);}
    if (params.quality) {transformations.push(`q-${params.quality}`);}
    if (params.format) {transformations.push(`f-${params.format}`);}
    if (params.fit) {transformations.push(`c-${params.fit}`);}
    if (params.blur) {transformations.push(`bl-${params.blur}`);}
    if (params.sharpen) {transformations.push('e-sharpen');}
    if (params.progressive) {transformations.push('pr-true');}

    const transformationString = transformations.join(',');
    return `${baseUrl}/tr:${transformationString}/${src.replace(/^\//, '')}`;
  }

  /**
   * Generate custom service URL
   */
  private generateCustomUrl(src: string, params: ImageOptimizationParams): string {
    const { endpoint } = this.config.custom!;
    const url = new URL(endpoint);

    url.searchParams.set('src', src);
    if (params.width) {url.searchParams.set('w', params.width.toString());}
    if (params.height) {url.searchParams.set('h', params.height.toString());}
    if (params.quality) {url.searchParams.set('q', params.quality.toString());}
    if (params.format) {url.searchParams.set('f', params.format);}
    if (params.fit) {url.searchParams.set('fit', params.fit);}
    if (params.blur) {url.searchParams.set('blur', params.blur.toString());}
    if (params.sharpen) {url.searchParams.set('sharpen', 'true');}
    if (params.progressive) {url.searchParams.set('progressive', 'true');}

    return url.toString();
  }

  /**
   * Generate local optimization URL (fallback)
   */
  private generateLocalOptimizedUrl(src: string, params: ImageOptimizationParams): string {
    // For local development or when no external service is configured
    // This would route to a local image processing endpoint
    const baseUrl = this.config.baseUrl || '/api/images/optimize';
    const url = new URL(baseUrl, window.location.origin);

    url.searchParams.set('src', src);
    if (params.width) {url.searchParams.set('w', params.width.toString());}
    if (params.height) {url.searchParams.set('h', params.height.toString());}
    if (params.quality) {url.searchParams.set('q', params.quality.toString());}
    if (params.format) {url.searchParams.set('f', params.format);}
    if (params.fit) {url.searchParams.set('fit', params.fit);}

    return url.toString();
  }

  /**
   * Preload critical images
   */
  preloadImage(src: string, params: ImageOptimizationParams = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const optimizedSrc = this.generateOptimizedUrl(src, params);
      const img = new Image();

      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload image: ${optimizedSrc}`));

      img.src = optimizedSrc;
    });
  }

  /**
   * Check if format is supported by browser
   */
  static isFormatSupported(format: string): Promise<boolean> {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob(blob => {
        resolve(blob !== null);
      }, `image/${format}`);
    });
  }

  /**
   * Get optimal format for browser
   */
  static async getOptimalFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
    if (await ImageOptimizationService.isFormatSupported('avif')) {return 'avif';}
    if (await ImageOptimizationService.isFormatSupported('webp')) {return 'webp';}
    return 'jpeg';
  }

  /**
   * Generate responsive srcset
   */
  generateSrcSet(
    src: string,
    widths: number[],
    params: Omit<ImageOptimizationParams, 'width'> = {}
  ): string {
    return widths
      .map(width => {
        const url = this.generateOptimizedUrl(src, { ...params, width });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Create default instance
const imageOptimizationService = new ImageOptimizationService({
  // Default configuration - can be overridden by environment variables
  baseUrl: import.meta.env.VITE_IMAGE_OPTIMIZATION_ENDPOINT || '/api/images/optimize',

  // Cloudinary configuration (if available)
  ...(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && {
    cloudinary: {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
    },
  }),

  // ImageKit configuration (if available)
  ...(import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY && {
    imagekit: {
      publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
    },
  }),
});

export { ImageOptimizationService, imageOptimizationService };
export type { ImageOptimizationParams, OptimizationConfig };
