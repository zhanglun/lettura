import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { SleepControl } from "../SleepControl";
import { useBearStore } from "@/stores";

// Radix ScrollArea（菜单内容）需要 ResizeObserver，jsdom 未实现
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

const renderControl = () =>
  render(
    <Theme>
      <SleepControl />
    </Theme>,
  );

describe("SleepControl", () => {
  afterEach(() => {
    cleanup();
    useBearStore.getState().setSleepTimer(null);
    vi.useRealTimers();
  });

  it("静默态：月亮钮，无剩余时间", () => {
    renderControl();

    const trigger = screen.getByLabelText("podcast.sleep.title");
    expect(trigger.className).toContain("fusion-pctl");
    expect(trigger.textContent).toBe("");
  });

  it("定时激活：chip 显示剩余 mm:ss", () => {
    renderControl();

    act(() => useBearStore.getState().setSleepTimer(30));

    const trigger = screen.getByLabelText("podcast.sleep.title");
    expect(trigger.className).toContain("fusion-chip");
    expect(trigger.textContent).toContain("30:00");
  });

  it("菜单：关闭 / 15 / 30 / 60，选中项写回定时", () => {
    renderControl();

    fireEvent.pointerDown(screen.getByLabelText("podcast.sleep.title"));

    const items = document.querySelectorAll(".fusion-sleep-item");
    expect(items).toHaveLength(4);
    expect(items[0].textContent).toBe("podcast.sleep.off");
    // 菜单项自带 Radix 语义类，样式由 fusion 覆盖
    expect(items[1].className).toContain("rt-DropdownMenuRadioItem");

    fireEvent.click(items[2]);
    expect(useBearStore.getState().sleepTimer?.minutes).toBe(30);
  });
});
