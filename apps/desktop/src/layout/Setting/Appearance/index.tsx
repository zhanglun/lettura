import { useMemo, useRef, useState } from "react";
import { CustomizeStyle } from "@/layout/Setting/CustomizeStyle";
import { useBearStore } from "@/stores";
import clsx from "clsx";
import { Accent } from "./Accent";
import { ColorScheme } from "./ColorScheme";
import { useTranslation } from "react-i18next";
import { ProxySetting } from "../Proxy";
import { Shortcut } from "../ShortCut";

const PREVIEW_ARTICLE_TITLE = "Stray Birds";
const PREVIEW_ARTICLE_META = "Rabindranath Tagore · 1916";
const PREVIEW_PARAGRAPHS = [
  "Stray birds of summer come to my window to sing and fly away. And yellow leaves of autumn, which have no songs, flutter and fall there with a sign.",
  "夏天的飞鸟，飞到我的窗前唱歌，又飞去了。秋天的黄叶，它们没有什么可唱，只叹息一声，飞落在那里。",
  "O Troupe of little vagrants of the world, leave your footprints in my words.",
  "世界上的一队小小的漂泊者呀，请留下你们的足印在我的文字里。",
  "The world puts off its mask of vastness to its lover.It becomes small as one song, as one kiss of the eternal.",
  "世界对着它的爱人，把它浩翰的面具揭下了。它变小了，小如一首歌，小如一回永恒的接吻。",
  "It is the tears of the earth that keep here smiles in bloom.",
  "是大地的泪点，使她的微笑保持着青春不凋谢。",
  "The mighty desert is burning for the love of a blade of grass who shakes her head and laughs and flies away.",
  "无垠的沙漠热烈追求一叶绿草的爱，她摇摇头笑着飞开了。",
  "If you shed tears when you miss the sun, you also miss the stars.",
  "如果你因失去了太阳而流泪，那么你也将失去群星了。",
  "The sands in your way beg for your song and your movement, dancing water. Will you carry the burden of their lameness?",
  "跳舞着的流水呀，在你途中的泥沙，要求你的歌声，你的流动呢。你肯挟瘸足的泥沙而俱下么？",
  "Her wishful face haunts my dreams like the rain at night.",
  "她的热切的脸，如夜雨似的，搅扰着我的梦魂。",
  "Once we dream that we were strangers.We wake up to find that we were dear to each other.",
  "有一次，我们梦见大家都是不相识的。我们醒了，却知道我们原是相亲相爱的。",
  "Sorrow is hushed into peace in my heart like the evening among the silent trees.",
  "忧思在我的心里平静下去，正如暮色降临在寂静的山林中。",
];

type ReaderPreset = "compact" | "comfortable" | "immersive";

export const Appearance = () => {
  const { t } = useTranslation();
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));

  const [readerPreset, setReaderPreset] = useState<ReaderPreset>(
    () => (store.userConfig.reader_preset as ReaderPreset) ?? "comfortable",
  );
  const [cardDensity, setCardDensity] = useState<"comfortable" | "compact">(
    () =>
      (store.userConfig.card_density as "comfortable" | "compact") ??
      "comfortable",
  );

  const previewRef = useRef<HTMLDivElement>(null);

  const cfg = store.userConfig.customize_style;

  const fontSizePercent = useMemo(() => {
    if (!cfg?.font_size) return 50;
    return ((cfg.font_size - 14) / (25 - 14)) * 100;
  }, [cfg?.font_size]);

  const lineHeightPercent = useMemo(() => {
    if (!cfg?.line_height) return 50;
    return ((cfg.line_height - 1.4) / (2.1 - 1.4)) * 100;
  }, [cfg?.line_height]);

  const previewStyle = useMemo(
    () => ({
      fontSize: "var(--reading-p-font-size)",
      fontFamily: "var(--reading-editable-typeface)",
      lineHeight: "var(--reading-p-line-height)",
      maxWidth: "calc(var(--reading-editable-line-width) * 1px)",
    }),
    [store.userConfig],
  );

  const modeLabel = useMemo(() => {
    const scheme = store.userConfig.color_scheme;
    if (scheme === "dark") return t("Dark");
    if (scheme === "system") return t("Auto");
    return t("Light");
  }, [store.userConfig.color_scheme, t]);

  return (
    <div className="outline-none">
      <div className="settings-grid-wide">
        <div className="settings-panel">
          <div className="settings-panel-header">
            <div>
              <div className="settings-panel-title">{t("Appearance & Reading")}</div>
              <div className="settings-panel-desc">
                {t("Keep long reading sessions quiet, clear, and low-friction.")}
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-row">
              <div>
                <div className="settings-label">{t("Theme")}</div>
                <div className="settings-help">
                  {t("Choose light, dark, or follow system preference.")}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ColorScheme />
              </div>
              <span className="settings-tag settings-tag--blue">
                {modeLabel}
              </span>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">{t("Font size")}</div>
                <div className="settings-help">
                  {t("Adjust the reading font size.")}
                </div>
              </div>
              <CustomizeStyle styleConfig={cfg} className="!max-w-none flex-1 [&>div]:!border-0 [&>div]:!gap-0" />
              <span className="settings-tag settings-tag--accent">
                {cfg?.font_size ?? 18}px
              </span>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">{t("Line height")}</div>
                <div className="settings-help">
                  {t("Adjust the reading line height.")}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="settings-slider flex-1">
                  <div
                    className="fill"
                    style={{ width: `${lineHeightPercent}%` }}
                  />
                </div>
              </div>
              <span className="settings-tag settings-tag--accent">
                {cfg?.line_height ?? 1.6}
              </span>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">{t("Accent color")}</div>
                <div className="settings-help">
                  {t("Pick an accent color for the interface.")}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Accent />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label" style={{ marginBottom: 10 }}>
              {t("Reader preference")}
            </div>
            <div className="settings-choice-grid">
              <div
                className={clsx("settings-choice", {
                  active: readerPreset === "compact",
                })}
                onClick={() => {
                  setReaderPreset("compact");
                  store.updateUserConfig({ ...store.userConfig, reader_preset: "compact" });
                }}
              >
                <div className="settings-label">{t("Compact")}</div>
                <div className="settings-help">
                  {t("More content in less space.")}
                </div>
              </div>
              <div
                className={clsx("settings-choice", {
                  active: readerPreset === "comfortable",
                })}
                onClick={() => {
                  setReaderPreset("comfortable");
                  store.updateUserConfig({ ...store.userConfig, reader_preset: "comfortable" });
                }}
              >
                <div className="settings-label">{t("Comfortable")}</div>
                <div className="settings-help">
                  {t("Balanced readability and density.")}
                </div>
              </div>
              <div
                className={clsx("settings-choice", {
                  active: readerPreset === "immersive",
                })}
                onClick={() => {
                  setReaderPreset("immersive");
                  store.updateUserConfig({ ...store.userConfig, reader_preset: "immersive" });
                }}
              >
                <div className="settings-label">{t("Immersive")}</div>
                <div className="settings-help">
                  {t("Maximum focus, minimal clutter.")}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-row">
              <div>
                <div className="settings-label">{t("Card density")}</div>
                <div className="settings-help">
                  {t("Control the compactness of feed cards.")}
                </div>
              </div>
              <select
                className="settings-select"
                value={cardDensity}
                onChange={(e) => {
                  const val = e.target.value as "comfortable" | "compact";
                  setCardDensity(val);
                  store.updateUserConfig({ ...store.userConfig, card_density: val });
                }}
              >
                <option value="comfortable">{t("Comfortable")}</option>
                <option value="compact">{t("Compact")}</option>
              </select>
              <button className="btn-ghost" onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth" })}>{t("Preview")}</button>
            </div>
          </div>
        </div>

        <div className="settings-panel" ref={previewRef}>
          <div className="settings-panel-header">
            <div>
              <div className="settings-panel-title">{t("Reading preview")}</div>
              <div className="settings-help">
                {t("See how your settings affect the reading experience.")}
              </div>
            </div>
          </div>
          <div className="settings-section">
            <div className="settings-preview">
              <div
                className={clsx("settings-preview-article", "reading-content")}
                style={previewStyle}
              >
                <h2
                  style={{
                    fontSize: "1.25em",
                    fontWeight: 700,
                    marginBottom: 6,
                    lineHeight: 1.3,
                  }}
                >
                  {PREVIEW_ARTICLE_TITLE}
                </h2>
                <div
                  style={{
                    fontSize: "0.85em",
                    color: "var(--gray-9)",
                    marginBottom: 14,
                  }}
                >
                  {PREVIEW_ARTICLE_META}
                </div>
                {PREVIEW_PARAGRAPHS.map((p, i) => (
                  <p key={i} style={{ marginBottom: 8 }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <ProxySetting />
      </div>
      <div style={{ marginTop: 16 }}>
        <Shortcut />
      </div>
    </div>
  );
};
