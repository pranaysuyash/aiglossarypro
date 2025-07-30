interface EnvironmentConfig {
    DATABASE_URL: string;
    PGDATABASE?: string;
    PGHOST?: string;
    PGPORT?: string;
    PGUSER?: string;
    PGPASSWORD?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION: string;
    S3_BUCKET_NAME?: string;
    OPENAI_API_KEY?: string;
    SESSION_SECRET: string;
    GOOGLE_DRIVE_API_KEY?: string;
    JWT_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    GITHUB_REDIRECT_URI?: string;
    NODE_ENV: string;
    PORT: string;
}
declare const config: EnvironmentConfig;
export declare const features: {
    s3Enabled: boolean;
    openaiEnabled: boolean;
    googleDriveEnabled: boolean;
    simpleAuthEnabled: boolean;
    firebaseAuthEnabled: boolean;
    analyticsEnabled: boolean;
    isDevelopment: boolean;
    isProduction: boolean;
};
export { config };
export declare function getRequiredEnvVar(name: string): string;
export declare function getOptionalEnvVar(name: string, defaultValue?: string): string;
export declare function getDatabaseConfig(): {
    connectionString: string;
    ssl: {
        rejectUnauthorized: boolean;
    } | undefined;
};
export declare function getS3Config(): {
    region: string;
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    };
    bucketName: string;
};
export declare function getOpenAIConfig(): {
    apiKey: string;
};
export declare function getSessionConfig(): {
    secret: string;
    databaseUrl: string;
};
export declare function getServerConfig(): {
    port: number;
    host: string;
    nodeEnv: string;
};
export declare function logConfigStatus(): void;
export declare function sanitizeLogData(data: any): any;
export declare const appConfig: {
    port: string;
    nodeEnv: string;
    database: {
        url: string | undefined;
        ssl: boolean;
    };
    session: {
        secret: string;
        maxAge: number;
    };
    s3: {
        enabled: boolean;
        region: string;
        bucket: string;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
    };
    openai: {
        enabled: boolean;
        apiKey: string | undefined;
    };
    googleDrive: {
        enabled: boolean;
        clientId: string | undefined;
        clientSecret: string | undefined;
        redirectUri: string | undefined;
    };
    features: {
        authRoutes: boolean;
        categoriesRoutes: boolean;
        termsRoutes: boolean;
        searchRoutes: boolean;
        userRoutes: boolean;
        adminRoutes: boolean;
        analyticsRoutes: boolean;
        excelAutoLoad: boolean;
        apiDocumentation: boolean;
    };
    performance: {
        cache: {
            categories: number;
            featuredTerms: number;
            terms: number;
            search: number;
            analytics: number;
        };
        deduplication: {
            enabled: boolean;
            windowMs: number;
        };
        database: {
            maxConnections: number;
            idleTimeoutMs: number;
            connectionTimeoutMs: number;
        };
    };
    logging: {
        level: string;
        enableRequestLogging: boolean;
    };
};
