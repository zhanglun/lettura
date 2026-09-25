import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { PlayList } from "../PlayList";
import { useBearStore } from "@/stores";
import type { AudioTrack } from "../index";

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
    useBearStore.setState({
      tracks: [],
      currentTrack: null,
      podcastPlayingStatus: false,
    });
    deleteMock.mockClear();
  });

  it("列出整条队列，当前集带「播放中」洗色行", () => {
    useBearStore.setState({
      tracks: [track("a"), track("b")],
      currentTrack: track("a"),
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
    expect(rows[1].className).not.toContain("now");
    expect(rows[1].querySelector(".q-d")?.textContent).toBe("60:00");
  });

  it("空队列走引导态", () => {
    useBearStore.setState({ tracks: [], currentTrack: null });

    render(
      <>
        <PlayList />
      </>,
    );

    expect(document.querySelectorAll(".q-row")).toHaveLength(0);
    expect(document.querySelector(".pl-empty")).toBeTruthy();
  });

  it("点行切换当前集并开始播放", () => {
    useBearStore.setState({
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

    expect(useBearStore.getState().currentTrack?.uuid).toBe("b");
    expect(useBearStore.getState().podcastPlayingStatus).toBe(true);
  });

  it("点当前集 = 播放/暂停", () => {
    useBearStore.setState({
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

    expect(useBearStore.getState().podcastPlayingStatus).toBe(false);
  });

  it("悬停删除钮把该集移出队列", async () => {
    useBearStore.setState({
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
      expect(useBearStore.getState().tracks.map((t) => t.uuid)).toEqual(["a"]),
    );
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});
