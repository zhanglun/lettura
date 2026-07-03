import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarFeeds } from "../SidebarFeeds";

vi.mock("@/components/Subscribes", () => ({
  ChannelList: () => <div data-testid="channel-list">Channels</div>,
}));

describe("SidebarFeeds", () => {
  it("renders the subscription channel list directly", () => {
    render(<SidebarFeeds />);

    expect(screen.getByTestId("channel-list")).toBeInTheDocument();
  });
});
