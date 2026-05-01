import { describe, it, expect, vi, beforeEach } from "vitest";
import { create } from "zustand";
import { createTodaySlice } from "../createTodaySlice";
import type { TodaySlice } from "../createTodaySlice";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("createTodaySlice — inline reading state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T-IR-01: initial state has no active reading", () => {
    const store = create<TodaySlice>(createTodaySlice);
    const state = store.getState();

    expect(state.activeReadingSignalId).toBeNull();
    expect(state.activeReadingSourceIndex).toBe(0);
    expect(state.isInlineReading).toBe(false);
    expect(state.rightPanelExpanded).toBe(false);
  });

  it("T-IR-02: startInlineReading sets signalId, sourceIndex, isInlineReading, rightPanelExpanded", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42, 1);

    const state = store.getState();
    expect(state.activeReadingSignalId).toBe(42);
    expect(state.activeReadingSourceIndex).toBe(1);
    expect(state.isInlineReading).toBe(true);
    expect(state.rightPanelExpanded).toBe(true);
  });

  it("T-IR-03: startInlineReading defaults sourceIndex to 0 when omitted", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42);

    expect(store.getState().activeReadingSourceIndex).toBe(0);
  });

  it("T-IR-04: closeInlineReading resets all reading state", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42, 2);
    store.getState().closeInlineReading();

    const state = store.getState();
    expect(state.activeReadingSignalId).toBeNull();
    expect(state.activeReadingSourceIndex).toBe(0);
    expect(state.isInlineReading).toBe(false);
    expect(state.rightPanelExpanded).toBe(false);
  });

  it("T-IR-05: navigateReadingSource changes sourceIndex", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42, 0);
    store.getState().navigateReadingSource(2);

    expect(store.getState().activeReadingSourceIndex).toBe(2);
  });

  it("T-IR-06: navigateReadingSource does nothing when not inline reading", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().navigateReadingSource(5);

    expect(store.getState().activeReadingSourceIndex).toBe(0);
  });

  it("T-IR-07: startInlineReading for a new signal resets sourceIndex to 0", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42, 3);
    store.getState().startInlineReading(99);

    expect(store.getState().activeReadingSignalId).toBe(99);
    expect(store.getState().activeReadingSourceIndex).toBe(0);
  });
});
