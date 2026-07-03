import { useRef, useState } from "react";
import { useBearStore } from "@/stores";
import clsx from "clsx";
import { Accent } from "./Accent";
import { useTranslation } from "react-i18next";
import { Check, Moon, Sun, SunMoon } from "lucide-react";

const PREVIEW_ARTICLE_TITLE = "Stray Birds";
const PREVIEW_ARTICLE_META = "Rabindranath Tagore · 1916";
const PREVIEW_PARAGRAPHS = [
  "Stray birds of summer come to my window to sing and fly away. And yellow leaves of autumn, which have no songs, flutter and fall there with a sign.",
  "夏天的飞鸟，飞到我的窗前唱歌，又飞去了。秋天的黄叶，它们没有什么可唱，只叹息一声，飞落在那里。",
  "O Troupe of little vagrants of the world, leave your footprints in my words.",
];

type ReaderPreset = "compact" | "comfortable" | "immersive";
type ColorSchemeValue = "light" | "dark" | "system";

const THEME_OPTIONS: Array<{
  value: ColorSchemeValue;
  label: string;
  help: string;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    label: "Light",
    help: "Best for daytime and bright environments.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    help: "Comfortable reading in low light.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Auto",
    help: "Follow the system appearance.",
    icon: SunMoon,
  },
];

const PRESET_OPTIONS: Array<{
  value: ReaderPreset;
  label: string;
  help: string;
  tag: string;
  tagClass: string;
}> = [
  {
    value: "compact",
    label: "Compact",
    help: "More content in less space.",
    tag: "List first",
    tagClass: "settings-tag--blue",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    help: "Balanced readability and density.",
    tag: "Current",
    tagClass: "settings-tag--green",
  },
  {
    value: "immersive",
    label: "Immersive",
    help: "Maximum focus, minimal clutter.",
    tag: "Long read",
    tagClass: "settings-tag--amber",
  },
];

const DEFAULT_STYLE = {
  typeface: "",
  font_size: 18,
  line_height: 1.6,
  line_width: 648,
};

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

  const cfg = {
    ...DEFAULT_STYLE,
    ...(store.userConfig.customize_style ?? {}),
  };

  function updateColorScheme(value: ColorSchemeValue) {
    store.updateUserConfig({
      ...store.userConfig,
      color_scheme: value,
    });

    let mode = value || "light";
    if (value === "system") {
      mode = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    if (mode === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }

  function updateCustomizeStyle(key: keyof CustomizeStyle, value: number | string) {
    const nextStyle = {
      ...cfg,
      [key]: value,
    };

    store.updateUserConfig({
      ...store.userConfig,
      customize_style: nextStyle,
    });

    document.documentElement.style.setProperty(
      `--reading-editable-${key.replace(/_/gi, "-")}`,
      String(value),
    );
  }

  const lineHeightPercent = cfg?.line_height
    ? ((cfg.line_height - 1.4) / (2.1 - 1.4)) * 100
    : 50;

  const previewStyle = {
    fontSize: "var(--reading-p-font-size)",
    fontFamily: "var(--reading-editable-typeface)",
    lineHeight: "var(--reading-p-line-height)",
    maxWidth: "calc(var(--reading-editable-line-width) * 1px)",
  };

  const scheme = store.userConfig.color_scheme;
  const modeLabel = scheme === "dark" ? t("Dark") : scheme === "system" ? t("Auto") : t("Light");

  return (
    <div className="settings-appearance-layout">
      <div className="settings-grid-wide">
        <div className="settings-panel">
          <div className="settings-section">
            <div className="settings-label mb-3">{t("Theme mode")}</div>
            <div className="settings-appearance-theme-grid">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = scheme === option.value;

                return (
                  <button
                    type="button"
                    className={clsx("settings-appearance-theme-card", {
                      active,
                      dark: option.value === "dark",
                      system: option.value === "system",
                    })}
                    onClick={() => updateColorScheme(option.value)}
                    key={option.value}
                  >
                    <div className="settings-appearance-theme-swatch">
                      <Icon size={18} />
                      {active ? <Check size={14} className="settings-appearance-check" /> : null}
                    </div>
                    <div className="settings-label">{t(option.label)}</div>
                    <div className="settings-help">{t(option.help)}</div>
                  </button>
                );
              })}
            </div>
            <span className="settings-tag settings-tag--blue mt-3">{modeLabel}</span>
          </div>

          <div className="settings-section">
            <div className="settings-label mb-3">{t("Accent color")}</div>
            <div className="settings-help mb-3">{t("Pick an accent color for the interface.")}</div>
            <Accent />
          </div>
        </div>

        <div className="settings-panel">
          <div className="settings-section">
            <div className="settings-label mb-3">{t("Reader preference")}</div>
            <div className="settings-mini-list">
              {PRESET_OPTIONS.map((option) => {
                const active = readerPreset === option.value;

                return (
                  <button
                    type="button"
                    className={clsx("settings-mini-row", { active })}
                    onClick={() => {
                      setReaderPreset(option.value);
                      store.updateUserConfig({ ...store.userConfig, reader_preset: option.value });
                    }}
                    key={option.value}
                  >
                    <div>
                      <div className="settings-label">{t(option.label)}</div>
                      <div className="settings-help">{t(option.help)}</div>
                    </div>
                    <span className={clsx("settings-tag", active ? "settings-tag--green" : option.tagClass)}>
                      {active ? t("Current") : t(option.tag)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-panel">
        <div className="settings-section">
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Font size")}</div>
              <div className="settings-help">{t("Adjust the reading font size.")}</div>
            </div>
            <div className="settings-stepper">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => updateCustomizeStyle("font_size", Math.max(14, cfg.font_size - 1))}
              >
                A-
              </button>
              <span className="settings-tag settings-tag--blue">{cfg.font_size}px</span>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => updateCustomizeStyle("font_size", Math.min(25, cfg.font_size + 1))}
              >
                A+
              </button>
            </div>
            <div />
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Line height")}</div>
              <div className="settings-help">{t("Adjust the reading line height.")}</div>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <div className="settings-slider flex-1" aria-hidden="true">
                <div className="fill" style={{ width: `${lineHeightPercent}%` }} />
              </div>
              <input
                aria-label={t("Line height")}
                className="settings-range-overlay"
                type="range"
                min={1.4}
                max={2.1}
                step={0.1}
                value={cfg.line_height}
                onChange={(event) =>
                  updateCustomizeStyle("line_height", Number(event.target.value))
                }
              />
            </div>
            <span className="settings-tag settings-tag--blue">{cfg.line_height}</span>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("Card density")}</div>
              <div className="settings-help">{t("Control the compactness of feed cards.")}</div>
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
            <button
              className="btn-ghost"
              type="button"
              onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("Preview")}
            </button>
          </div>
        </div>
      </div>

      <div className="settings-panel" ref={previewRef}>
        <div className="settings-section">
          <div className="settings-label mb-3">{t("Reading preview")}</div>
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
  );
};
