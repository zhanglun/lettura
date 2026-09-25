import React, { useEffect, useState } from "react";
import { DropdownMenu } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { SLEEP_STEPS, SleepTimer } from "@/stores/createPodcastSlice";
import { formatTime } from "./utils";

const OFF = "off";

/** 剩余秒数：定时活跃时每秒重算（到点由 store 清空定时并暂停） */
function useRemainingSeconds(timer: SleepTimer | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  if (!timer) return null;
  return Math.max(0, Math.round((timer.endsAt - now) / 1000));
}

const MoonIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
  >
    <path d="M13.4 9.6A5.6 5.6 0 0 1 6.4 2.6a5.6 5.6 0 1 0 7 7z" />
  </svg>
);

/** 睡眠定时：条与沉浸页共用的尾部控件——激活时 chip 显示剩余时间（podcast.html 契约） */
export const SleepControl: React.FC = () => {
  const { t } = useTranslation();
  const { sleepTimer, setSleepTimer } = useBearStore(
    useShallow((state) => ({
      sleepTimer: state.sleepTimer,
      setSleepTimer: state.setSleepTimer,
    })),
  );
  const remaining = useRemainingSeconds(sleepTimer);
  const title =
    remaining !== null
      ? t("podcast.sleep.remaining", { time: formatTime(remaining) })
      : t("podcast.sleep.title");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <button
          type="button"
          className={remaining !== null ? "fusion-chip on" : "fusion-pctl"}
          title={title}
          aria-label={t("podcast.sleep.title")}
        >
          <MoonIcon />
          {remaining !== null && formatTime(remaining)}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className="fusion-sleep-menu"
        side="top"
        align="end"
        sideOffset={10}
      >
        <DropdownMenu.RadioGroup
          value={sleepTimer ? String(sleepTimer.minutes) : OFF}
          onValueChange={(value) =>
            setSleepTimer(value === OFF ? null : Number(value))
          }
        >
          <DropdownMenu.RadioItem value={OFF} className="fusion-sleep-item">
            {t("podcast.sleep.off")}
          </DropdownMenu.RadioItem>
          {SLEEP_STEPS.map((minutes) => (
            <DropdownMenu.RadioItem
              key={minutes}
              value={String(minutes)}
              className="fusion-sleep-item"
            >
              {t("podcast.sleep.minutes", { n: minutes })}
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
