import { describe, it, expect, vi, beforeEach } from "vitest";
import { create } from "zustand";
import { createTodaySlice } from "../createTodaySlice";
import type { TodaySlice } from "../createTodaySlice";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("createTodaySlice — deep read scroll + expand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T-F01: initial expandedSignalId is null", () => {
    const store = create<TodaySlice>(createTodaySlice);
    expect(store.getState().expandedSignalId).toBeNull();
  });

  it("T-F02: toggleSourceExpand(1) sets expandedSignalId to 1", () => {
    const store = create<TodaySlice>(createTodaySlice);
    store.getState().toggleSourceExpand(1);
    expect(store.getState().expandedSignalId).toBe(1);
  });

  it("T-F03: toggleSourceExpand(1) then toggleSourceExpand(1) sets back to null", () => {
    const store = create<TodaySlice>(createTodaySlice);
    store.getState().toggleSourceExpand(1);
    store.getState().toggleSourceExpand(1);
    expect(store.getState().expandedSignalId).toBeNull();
  });

  it("T-F04: initial scrollPositionMap is empty", () => {
    const store = create<TodaySlice>(createTodaySlice);
    expect(store.getState().scrollPositionMap).toEqual({});
  });

  it("T-F05: setScrollPosition(1, 500) stores scrollY for signal", () => {
    const store = create<TodaySlice>(createTodaySlice);
    store.getState().setScrollPosition(1, 500);
    expect(store.getState().scrollPositionMap[1]).toBe(500);
  });

  it("T-F06: setScrollPosition(1, 500) then setScrollPosition(1, 800) overwrites", () => {
    const store = create<TodaySlice>(createTodaySlice);
    store.getState().setScrollPosition(1, 500);
    store.getState().setScrollPosition(1, 800);
    expect(store.getState().scrollPositionMap[1]).toBe(800);
  });
});
