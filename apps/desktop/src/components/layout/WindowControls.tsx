import { IconButton } from "@astryxdesign/core/IconButton";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Copy, Minus, Square, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * 自绘窗口控制（Windows/Linux）：decorations:false 后原生标题栏不存在，
 * 三钮直调 webviewWindow API。关闭事件由 Rust CloseRequested 接管
 * （release 隐藏到托盘，dev 直接退出）。macOS 走 titleBarStyle Overlay
 * 的原生红绿灯，本组件不渲染。
 */
export const WindowControls: React.FC = () => {
  const { t } = useTranslation();
  const [maximized, setMaximized] = useState(false);
  // 平台判定（运行期内不变）：读 navigator 而非模块常量，测试可覆盖
  const isMac = /Mac/i.test(navigator.platform || navigator.userAgent || "");

  // 最大化/还原图标跟随窗口真实状态：初始查询 + resize 事件跟随
  useEffect(() => {
    if (isMac) return;
    const win = getCurrentWebviewWindow();
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    win
      .isMaximized()
      .then((value) => {
        if (!cancelled) setMaximized(value);
      })
      .catch(() => {});
    win
      .onResized(() => {
        void win
          .isMaximized()
          .then((value) => {
            if (!cancelled) setMaximized(value);
          })
          .catch(() => {});
      })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [isMac]);

  if (isMac) return null;

  return (
    <div className="fusion-winctl">
      <IconButton
        size="sm"
        variant="ghost"
        icon={<Minus size={13} />}
        label={t("Minimize")}
        onClick={() => void getCurrentWebviewWindow().minimize()}
      />
      <IconButton
        size="sm"
        variant="ghost"
        icon={maximized ? <Copy size={11} /> : <Square size={11} />}
        label={maximized ? t("Restore") : t("Maximize")}
        onClick={() => void getCurrentWebviewWindow().toggleMaximize()}
      />
      <IconButton
        size="sm"
        variant="ghost"
        className="win-close"
        icon={<X size={13} />}
        label={t("Close")}
        onClick={() => void getCurrentWebviewWindow().close()}
      />
    </div>
  );
};
