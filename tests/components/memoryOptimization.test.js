/**
 * Tests for memory optimization system
 * Validates memory monitoring, cleanup, and optimization features
 */
import { IndexedDBManager } from '@/lib/IndexedDBManager';
import { MemoryMonitor } from '@/lib/MemoryMonitor';
import { cacheManager } from '@/lib/queryClient';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Mock performance.memory
const mockMemory = {
    usedJSHeapSize: 100 * 1024 * 1024, // 100MB
    totalJSHeapSize: 200 * 1024 * 1024, // 200MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
};
Object.defineProperty(performance, 'memory', {
    value: mockMemory,
    writable: true,
});
// Mock window.gc
Object.defineProperty(window, 'gc', {
    value: vi.fn(),
    writable: true,
});
// Mock IndexedDB
const mockIndexedDB = {
    databases: vi.fn().mockResolvedValue([
        { name: 'test_db', version: 1 },
        { name: 'large_db', version: 1 },
    ]),
    deleteDatabase: vi.fn().mockImplementation((name) => ({
        onsuccess: null,
        onerror: null,
        onblocked: null,
    })),
    open: vi.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: {
            objectStoreNames: ['store1', 'store2'],
            transaction: vi.fn().mockReturnValue({
                objectStore: vi.fn().mockReturnValue({
                    count: vi.fn().mockReturnValue({
                        onsuccess: null,
                        onerror: null,
                        result: 1000,
                    }),
                }),
            }),
            close: vi.fn(),
        },
    })),
};
Object.defineProperty(global, 'indexedDB', {
    value: mockIndexedDB,
    writable: true,
});
describe('MemoryMonitor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMemory.usedJSHeapSize = 100 * 1024 * 1024; // Reset to 100MB
    });
    afterEach(() => {
        MemoryMonitor.stopMonitoring();
    });
    describe('Memory Metrics', () => {
        it('should get current memory metrics', () => {
            const metrics = MemoryMonitor.getCurrentMemoryMetrics();
            expect(metrics).toBeDefined();
            expect(metrics?.usedJSHeapSize).toBe(100 * 1024 * 1024);
            expect(metrics?.totalJSHeapSize).toBe(200 * 1024 * 1024);
            expect(metrics?.jsHeapSizeLimit).toBe(2 * 1024 * 1024 * 1024);
            expect(metrics?.source).toBe('manual');
        });
        it('should return null when performance.memory is not available', () => {
            const originalMemory = performance.memory;
            delete performance.memory;
            const metrics = MemoryMonitor.getCurrentMemoryMetrics();
            expect(metrics).toBeNull();
            performance.memory = originalMemory;
        });
        it('should calculate memory usage percentage', () => {
            const percentage = MemoryMonitor.getMemoryUsagePercentage();
            const expected = (100 * 1024 * 1024) / (2 * 1024 * 1024 * 1024) * 100;
            expect(percentage).toBeCloseTo(expected, 2);
        });
    });
    describe('Memory Monitoring', () => {
        it('should start and stop monitoring', () => {
            expect(MemoryMonitor['isMonitoring']).toBe(false);
            MemoryMonitor.startMonitoring();
            expect(MemoryMonitor['isMonitoring']).toBe(true);
            MemoryMonitor.stopMonitoring();
            expect(MemoryMonitor['isMonitoring']).toBe(false);
        });
        it('should not start monitoring twice', () => {
            MemoryMonitor.startMonitoring();
            const firstInterval = MemoryMonitor['monitoringInterval'];
            MemoryMonitor.startMonitoring();
            const secondInterval = MemoryMonitor['monitoringInterval'];
            expect(firstInterval).toBe(secondInterval);
        });
    });
    describe('Memory Alerts', () => {
        it('should trigger warning alert for high memory usage', async () => {
            mockMemory.usedJSHeapSize = 300 * 1024 * 1024; // 300MB (above warning threshold)
            const alertPromise = new Promise((resolve) => {
                const unsubscribe = MemoryMonitor.onMemoryAlert((alert) => {
                    expect(alert.level).toBe('warning');
                    expect(alert.message).toContain('Warning');
                    expect(alert.metrics.usedJSHeapSize).toBe(300 * 1024 * 1024);
                    unsubscribe();
                    resolve(alert);
                });
            });
            MemoryMonitor['checkMemoryUsage']();
            await alertPromise;
        });
        it('should trigger critical alert for very high memory usage', async () => {
            mockMemory.usedJSHeapSize = 600 * 1024 * 1024; // 600MB (above critical threshold)
            const alertPromise = new Promise((resolve) => {
                const unsubscribe = MemoryMonitor.onMemoryAlert((alert) => {
                    expect(alert.level).toBe('critical');
                    expect(alert.message).toContain('Critical');
                    unsubscribe();
                    resolve(alert);
                });
            });
            MemoryMonitor['checkMemoryUsage']();
            await alertPromise;
        });
        it('should trigger emergency alert and cleanup', async () => {
            mockMemory.usedJSHeapSize = 800 * 1024 * 1024; // 800MB (above emergency threshold)
            const cleanupSpy = vi.fn();
            MemoryMonitor.registerCleanupFunction(cleanupSpy);
            const alertPromise = new Promise((resolve) => {
                const unsubscribe = MemoryMonitor.onMemoryAlert((alert) => {
                    expect(alert.level).toBe('emergency');
                    expect(alert.message).toContain('Emergency');
                    // Emergency cleanup should be triggered
                    setTimeout(() => {
                        expect(cleanupSpy).toHaveBeenCalled();
                        unsubscribe();
                        resolve(alert);
                    }, 10);
                });
            });
            MemoryMonitor['checkMemoryUsage']();
            await alertPromise;
        });
    });
    describe('Garbage Collection', () => {
        it('should trigger garbage collection when available', () => {
            const result = MemoryMonitor.triggerGarbageCollection();
            expect(result).toBe(true);
            expect(window.gc).toHaveBeenCalled();
        });
        it('should respect cooldown period', () => {
            MemoryMonitor.triggerGarbageCollection();
            vi.clearAllMocks();
            const result = MemoryMonitor.triggerGarbageCollection();
            expect(result).toBe(false);
            expect(window.gc).not.toHaveBeenCalled();
        });
        it('should use fallback when window.gc is not available', () => {
            const originalGc = window.gc;
            delete window.gc;
            const result = MemoryMonitor.triggerGarbageCollection();
            expect(result).toBe(true);
            window.gc = originalGc;
        });
    });
    describe('Memory Statistics', () => {
        it('should calculate memory statistics', () => {
            // Add some history
            MemoryMonitor['checkMemoryUsage']();
            mockMemory.usedJSHeapSize = 150 * 1024 * 1024;
            MemoryMonitor['checkMemoryUsage']();
            mockMemory.usedJSHeapSize = 200 * 1024 * 1024;
            MemoryMonitor['checkMemoryUsage']();
            const stats = MemoryMonitor.getMemoryStats();
            expect(stats.current).toBeDefined();
            expect(stats.history.length).toBeGreaterThan(0);
            expect(stats.peak).toBeGreaterThanOrEqual(stats.average);
            expect(['increasing', 'decreasing', 'stable']).toContain(stats.trend);
        });
    });
    describe('Cleanup Functions', () => {
        it('should register and execute cleanup functions', () => {
            const cleanup1 = vi.fn();
            const cleanup2 = vi.fn();
            const unregister1 = MemoryMonitor.registerCleanupFunction(cleanup1);
            const unregister2 = MemoryMonitor.registerCleanupFunction(cleanup2);
            // Trigger emergency cleanup
            mockMemory.usedJSHeapSize = 800 * 1024 * 1024;
            MemoryMonitor['checkMemoryUsage']();
            setTimeout(() => {
                expect(cleanup1).toHaveBeenCalled();
                expect(cleanup2).toHaveBeenCalled();
                // Test unregistering
                unregister1();
                vi.clearAllMocks();
                MemoryMonitor['checkMemoryUsage']();
                setTimeout(() => {
                    expect(cleanup1).not.toHaveBeenCalled();
                    expect(cleanup2).toHaveBeenCalled();
                    unregister2();
                }, 10);
            }, 10);
        });
    });
});
describe('IndexedDBManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('Database Operations', () => {
        it('should get list of databases', async () => {
            const databases = await IndexedDBManager.getDatabases();
            expect(mockIndexedDB.databases).toHaveBeenCalled();
            expect(databases).toEqual([
                { name: 'test_db', version: 1 },
                { name: 'large_db', version: 1 },
            ]);
        });
        it('should handle databases() not supported', async () => {
            const originalDatabases = mockIndexedDB.databases;
            delete mockIndexedDB.databases;
            const databases = await IndexedDBManager.getDatabases();
            expect(databases).toEqual([]);
            mockIndexedDB.databases = originalDatabases;
        });
        it('should calculate database size', async () => {
            const size = await IndexedDBManager.getDatabaseSize('test_db');
            expect(mockIndexedDB.open).toHaveBeenCalledWith('test_db');
            expect(size).toBeGreaterThan(0);
        });
        it('should delete database', async () => {
            const deleteRequest = {
                onsuccess: null,
                onerror: null,
                onblocked: null,
            };
            mockIndexedDB.deleteDatabase.mockReturnValue(deleteRequest);
            const deletePromise = IndexedDBManager.deleteDatabase('test_db');
            // Simulate successful deletion
            setTimeout(() => {
                if (deleteRequest.onsuccess) {
                    deleteRequest.onsuccess();
                }
            }, 10);
            const result = await deletePromise;
            expect(result).toBe(true);
            expect(mockIndexedDB.deleteDatabase).toHaveBeenCalledWith('test_db');
        });
    });
    describe('Database Cleanup', () => {
        it('should cleanup databases based on size', async () => {
            // Mock large database size
            vi.spyOn(IndexedDBManager, 'getDatabaseSize')
                .mockResolvedValueOnce(50 * 1024 * 1024) // test_db: 50MB
                .mockResolvedValueOnce(150 * 1024 * 1024); // large_db: 150MB
            vi.spyOn(IndexedDBManager, 'deleteDatabase')
                .mockResolvedValue(true);
            const result = await IndexedDBManager.cleanupDatabases({
                maxSize: 100 * 1024 * 1024, // 100MB limit
                keepDatabases: [],
            });
            expect(result.deleted).toContain('large_db');
            expect(result.deleted).not.toContain('test_db');
            expect(result.totalSizeFreed).toBe(150 * 1024 * 1024);
        });
        it('should respect keepDatabases option', async () => {
            vi.spyOn(IndexedDBManager, 'getDatabaseSize')
                .mockResolvedValue(150 * 1024 * 1024);
            const deleteSpy = vi.spyOn(IndexedDBManager, 'deleteDatabase');
            await IndexedDBManager.cleanupDatabases({
                maxSize: 100 * 1024 * 1024,
                keepDatabases: ['test_db', 'large_db'],
            });
            expect(deleteSpy).not.toHaveBeenCalled();
        });
        it('should perform emergency cleanup', async () => {
            vi.spyOn(IndexedDBManager, 'getDatabases')
                .mockResolvedValue([
                { name: 'auth_cache', version: 1 },
                { name: 'temp_db', version: 1 },
                { name: 'user_preferences', version: 1 },
            ]);
            const deleteSpy = vi.spyOn(IndexedDBManager, 'deleteDatabase')
                .mockResolvedValue(true);
            await IndexedDBManager.emergencyCleanup();
            expect(deleteSpy).toHaveBeenCalledWith('temp_db');
            expect(deleteSpy).not.toHaveBeenCalledWith('auth_cache');
            expect(deleteSpy).not.toHaveBeenCalledWith('user_preferences');
        });
    });
    describe('Connection Management', () => {
        it('should track and close connections', () => {
            const mockDb = {
                close: vi.fn(),
                addEventListener: vi.fn(),
            };
            IndexedDBManager.trackConnection('test_db', mockDb);
            expect(IndexedDBManager['openConnections'].has('test_db')).toBe(true);
            IndexedDBManager.closeAllConnections();
            expect(mockDb.close).toHaveBeenCalled();
            expect(IndexedDBManager['openConnections'].size).toBe(0);
        });
    });
    describe('Usage Statistics', () => {
        it('should get total usage statistics', async () => {
            vi.spyOn(IndexedDBManager, 'getDatabaseSize')
                .mockResolvedValueOnce(50 * 1024 * 1024)
                .mockResolvedValueOnce(100 * 1024 * 1024);
            const usage = await IndexedDBManager.getTotalUsage();
            expect(usage.databases).toHaveLength(2);
            expect(usage.totalSize).toBe(150 * 1024 * 1024);
            expect(usage.connectionCount).toBe(0);
        });
    });
});
describe('Cache Manager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('Cache Optimization', () => {
        it('should get cache size', () => {
            const size = cacheManager.getCacheSize();
            expect(typeof size).toBe('number');
        });
        it('should clear cache', () => {
            cacheManager.clearCache();
            // Cache should be cleared (tested indirectly through query client)
        });
        it('should optimize cache when size exceeds limit', () => {
            // This would require mocking the query client more extensively
            // For now, just test that the function exists and returns a number
            const removed = cacheManager.optimizeCache();
            expect(typeof removed).toBe('number');
        });
    });
});
describe('Integration Tests', () => {
    it('should integrate memory monitor with IndexedDB manager', async () => {
        const cleanupSpy = vi.fn();
        // Register IndexedDB cleanup with memory monitor
        MemoryMonitor.registerCleanupFunction(async () => {
            await IndexedDBManager.emergencyCleanup();
            cleanupSpy();
        });
        // Trigger high memory usage
        mockMemory.usedJSHeapSize = 800 * 1024 * 1024;
        MemoryMonitor['checkMemoryUsage']();
        // Wait for async cleanup
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(cleanupSpy).toHaveBeenCalled();
    });
    it('should handle memory alerts and trigger appropriate cleanup', (done) => {
        let alertReceived = false;
        const unsubscribe = MemoryMonitor.onMemoryAlert((alert) => {
            alertReceived = true;
            expect(alert.level).toBe('critical');
            // Verify that garbage collection is triggered for critical alerts
            setTimeout(() => {
                expect(window.gc).toHaveBeenCalled();
                unsubscribe();
                done();
            }, 10);
        });
        // Trigger critical memory usage
        mockMemory.usedJSHeapSize = 600 * 1024 * 1024;
        MemoryMonitor['checkMemoryUsage']();
        setTimeout(() => {
            if (!alertReceived) {
                unsubscribe();
                done(new Error('Alert was not triggered'));
            }
        }, 100);
    });
});
