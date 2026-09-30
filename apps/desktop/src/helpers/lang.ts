/** 界面语言的唯一读取口（lang localStorage → navigator 兜底）。
 *  写入方只有 Setting 的语言切换；i18n 初始化与纯工具模块（如 feedMeta
 *  的相对时间文案）都从这里取，避免 key 名和兜底逻辑各写一份。 */
export function getSavedLang(): string {
  return window.localStorage.getItem("lang") || navigator.language || "en";
}
