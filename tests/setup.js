import { TextDecoder, TextEncoder } from 'node:util';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
Object.assign(global, { TextDecoder, TextEncoder });
// Mock HTMLCanvasElement methods that are not implemented in jsdom
HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    const blob = new Blob(['mock'], { type: 'image/png' });
    callback(blob);
});
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
    })),
}));
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '0px',
    thresholds: [0],
    takeRecords: vi.fn(() => []),
}));
// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
