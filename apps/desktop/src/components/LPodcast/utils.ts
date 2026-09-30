import type { MotionProps } from "framer-motion";

// 时长格式化统一用 helpers/articleContent 的 formatDuration（h:mm:ss / mm:ss），
// 本文件不再保留一份不支持小时的旧实现

/**
 * 三态切换动效（podcast.html 契约）：150–200ms 缓出，位移 ≤10px，无回弹。
 * 起点贴在各自的固定锚点：条/沉浸页自下缘长起，圆钮自右下角弹入。
 */
export const PLAYER_MOTION: Record<"bar" | "full" | "min", MotionProps> = {
  bar: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
    style: { transformOrigin: "50% 100%" },
  },
  full: {
    initial: { opacity: 0, y: 12, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.99 },
    transition: { duration: 0.2, ease: [0.2, 0, 0, 1] },
    style: { transformOrigin: "50% 100%" },
  },
  min: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.16, ease: [0.2, 0, 0, 1] },
    style: { transformOrigin: "100% 100%" },
  },
};
