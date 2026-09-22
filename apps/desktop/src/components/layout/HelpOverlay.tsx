import { useEffect } from "react";
import { useTranslation } from "react-i18next";

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

  const col1 = [
    {
      title: t("fusion.help.g_nav"),
      rows: [
        { keys: ["j", "k"], desc: t("fusion.help.jk") },
        { keys: ["⏎", "o"], desc: t("fusion.help.open") },
        { keys: ["esc"], desc: t("fusion.help.esc") },
        { keys: ["⌘K", "/"], desc: t("fusion.help.palette") },
      ],
    },
    {
      title: t("fusion.help.g_mark"),
      rows: [
        { keys: ["m"], desc: t("fusion.help.m") },
        { keys: ["M"], desc: t("fusion.help.M") },
        { keys: ["f"], desc: t("fusion.help.f") },
      ],
    },
  ];
  const col2 = [
    {
      title: t("fusion.help.g_read"),
      rows: [
        { keys: ["v"], desc: t("fusion.help.v") },
        { keys: ["space"], desc: t("fusion.help.space") },
      ],
    },
    {
      title: t("fusion.help.g_global"),
      rows: [
        { keys: ["R"], desc: t("fusion.help.R") },
        { keys: ["c"], desc: t("fusion.help.c") },
        { keys: ["?"], desc: t("fusion.help.help") },
        { keys: ["⌘,"], desc: t("fusion.help.settings") },
      ],
    },
  ];

  const renderCol = (groups: typeof col1) => (
    <div className="fusion-help-grp">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="fusion-help-gh">{g.title}</div>
          {g.rows.map((r) => (
            <div className="fusion-krow" key={r.keys.join()}>
              <span className="keys">
                {r.keys.map((k) => (
                  <kbd key={k} className="fusion-kbd">{k}</kbd>
                ))}
              </span>
              <span className="desc">{r.desc}</span>
            </div>
          ))}
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
          <kbd className="fusion-kbd">esc</kbd>
        </div>
        <div className="fusion-help-cols">
          {renderCol(col1)}
          {renderCol(col2)}
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
