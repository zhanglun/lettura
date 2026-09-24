/**
 * 强调色单源（DESIGN.md 契约）：五色板，soft/line/阴影全部由
 * fusion.css 的 color-mix 从 --fusion-accent 派生；这里只写两个种子变量：
 * 亮色 --fusion-accent-hex（缺省回落 #5E6AD2）与夜读本提亮
 * --fusion-accent-dark-hex（缺省回落 #848CE8）。indigo = 未自定义，
 * 两个变量都不设，令牌层用契约缺省值。
 */

export interface AccentOption {
  key: string;
  hex: string;
}

export const ACCENTS: AccentOption[] = [
  { key: "indigo", hex: "#5E6AD2" },
  { key: "moss", hex: "#3E8E6D" },
  { key: "ochre", hex: "#B06A3B" },
  { key: "brick", hex: "#C4564A" },
  { key: "vine", hex: "#8A6BB8" },
];

/** 与白混合提亮（夜读本变体），t ∈ [0,1] */
export function lightenHex(hex: string, t: number): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (shift: number) => {
    const c = (n >> shift) & 0xff;
    return Math.round(c + (255 - c) * t);
  };
  const to2 = (v: number) => v.toString(16).padStart(2, "0");
  return `#${to2(mix(16))}${to2(mix(8))}${to2(mix(0))}`;
}

/** 应用强调色：indigo/缺省 = 清除种子变量回到契约缺省值 */
export function applyAccent(key?: string | null) {
  const root = document.documentElement;
  if (!key || key === "indigo") {
    root.style.removeProperty("--fusion-accent-hex");
    root.style.removeProperty("--fusion-accent-dark-hex");
    return;
  }
  const hex = ACCENTS.find((a) => a.key === key)?.hex;
  if (!hex) return;
  root.style.setProperty("--fusion-accent-hex", hex);
  root.style.setProperty("--fusion-accent-dark-hex", lightenHex(hex, 0.28));
}
