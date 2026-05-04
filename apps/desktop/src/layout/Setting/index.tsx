import {
  Cog,
  Palette,
  Sparkles,
  Rss,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Appearance } from "./Appearance";
import { AIConfigPanel } from "./AIConfig";
import { Sources } from "./Sources";
import { Behavior } from "./Behavior";
import { useState } from "react";
import { SettingTabKey } from "@/typing";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import "./index.css";

const TAB_META: { key: SettingTabKey; Icon: typeof Sparkles; titleKey: string; descKey: string }[] = [
  {
    key: SettingTabKey.AI,
    Icon: Sparkles,
    titleKey: "settings.tab.ai_title",
    descKey: "settings.tab.ai_desc",
  },
  {
    key: SettingTabKey.SOURCES,
    Icon: Rss,
    titleKey: "settings.tab.sources_title",
    descKey: "settings.tab.sources_desc",
  },
  {
    key: SettingTabKey.APPEARANCE,
    Icon: Palette,
    titleKey: "settings.tab.appearance_title",
    descKey: "settings.tab.appearance_desc",
  },
  {
    key: SettingTabKey.BEHAVIOR,
    Icon: Cog,
    titleKey: "settings.tab.behavior_title",
    descKey: "settings.tab.behavior_desc",
  },
];

export function SettingPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingTabKey>(SettingTabKey.AI);

  const search = useLocation().search;
  const tabParam = new URLSearchParams(search).get("tab");
  const effectiveTab = tabParam === "sources" ? SettingTabKey.SOURCES
    : tabParam === "appearance" ? SettingTabKey.APPEARANCE
    : tabParam === "behavior" ? SettingTabKey.BEHAVIOR
    : activeTab;

  return (
    <div className="flex-1 h-full overflow-auto">
      <div className="max-w-[1180px] mx-auto px-7 pt-6 pb-8">
        <div className="flex items-start justify-between gap-4 mb-0">
          <div>
            <h1 className="text-xl font-bold text-[var(--gray-12)]">
              {t("Settings")}
            </h1>
            <p className="text-[13px] text-[var(--gray-9)] mt-1">
              {t("settings.subtitle")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--green-3)] text-[var(--green-11)]">
              <ShieldCheck size={12} />
              {t("settings.status_secure")}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-3)] text-[var(--accent-11)]">
              <Rss size={12} />
              {t("settings.status_sources")}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--blue-3)] text-[var(--blue-11)]">
              <Zap size={12} />
              {t("settings.status_analysis")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 my-5">
          {TAB_META.map(({ key, Icon, titleKey, descKey }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                "flex items-center gap-2.5 min-h-[58px] p-3 border rounded-[10px] text-left transition-all",
                effectiveTab === key
                  ? "border-[var(--accent-8)] bg-[var(--accent-2)] shadow-sm"
                  : "border-[var(--gray-6)] bg-[var(--gray-1)] hover:border-[var(--gray-7)] hover:bg-[var(--gray-a3)]",
              )}
            >
              <span
                className={clsx(
                  "w-[30px] h-[30px] rounded-[6px] flex items-center justify-center shrink-0",
                  effectiveTab === key
                    ? "bg-[var(--accent-9)] text-white"
                    : "bg-[var(--gray-3)] text-[var(--gray-9)]",
                )}
              >
                <Icon size={14} />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-[var(--gray-12)]">
                  {t(titleKey)}
                </span>
                <span className="block text-[11px] text-[var(--gray-9)] mt-0.5 leading-snug">
                  {t(descKey)}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div>
          {effectiveTab === SettingTabKey.AI && <AIConfigPanel />}
          {effectiveTab === SettingTabKey.SOURCES && <Sources />}
          {effectiveTab === SettingTabKey.APPEARANCE && <Appearance />}
          {effectiveTab === SettingTabKey.BEHAVIOR && <Behavior />}
        </div>
      </div>
    </div>
  );
}
