import { useEffect } from "react";
import { Kbd } from "@astryxdesign/core/Kbd";
import { useTranslation } from "react-i18next";
import { SHORTCUT_GROUPS } from "@/shortcuts";

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

/** ? 键帮助：⌘K 姊妹浮层，双列键位卡（fusion/help.html 契约） */
export function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const renderGroup = (g: (typeof SHORTCUT_GROUPS)[number]) => (
    <div key={g.titleKey}>
      <div className="fusion-help-gh">{t(g.titleKey)}</div>
      {g.rows.map((r) => (
        <div className="fusion-krow" key={r.descKey}>
          <span className="keys">
            {r.keys.map((k) => (
              <Kbd key={k} keys={k} />
            ))}
          </span>
          <span className="desc">{t(r.descKey)}</span>
          {r.scope === "list" && (
            <span className="fusion-krow-scope">{t("fusion.help.scope_list")}</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="fusion-veil" onClick={onClose} />
      <section className="fusion-float fusion-help" role="dialog" aria-label={t("fusion.help.title")}>
        <div className="fusion-help-in">
          <span className="tt">{t("fusion.help.title")}</span>
          <span className="sub">{t("fusion.help.desc")}</span>
          <Kbd keys="esc" />
        </div>
        <div className="fusion-help-cols">
          <div className="fusion-help-grp">{SHORTCUT_GROUPS.slice(0, 2).map(renderGroup)}</div>
          <div className="fusion-help-grp">{SHORTCUT_GROUPS.slice(2).map(renderGroup)}</div>
        </div>
        <div className="fusion-float-foot">
          <span>{t("fusion.help.foot_close")}</span>
          <span className="fusion-spring" />
          <span>{t("fusion.help.foot_mouse")}</span>
        </div>
      </section>
    </>
  );
}
