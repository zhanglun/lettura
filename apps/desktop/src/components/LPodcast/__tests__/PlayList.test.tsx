import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "@/stores";
import type { AudioTrack } from "../index";
import { PlayList } from "../PlayList";

const deleteMock = vi.fn(() => Promise.resolve());

vi.mock("@/helpers/podcastDB", () => ({
  db: {
    podcasts: {
      where: vi.fn(() => ({ equals: vi.fn(() => ({ delete: deleteMock })) })),
    },
  },
}));

const track = (uuid: string, title = uuid): AudioTrack => ({
  uuid,
  title,
  url: `https://example.com/${uuid}.mp3`,
  feed_title: "内核恐慌",
  feed_logo: "logo",
  duration: 3600,
});

describe("PlayList", () => {
  afterEach(() => {
    cleanup();
    useAppStore.setState({
      tracks: [],
      currentTrack: null,
      podcastPlayingStatus: false,
      podcastLoading: false,
    });
    deleteMock.mockClear();
  });

  it("列出整条队列，当前集带「播放中」洗色行", () => {
    useAppStore.setState({
      tracks: [track("a"), track("b")],
      currentTrack: track("a"),
      podcastPlayingStatus: true,
    });

    render(
      <>
        <PlayList />
      </>,
    );

    const rows = document.querySelectorAll(".fusion-queue .q-row");
    expect(rows).toHaveLength(2);
    expect(rows[0].className).toContain("now");
    expect(rows[0].textContent).toContain("podcast.playing");
    expect(rows[0].querySelectorAll(".q-eq i")).toHaveLength(3);
    expect(rows[1].className).not.toContain("now");
    // 时长格式化统一走 formatDuration：≥1h 显示 h:mm:ss（与文章角标同口径）
    expect(rows[1].querySelector(".q-d")?.textContent).toBe("1:00:00");
  });

  it("当前集缓冲中显示加载徽标，暂停时显示已暂停", () => {
    useAppStore.setState({
      tracks: [track("a")],
      currentTrack: track("a"),
      podcastPlayingStatus: true,
      podcastLoading: true,
    });

    render(<PlayList />);
    const row = document.querySelectorAll(".q-row")[0];
    expect(row?.textContent).toContain("podcast.loading");
    expect(row?.querySelector(".fusion-spin")).toBeTruthy();

    cleanup();
    useAppStore.setState({
      podcastLoading: false,
      podcastPlayingStatus: false,
    });
    render(<PlayList />);
    expect(document.querySelectorAll(".q-row")[0]?.textContent).toContain(
      "podcast.paused",
    );
  });

  it("空队列走引导态", () => {
    useAppStore.setState({ tracks: [], currentTrack: null });

    render(
      <>
        <PlayList />
      </>,
    );

    expect(document.querySelectorAll(".q-row")).toHaveLength(0);
    expect(document.querySelector(".pl-empty")).toBeTruthy();
  });

  it("点行切换当前集并开始播放", () => {
    useAppStore.setState({
      tracks: [track("a"), track("b")],
      currentTrack: track("a"),
      podcastPlayingStatus: false,
    });

    render(
      <>
        <PlayList />
      </>,
    );

    fireEvent.click(document.querySelectorAll(".q-row")[1]);

    expect(useAppStore.getState().currentTrack?.uuid).toBe("b");
    expect(useAppStore.getState().podcastPlayingStatus).toBe(true);
  });

  it("点当前集 = 播放/暂停", () => {
    useAppStore.setState({
      tracks: [track("a")],
      currentTrack: track("a"),
      podcastPlayingStatus: true,
    });

    render(
      <>
        <PlayList />
      </>,
    );

    fireEvent.click(document.querySelectorAll(".q-row")[0]);

    expect(useAppStore.getState().podcastPlayingStatus).toBe(false);
  });

  it("悬停删除钮把该集移出队列", async () => {
    useAppStore.setState({
      tracks: [track("a"), track("b")],
      currentTrack: track("a"),
    });

    render(
      <>
        <PlayList />
      </>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]);

    await waitFor(() =>
      expect(useAppStore.getState().tracks.map((t) => t.uuid)).toEqual(["a"]),
    );
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});
