import type { NextFunction, Request, Response } from 'express';
export declare const compressionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare function cacheControlMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function etagMiddleware(req: Request, res: Response, next: NextFunction): void;
interface CacheOptions {
    ttl?: number;
    key?: (req: Request) => string;
    condition?: (req: Request) => boolean;
}
export declare function responseCacheMiddleware(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare function deduplicationMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function clearCacheEndpoint(req: Request, res: Response): void;
export declare const performanceMiddlewareBundle: (typeof cacheControlMiddleware)[];
export {};
