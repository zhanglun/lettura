import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "@/stores";
import { LPodcast } from "../index";

const ROW = {
  uuid: "ep-1",
  title: "与 guevaria 聊本地优先软件",
  mediaURL: "https://example.com/ep-1.mp3",
  feed_title: "内核恐慌",
  feed_logo: "logo",
  author: "",
  thumbnail: "",
  add_date: 1,
  duration: 3600,
};

const liveQuery = vi.hoisted(() => ({ rows: [] as any[] }));

// slice()：每次渲染都换数组身份——投影镜像必须幂等，否则 store 写入 → 重渲染 → 再写入
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => liveQuery.rows.slice(),
}));

vi.mock("@/helpers/podcastDB", () => ({
  db: { podcasts: {} },
  MySubClassedDexie: class {},
}));

vi.mock("../useAudioPlayer", () => ({
  useAudioPlayer: () => ({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    playbackRate: 1,
    setPlaybackRate: () => {},
    togglePlay: () => {},
    seek: () => {},
    skip: () => {},
  }),
  stopSharedAudio: () => {},
}));

const renderPlayer = () =>
  render(
    <>
      <LPodcast visible />
    </>,
  );

describe("LPodcast 三态", () => {
  afterEach(() => {
    cleanup();
    liveQuery.rows = [];
    useAppStore.setState({
      tracks: [],
      currentTrack: null,
      playerMode: "bar",
      podcastPlayingStatus: false,
    });
  });

  it("曲目来自库投影：条态渲染底条（含时间轴与右簇控件）", () => {
    liveQuery.rows = [ROW];

    renderPlayer();

    const slot = document.querySelector(".fusion-player-slot");
    expect(slot).toBeTruthy();
    expect(slot?.querySelector(".fusion-pbar")).toBeTruthy();
    expect(
      [...(slot?.querySelectorAll("button") ?? [])].some(
        (b) => b.textContent === "1×",
      ),
    ).toBe(true);
    expect(useAppStore.getState().tracks).toHaveLength(1);
    expect(useAppStore.getState().currentTrack?.uuid).toBe("ep-1");
  });

  it("放大 → 沉浸页，收起 → 圆钮，回条 → 底条", () => {
    liveQuery.rows = [ROW];

    renderPlayer();

    act(() => useAppStore.getState().setPlayerMode("full"));
    expect(document.querySelector(".fusion-fullplayer")).toBeTruthy();

    act(() => useAppStore.getState().setPlayerMode("min"));
    expect(document.querySelector(".fusion-minipill")).toBeTruthy();

    act(() => useAppStore.getState().setPlayerMode("bar"));
    expect(document.querySelector(".fusion-player")).toBeTruthy();
  });

  it("队列清空（库无行）时卸载播放器并停播", () => {
    liveQuery.rows = [ROW];

    const { rerender } = renderPlayer();
    expect(document.querySelector(".fusion-player")).toBeTruthy();

    act(() => {
      liveQuery.rows = [];
      useAppStore.setState({ podcastPlayingStatus: true });
    });
    rerender(
      <>
        <LPodcast visible />
      </>,
    );

    expect(document.querySelector(".fusion-player")).toBeNull();
    expect(document.querySelector(".fusion-fullplayer")).toBeNull();
    expect(useAppStore.getState().podcastPlayingStatus).toBe(false);
  });
});
