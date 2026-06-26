// Vitest global setup — runs before every test file.
// Provides a clean DOM, mocks browser APIs that jsdom lacks, and silences
// expected console noise from tested code paths.

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Stub matchMedia (used by next-themes and some shadcn components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Stub IntersectionObserver (used by some lazy-loaded components)
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Stub ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Stub scrollTo (jsdom doesn't implement it)
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Clear all mocks and unmount any rendered components between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});
