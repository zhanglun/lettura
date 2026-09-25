import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { matchaTheme } from "@astryxdesign/theme-matcha/built";
import { stoneTheme } from "@astryxdesign/theme-stone/built";
import { gothicTheme } from "@astryxdesign/theme-gothic/built";
import { chocolateTheme } from "@astryxdesign/theme-chocolate/built";
import { butterTheme } from "@astryxdesign/theme-butter/built";
import { y2kTheme } from "@astryxdesign/theme-y2k/built";
import type { DefinedTheme } from "@astryxdesign/core/theme";

export interface AstryxThemeOption {
  /** 持久化 slug（userConfig.astryx_theme） */
  value: string;
  /** 展示名 */
  label: string;
  theme: DefinedTheme;
}

/** 全部主题的 theme.css 已在 styles/index.css 静态导入，切换只换本表项 */
export const ASTRYX_THEMES: AstryxThemeOption[] = [
  { value: "neutral", label: "Neutral", theme: neutralTheme },
  { value: "matcha", label: "Matcha", theme: matchaTheme },
  { value: "stone", label: "Stone", theme: stoneTheme },
  { value: "gothic", label: "Gothic", theme: gothicTheme },
  { value: "chocolate", label: "Chocolate", theme: chocolateTheme },
  { value: "butter", label: "Butter", theme: butterTheme },
  { value: "y2k", label: "Y2K", theme: y2kTheme },
];

export const getAstryxTheme = (slug?: string): DefinedTheme =>
  ASTRYX_THEMES.find((t) => t.value === slug)?.theme ?? neutralTheme;
