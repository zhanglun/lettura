import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { create } from "zustand";
import { createPodcastSlice, PodcastSlice } from "../createPodcastSlice";
import { AudioTrack } from "@/components/LPodcast";

// Dexie/IndexedDB 在 jsdom 不可用：只替掉被 slice 触碰的写入路径
vi.mock("@/helpers/podcastDB", () => {
  const chain = {
    delete: vi.fn(() => Promise.resolve()),
    modify: vi.fn(() => Promise.resolve()),
  };
  return {
    db: {
      podcasts: {
        add: vi.fn(() => Promise.resolve(1)),
        where: vi.fn(() => ({ equals: vi.fn(() => chain) })),
      },
    },
  };
});

const track = (uuid: string): AudioTrack => ({
  uuid,
  title: uuid,
  url: `https://example.com/${uuid}.mp3`,
  feed_title: "feed",
  feed_logo: "logo",
});

const createTestStore = () =>
  create<PodcastSlice>((set, get, ...args) =>
    createPodcastSlice(set, get as any, ...args),
  );

describe("createPodcastSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  afterEach(() => {
    store.getState().setSleepTimer(null);
    vi.useRealTimers();
  });

  it("初始态：底条形态、未播放、空队列、无定时", () => {
    const state = store.getState();

    expect(state.playerMode).toBe("bar");
    expect(state.podcastPlayingStatus).toBe(false);
    expect(state.currentTrack).toBeNull();
    expect(state.tracks).toEqual([]);
    expect(state.sleepTimer).toBeNull();
  });

  describe("playNext / playPrev", () => {
    beforeEach(() => {
      store.getState().setTracks([track("a"), track("b"), track("c")]);
    });

    it("playNext 前进并在队尾回卷", () => {
      store.getState().setCurrentTrack(track("b"));
      store.getState().playNext();
      expect(store.getState().currentTrack?.uuid).toBe("c");
      expect(store.getState().podcastPlayingStatus).toBe(true);

      store.getState().playNext();
      expect(store.getState().currentTrack?.uuid).toBe("a");
    });

    it("playPrev 后退并在队首回卷", () => {
      store.getState().setCurrentTrack(track("b"));
      store.getState().playPrev();
      expect(store.getState().currentTrack?.uuid).toBe("a");

      store.getState().playPrev();
      expect(store.getState().currentTrack?.uuid).toBe("c");
    });

    it("无当前曲目时从队首开始", () => {
      store.getState().playNext();
      expect(store.getState().currentTrack?.uuid).toBe("a");
    });

    it("空队列不动", () => {
      store.getState().setTracks([]);
      store.getState().setCurrentTrack(null);
      store.getState().playNext();
      expect(store.getState().currentTrack).toBeNull();
    });
  });

  describe("playTrack", () => {
    it("点非当前集：切过去并播放", () => {
      store.getState().setCurrentTrack(track("a"));

      store.getState().playTrack(track("b"));

      expect(store.getState().currentTrack?.uuid).toBe("b");
      expect(store.getState().podcastPlayingStatus).toBe(true);
    });

    it("点当前集：切换播放/暂停", () => {
      store.getState().setCurrentTrack(track("a"));
      store.getState().updatePodcastPlayingStatus(true);

      store.getState().playTrack(track("a"));
      expect(store.getState().podcastPlayingStatus).toBe(false);

      store.getState().playTrack(track("a"));
      expect(store.getState().podcastPlayingStatus).toBe(true);
    });
  });

  describe("removeTrack", () => {
    it("删除当前曲目：接替者顶上，继续播放", async () => {
      store.getState().setTracks([track("a"), track("b"), track("c")]);
      store.getState().setCurrentTrack(track("b"));
      store.getState().updatePodcastPlayingStatus(true);

      await store.getState().removeTrack(track("b"));

      expect(store.getState().tracks.map((t) => t.uuid)).toEqual(["a", "c"]);
      expect(store.getState().currentTrack?.uuid).toBe("c");
      expect(store.getState().podcastPlayingStatus).toBe(true);
    });

    it("删除当前最后一集：回落到新的末位", async () => {
      store.getState().setTracks([track("a"), track("b"), track("c")]);
      store.getState().setCurrentTrack(track("c"));

      await store.getState().removeTrack(track("c"));

      expect(store.getState().currentTrack?.uuid).toBe("b");
    });

    it("删空队列：停播并清空当前曲目", async () => {
      store.getState().setTracks([track("a")]);
      store.getState().setCurrentTrack(track("a"));
      store.getState().updatePodcastPlayingStatus(true);

      await store.getState().removeTrack(track("a"));

      expect(store.getState().currentTrack).toBeNull();
      expect(store.getState().podcastPlayingStatus).toBe(false);
    });

    it("删除非当前曲目：播放不中断", async () => {
      store.getState().setTracks([track("a"), track("b")]);
      store.getState().setCurrentTrack(track("a"));

      await store.getState().removeTrack(track("b"));

      expect(store.getState().currentTrack?.uuid).toBe("a");
    });
  });

  describe("sleepTimer", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("到点清空定时并暂停播放", () => {
      store.getState().updatePodcastPlayingStatus(true);
      store.getState().setSleepTimer(1);

      expect(store.getState().sleepTimer?.minutes).toBe(1);

      vi.advanceTimersByTime(60_000);

      expect(store.getState().sleepTimer).toBeNull();
      expect(store.getState().podcastPlayingStatus).toBe(false);
    });

    it("重设定时会作废旧定时", () => {
      store.getState().updatePodcastPlayingStatus(true);
      store.getState().setSleepTimer(1);
      vi.advanceTimersByTime(30_000);

      store.getState().setSleepTimer(15);
      vi.advanceTimersByTime(60_000);

      // 旧定时（1 分钟）已作废，新定时还在
      expect(store.getState().sleepTimer?.minutes).toBe(15);
      expect(store.getState().podcastPlayingStatus).toBe(true);
    });

    it("setSleepTimer(null) 关闭定时", () => {
      store.getState().setSleepTimer(30);
      store.getState().setSleepTimer(null);

      expect(store.getState().sleepTimer).toBeNull();
    });
  });
});
