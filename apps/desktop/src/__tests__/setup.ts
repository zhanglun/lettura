import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    if (key === "port") return "3000";
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock @tauri-apps/api/core
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock @tauri-apps/api/event
vi.mock("@tauri-apps/api/event", () => ({
  emit: vi.fn(),
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

// Mock @tauri-apps/api/webviewWindow
vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: vi.fn(() => ({
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mock @tauri-apps/plugin-shell
vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

// Mock @tauri-apps/plugin-fs
vi.mock("@tauri-apps/plugin-fs", () => ({
  writeTextFile: vi.fn(),
  readTextFile: vi.fn(),
}));

// Mock @tauri-apps/plugin-dialog
vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
  open: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn() as any;
