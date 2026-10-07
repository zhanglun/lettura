import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WindowControls } from "../WindowControls";

const { winMocks, platformValue } = vi.hoisted(() => ({
  winMocks: {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    isMaximized: vi.fn(() => Promise.resolve(false)),
    onResized: vi.fn(() => Promise.resolve(() => {})),
  },
  platformValue: { value: "Win32" },
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => winMocks,
}));

function setPlatform(platform: string) {
  Object.defineProperty(window.navigator, "platform", {
    value: platform,
    configurable: true,
  });
  platformValue.value = platform;
}

function renderControls() {
  return render(
    <MemoryRouter>
      <WindowControls />
    </MemoryRouter>,
  );
}

describe("WindowControls", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("Windows/Linux：渲染三钮，点击分别调 minimize/toggleMaximize/close", () => {
    setPlatform("Win32");
    renderControls();

    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));
    expect(winMocks.minimize).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Maximize" }));
    expect(winMocks.toggleMaximize).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(winMocks.close).toHaveBeenCalledTimes(1);
  });

  it("macOS：不渲染自绘控件（原生红绿灯接管）", () => {
    setPlatform("MacIntel");
    const { container } = renderControls();

    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(winMocks.minimize).not.toHaveBeenCalled();
  });
});
