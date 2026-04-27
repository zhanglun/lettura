import { describe, it, expect, vi, beforeEach } from "vitest";
import { create } from "zustand";
import { createTodaySlice } from "../createTodaySlice";
import type { TodaySlice } from "../createTodaySlice";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/helpers/dataAgent", () => ({
  getTodayOverview: vi.fn(),
  submitFeedback: vi.fn(),
}));

import { getTodayOverview } from "@/helpers/dataAgent";

const mockGetTodayOverview = getTodayOverview as ReturnType<typeof vi.fn>;

describe("createTodaySlice — overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T-F01: fetchOverview sets overview on success", async () => {
    const mockOverview = {
      summary: "AI tools are evolving rapidly",
      signal_count: 5,
      article_count: 20,
      generated_at: "2026-06-01T12:00:00Z",
      is_stale: false,
    };
    mockGetTodayOverview.mockResolvedValue(mockOverview);

    const store = create<TodaySlice>(createTodaySlice);
    await store.getState().fetchOverview();

    const state = store.getState();
    expect(state.overview).toEqual(mockOverview);
    expect(state.overviewLoading).toBe(false);
    expect(state.overviewError).toBeNull();
  });

  it("T-F02: fetchOverview sets overviewError on failure", async () => {
    mockGetTodayOverview.mockRejectedValue(new Error("AI_NO_API_KEY"));

    const store = create<TodaySlice>(createTodaySlice);
    await store.getState().fetchOverview();

    const state = store.getState();
    expect(state.overview).toBeNull();
    expect(state.overviewLoading).toBe(false);
    expect(state.overviewError).toBe("Error: AI_NO_API_KEY");
  });

  it("T-F03: fetchOverview sets loading state during fetch", async () => {
    let resolvePromise: (value: unknown) => void;
    mockGetTodayOverview.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const store = create<TodaySlice>(createTodaySlice);
    const promise = store.getState().fetchOverview();

    expect(store.getState().overviewLoading).toBe(true);
    expect(store.getState().overviewError).toBeNull();

    resolvePromise!({ summary: "test", signal_count: 1, article_count: 1, generated_at: "", is_stale: false });
    await promise;

    expect(store.getState().overviewLoading).toBe(false);
  });

  it("T-F04: initial overview state is null and not loading", () => {
    const store = create<TodaySlice>(createTodaySlice);
    const state = store.getState();

    expect(state.overview).toBeNull();
    expect(state.overviewLoading).toBe(false);
    expect(state.overviewError).toBeNull();
  });
});
