import { describe, it, expect, vi, beforeEach } from "vitest";
import { create } from "zustand";
import { createTodaySlice } from "../createTodaySlice";
import type { TodaySlice, SignalDetail } from "../createTodaySlice";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("createTodaySlice — source expand/detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T-ST-01: toggleSourceExpand(42) sets expandedSignalId to 42", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().toggleSourceExpand(42);

    expect(store.getState().expandedSignalId).toBe(42);
  });

  it("T-ST-02: toggleSourceExpand(42) then toggleSourceExpand(42) sets expandedSignalId back to null", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().toggleSourceExpand(42);
    expect(store.getState().expandedSignalId).toBe(42);

    store.getState().toggleSourceExpand(42);
    expect(store.getState().expandedSignalId).toBeNull();
  });

  it("T-ST-03: fetchSignalDetail(42) with mocked invoke stores detail in signalDetails", async () => {
    const mockDetail: SignalDetail = {
      signal: {
        id: 42,
        title: "Detailed Signal",
        summary: "Detailed summary",
        why_it_matters: "It matters",
        relevance_score: 0.95,
        source_count: 3,
        sources: [],
        topic_id: null,
        topic_title: null,
        created_at: new Date().toISOString(),
      },
      all_sources: [
        {
          article_id: 1,
          article_uuid: "uuid-1",
          title: "Source 1",
          link: "https://example.com/1",
          feed_title: "Feed A",
          feed_uuid: "feed-a",
          pub_date: new Date().toISOString(),
          excerpt: null,
        },
      ],
    };

    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(mockDetail);

    const store = create<TodaySlice>(createTodaySlice);

    await store.getState().fetchSignalDetail(42);

    const state = store.getState();
    expect(state.signalDetails[42]).toEqual(mockDetail);
  });
});
