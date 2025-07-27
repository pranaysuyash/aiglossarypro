/**
 * IndexedDB management and cleanup utilities
 * Handles proper cleanup of IndexedDB operations to prevent memory leaks
 */

import * as React from 'react';

export interface IndexedDBInfo {
    name: string;
    version: number;
    size?: number;
    lastAccessed?: number;
}

export interface IndexedDBCleanupOptions {
    maxAge?: number; // Maximum age in milliseconds
    maxSize?: number; // Maximum total size in bytes
    keepDatabases?: string[]; // Database names to always keep
}

class IndexedDBManagerClass {
    private static instance: IndexedDBManagerClass;
    private openConnections: Map<string, IDBDatabase> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;
    private readonly CLEANUP_INTERVAL = 300000; // 5 minutes

    private constructor() {
        this.startPeriodicCleanup();

        // Cleanup on page unload
        window.addEventListener('beforeunload', this.cleanup);
    }

    static getInstance(): IndexedDBManagerClass {
        if (!IndexedDBManagerClass.instance) {
            IndexedDBManagerClass.instance = new IndexedDBManagerClass();
        }
        return IndexedDBManagerClass.instance;
    }

    /**
     * Get list of all IndexedDB databases
     */
    async getDatabases(): Promise<IndexedDBInfo[]> {
        if (!('databases' in indexedDB)) {
            console.warn('indexedDB.databases() not supported in this browser');
            return [];
        }

        try {
            const databases = await indexedDB.databases();
            return databases.map(db => ({
                name: db.name || 'unknown',
                version: db.version || 1,
            }));
        } catch (error) {
            console.error('Failed to get IndexedDB databases:', error);
            return [];
        }
    }

    /**
     * Get database size (approximate)
     */
    async getDatabaseSize(dbName: string): Promise<number> {
        return new Promise((resolve) => {
            const request = indexedDB.open(dbName);

            request.onerror = () => {
                console.error(`Failed to open database ${dbName}`);
                resolve(0);
            };

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                let totalSize = 0;

                try {
                    const transaction = db.transaction(db.objectStoreNames, 'readonly');
                    let completedStores = 0;

                    for (const storeName of db.objectStoreNames) {
                        const store = transaction.objectStore(storeName);
                        const countRequest = store.count();

                        countRequest.onsuccess = () => {
                            // Rough estimate: assume 1KB per record
                            totalSize += countRequest.result * 1024;
                            completedStores++;

                            if (completedStores === db.objectStoreNames.length) {
                                db.close();
                                resolve(totalSize);
                            }
                        };

                        countRequest.onerror = () => {
                            completedStores++;
                            if (completedStores === db.objectStoreNames.length) {
                                db.close();
                                resolve(totalSize);
                            }
                        };
                    }

                    if (db.objectStoreNames.length === 0) {
                        db.close();
                        resolve(0);
                    }
                } catch (error) {
                    console.error(`Error calculating size for ${dbName}:`, error);
                    db.close();
                    resolve(0);
                }
            };
        });
    }

    /**
     * Delete a specific database
     */
    async deleteDatabase(dbName: string): Promise<boolean> {
        return new Promise((resolve) => {
            // Close any open connections to this database
            const connection = this.openConnections.get(dbName);
            if (connection) {
                connection.close();
                this.openConnections.delete(dbName);
            }

            const deleteRequest = indexedDB.deleteDatabase(dbName);

            deleteRequest.onsuccess = () => {
                console.log(`✅ Successfully deleted IndexedDB: ${dbName}`);
                resolve(true);
            };

            deleteRequest.onerror = (event) => {
                console.error(`❌ Failed to delete IndexedDB ${dbName}:`, event);
                resolve(false);
            };

            deleteRequest.onblocked = () => {
                console.warn(`⚠️ Delete blocked for IndexedDB ${dbName} - other connections may be open`);
                // Try to force close connections and retry
                setTimeout(() => {
                    const retryRequest = indexedDB.deleteDatabase(dbName);
                    retryRequest.onsuccess = () => resolve(true);
                    retryRequest.onerror = () => resolve(false);
                }, 1000);
            };
        });
    }

    /**
     * Clean up old or large databases
     */
    async cleanupDatabases(options: IndexedDBCleanupOptions = {}): Promise<{
        deleted: string[];
        errors: string[];
        totalSizeFreed: number;
    }> {
        const {
            maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days
            maxSize = 100 * 1024 * 1024, // 100MB
            keepDatabases = ['auth_cache', 'user_preferences'],
        } = options;

        const databases = await this.getDatabases();
        const deleted: string[] = [];
        const errors: string[] = [];
        let totalSizeFreed = 0;

        console.log(`🧹 Starting IndexedDB cleanup for ${databases.length} databases...`);

        for (const dbInfo of databases) {
            // Skip databases we want to keep
            if (keepDatabases.includes(dbInfo.name)) {
                continue;
            }

            try {
                const size = await this.getDatabaseSize(dbInfo.name);
                const shouldDelete = size > maxSize;

                if (shouldDelete) {
                    console.log(`🗑️ Deleting large database: ${dbInfo.name} (${this.formatBytes(size)})`);
                    const success = await this.deleteDatabase(dbInfo.name);

                    if (success) {
                        deleted.push(dbInfo.name);
                        totalSizeFreed += size;
                    } else {
                        errors.push(dbInfo.name);
                    }
                }
            } catch (error) {
                console.error(`Error processing database ${dbInfo.name}:`, error);
                errors.push(dbInfo.name);
            }
        }

        console.log(`✅ IndexedDB cleanup completed: ${deleted.length} deleted, ${errors.length} errors, ${this.formatBytes(totalSizeFreed)} freed`);

        return { deleted, errors, totalSizeFreed };
    }

    /**
     * Emergency cleanup - delete all non-essential databases
     */
    async emergencyCleanup(): Promise<void> {
        console.warn('🚨 Performing emergency IndexedDB cleanup...');

        const essentialDatabases = ['auth_cache', 'user_preferences'];
        const databases = await this.getDatabases();

        const deletePromises = databases
            .filter(db => !essentialDatabases.includes(db.name))
            .map(db => this.deleteDatabase(db.name));

        await Promise.allSettled(deletePromises);

        // Force garbage collection
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Track open database connections
     */
    trackConnection(dbName: string, db: IDBDatabase): void {
        this.openConnections.set(dbName, db);

        // Auto-cleanup when database is closed
        db.addEventListener('close', () => {
            this.openConnections.delete(dbName);
        });
    }

    /**
     * Close all open connections
     */
    closeAllConnections(): void {
        console.log(`🔌 Closing ${this.openConnections.size} IndexedDB connections...`);

        this.openConnections.forEach((db, name) => {
            try {
                db.close();
                console.log(`✅ Closed connection to ${name}`);
            } catch (error) {
                console.error(`❌ Error closing connection to ${name}:`, error);
            }
        });

        this.openConnections.clear();
    }

    /**
     * Start periodic cleanup
     */
    private startPeriodicCleanup(): void {
        if (this.cleanupInterval) {
            return;
        }

        this.cleanupInterval = setInterval(async () => {
            try {
                await this.cleanupDatabases();
            } catch (error) {
                console.error('Error during periodic IndexedDB cleanup:', error);
            }
        }, this.CLEANUP_INTERVAL);
    }

    /**
     * Stop periodic cleanup
     */
    private stopPeriodicCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Get total IndexedDB usage
     */
    async getTotalUsage(): Promise<{
        databases: IndexedDBInfo[];
        totalSize: number;
        connectionCount: number;
    }> {
        const databases = await this.getDatabases();
        let totalSize = 0;

        for (const db of databases) {
            const size = await this.getDatabaseSize(db.name);
            db.size = size;
            totalSize += size;
        }

        return {
            databases,
            totalSize,
            connectionCount: this.openConnections.size,
        };
    }

    /**
     * Format bytes to human readable string
     */
    private formatBytes(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) {return '0 Bytes';}
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Cleanup all resources
     */
    private cleanup = (): void => {
        this.stopPeriodicCleanup();
        this.closeAllConnections();
    };
}

// Export singleton instance
export const IndexedDBManager = IndexedDBManagerClass.getInstance();

// React hook for IndexedDB management
export function useIndexedDBManager() {
    const [usage, setUsage] = React.useState<{
        databases: IndexedDBInfo[];
        totalSize: number;
        connectionCount: number;
    }>({ databases: [], totalSize: 0, connectionCount: 0 });

    React.useEffect(() => {
        // Update usage periodically
        const updateUsage = async () => {
            try {
                const currentUsage = await IndexedDBManager.getTotalUsage();
                setUsage(currentUsage);
            } catch (error) {
                console.error('Failed to get IndexedDB usage:', error);
            }
        };

        updateUsage();
        const interval = setInterval(updateUsage, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const cleanup = React.useCallback(async (options?: IndexedDBCleanupOptions) => {
        return await IndexedDBManager.cleanupDatabases(options);
    }, []);

    const emergencyCleanup = React.useCallback(async () => {
        return await IndexedDBManager.emergencyCleanup();
    }, []);

    return {
        usage,
        cleanup,
        emergencyCleanup,
        deleteDatabase: IndexedDBManager.deleteDatabase.bind(IndexedDBManager),
        closeAllConnections: IndexedDBManager.closeAllConnections.bind(IndexedDBManager),
    };
}

export default IndexedDBManager;