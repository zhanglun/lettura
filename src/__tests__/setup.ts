import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    if (key === 'port') return '3000';
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock @tauri-apps/api
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn() as any;
