// Type declarations for missing modules

declare module 'vite' {
  export interface ViteDevServer {
    middlewares: any;
    transformIndexHtml(url: string, html: string): Promise<string>;
    ssrFixStacktrace(err: Error): void;
  }
  
  export interface InlineConfig {
    root?: string;
    base?: string;
    mode?: string;
    publicDir?: string;
    cacheDir?: string;
    configFile?: string | false;
    resolve?: {
      alias?: Record<string, string>;
    };
    server?: {
      middlewareMode?: boolean;
      hmr?: {
        server?: any;
      };
      allowedHosts?: boolean;
    };
    appType?: string;
  }
  
  export function createServer(config: InlineConfig): Promise<ViteDevServer>;
}

declare module 'resend' {
  export class Resend {
    constructor(apiKey: string);
    
    emails: {
      send(params: {
        from: string;
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
        attachments?: Array<{
          filename: string;
          content: Buffer | string;
        }>;
      }): Promise<{ data?: { id: string }; error?: any }>;
    };
  }
}

declare module 'bullmq' {
  export interface JobData {
    [key: string]: any;
  }
  
  export interface Job<T = any> {
    id: string;
    data: T;
    progress: number | object;
    updateProgress(progress: number | object): Promise<void>;
  }
  
  export interface ProcessorOptions {
    concurrency?: number;
  }
  
  export type Processor<T = any> = (job: Job<T>) => Promise<any>;
}