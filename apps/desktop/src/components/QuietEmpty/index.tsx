import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * 静默空态（quiet empty）：列表 / 浮层面板内的小幅空态。
 * 与 EmptyFace（全视图，empty.html 契约）同一语言——发丝线几何 + 排版层级 +
 * 克制中性色，不画插画；glyph 用 lucide 统一线重，动作只给真正的下一步。
 */
export function QuietEmpty({
  icon: Icon,
  title,
  hint,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  /** 浮层内用（⌘K 面板）：更小的间距与字号 */
  compact?: boolean;
}) {
  return (
    <div className={`fusion-empty ${compact ? "compact" : ""}`}>
      <span className="fusion-empty-glyph">
        <Icon size={compact ? 14 : 16} strokeWidth={1.25} />
      </span>
      <p className="fusion-empty-t">{title}</p>
      {hint && <p className="fusion-empty-h">{hint}</p>}
      {action && <div className="fusion-empty-a">{action}</div>}
    </div>
  );
}
