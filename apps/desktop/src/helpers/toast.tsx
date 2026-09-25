import { createRoot } from "react-dom/client";
import type React from "react";
import { Toast } from "@astryxdesign/core/Toast";
import type { ToastType } from "@astryxdesign/core/Toast";

/**
 * 组件外命令式 toast（替代 sonner）。Astryx Toast 可独立渲染，
 * 这里为每条 toast 建一个 root，自动隐藏后卸载；fixed 定位到右上角堆叠。
 */
function show(body: React.ReactNode, type: ToastType = "info") {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: "9999",
  } as CSSStyleDeclaration);
  document.body.appendChild(el);

  const root = createRoot(el);
  const remove = () => {
    root.unmount();
    el.remove();
  };
  root.render(
    <Toast
      type={type}
      body={body}
      isAutoHide
      autoHideDuration={4000}
      onDismiss={remove}
    />,
  );
}

export const toast: {
  success: (body: React.ReactNode) => void;
  error: (body: React.ReactNode) => void;
  message: (body: React.ReactNode) => void;
} = {
  success: (b) => show(b),
  error: (b) => show(b, "error"),
  message: (b) => show(b),
};

/** 组件内 hook（直接复用 Astryx useToast） */
export { useToast } from "@astryxdesign/core/Toast";
