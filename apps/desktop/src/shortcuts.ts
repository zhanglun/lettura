/**
 * 键盘模型的单一事实源。
 *
 * - `HK`：useHotkeys 的**绑定串**——各视图的按键串必须引用这里，禁止手写
 *   （曾经的漂移：帮助表漏了 ↑/↓、⇧M 显示成 M，都源于两处手写）。
 * - `SHORTCUT_GROUPS`：帮助浮层的**展示行**（键帽 + 描述 i18n key + 作用域）。
 *   回调仍留在各自视图（需要闭包），这里只管"是什么键、在哪里生效"。
 */

export const HK = {
  palette: "meta+k, ctrl+k",
  paletteFocus: "/",
  help: "shift+/",
  settings: "meta+comma, ctrl+comma",
  syncAll: "shift+r",
  playPause: "space",
  seekBack: "left",
  seekFwd: "right",
  addFeed: "c",
  /** 文章列表/详情：移动焦点（详情内 j/k 另作滚动用） */
  focusNext: "j",
  focusPrev: "k",
  /** 订阅浏览帧：j/k 与方向键等价 */
  focusNextBrowse: "j, arrowdown",
  focusPrevBrowse: "k, arrowup",
  /** 详情内：上一篇/下一篇（j/k 让位给滚动） */
  articleNext: "arrowdown",
  articlePrev: "arrowup",
  open: "enter, o",
  markRead: "m",
  markReadUp: "shift+m",
  star: "f",
  openOriginal: "v",
  escape: "escape",
} as const;

/** 作用域标记：未标 = 全局可用；`list` = 仅文章列表/详情内 */
export type ShortcutScope = "list";

export interface ShortcutRow {
  /** 展示用键帽（可含 ⇧ 等修饰符） */
  keys: string[];
  descKey: string;
  scope?: ShortcutScope;
}

export interface ShortcutGroup {
  titleKey: string;
  rows: ShortcutRow[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: "fusion.help.g_nav",
    rows: [
      { keys: ["j", "k"], descKey: "fusion.help.jk" },
      { keys: ["↑", "↓"], descKey: "fusion.help.arrows" },
      { keys: ["⏎", "o"], descKey: "fusion.help.open" },
      { keys: ["esc"], descKey: "fusion.help.esc" },
      { keys: ["⌘K", "/"], descKey: "fusion.help.palette" },
    ],
  },
  {
    titleKey: "fusion.help.g_mark",
    rows: [
      { keys: ["m"], descKey: "fusion.help.m", scope: "list" },
      { keys: ["⇧", "M"], descKey: "fusion.help.M", scope: "list" },
      { keys: ["f"], descKey: "fusion.help.f", scope: "list" },
    ],
  },
  {
    titleKey: "fusion.help.g_read",
    rows: [
      { keys: ["v"], descKey: "fusion.help.v", scope: "list" },
      { keys: ["space"], descKey: "fusion.help.space" },
    ],
  },
  {
    titleKey: "fusion.help.g_global",
    rows: [
      { keys: ["R"], descKey: "fusion.help.R" },
      { keys: ["c"], descKey: "fusion.help.c" },
      { keys: ["?"], descKey: "fusion.help.help" },
      { keys: ["⌘,"], descKey: "fusion.help.settings" },
    ],
  },
];
