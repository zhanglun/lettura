import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useAppStore } from "@/stores";
import { SleepControl } from "../SleepControl";

// Astryx 菜单内容需要 ResizeObserver，jsdom 未实现
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

const renderControl = () =>
  render(
    <>
      <SleepControl />
    </>,
  );

describe("SleepControl", () => {
  afterEach(() => {
    cleanup();
    useAppStore.getState().setSleepTimer(null);
    vi.useRealTimers();
  });

  it("静默态：月亮钮，无剩余时间", () => {
    renderControl();

    const trigger = screen.getByRole("button", {
      name: "podcast.sleep.title",
    });
    expect(trigger.className).toContain("ghost");
    expect(trigger.textContent).toBe("");
  });

  it("定时激活：chip 显示剩余 mm:ss", () => {
    renderControl();

    act(() => useAppStore.getState().setSleepTimer(30));

    const trigger = screen.getByRole("button", {
      name: /podcast\.sleep\.remaining/,
    });
    expect(trigger.className).toContain("primary");
    expect(trigger.textContent).toContain("30:00");
  });

  it("菜单：关闭 / 15 / 30 / 60，选中项写回定时", () => {
    renderControl();

    fireEvent.click(
      screen.getByRole("button", { name: "podcast.sleep.title" }),
    );

    // 关闭 / 15 / 30 / 60 四个菜单项（role=menuitem）
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(4);
    expect(items[0].textContent).toBe("podcast.sleep.off");

    fireEvent.click(items[2]);
    expect(useAppStore.getState().sleepTimer?.minutes).toBe(30);
  });
});
