import { Appearance } from "./Appearance";
import { AIConfigPanel } from "./AIConfig";
import { Sources } from "./Sources";
import { Behavior } from "./Behavior";
import { SettingTabKey } from "@/typing";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { RouteConfig } from "@/config";

import "./index.css";

const TABS: { key: SettingTabKey; labelKey: string }[] = [
  { key: SettingTabKey.AI,         labelKey: "settings.tab.ai_title" },
  { key: SettingTabKey.SOURCES,    labelKey: "settings.tab.sources_title" },
  { key: SettingTabKey.APPEARANCE, labelKey: "settings.tab.appearance_title" },
  { key: SettingTabKey.BEHAVIOR,   labelKey: "settings.tab.behavior_title" },
];

export function SettingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useLocation().search;
  const tabParam = new URLSearchParams(search).get("tab");
  const effectiveTab =
    tabParam === "sources"    ? SettingTabKey.SOURCES
    : tabParam === "appearance" ? SettingTabKey.APPEARANCE
    : tabParam === "behavior"   ? SettingTabKey.BEHAVIOR
    : SettingTabKey.AI;

  const handleTabChange = (key: SettingTabKey) => {
    navigate(`${RouteConfig.SETTINGS}?tab=${key}`, { replace: true });
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Fixed header with title + underline tab bar */}
      <div className="flex-shrink-0 px-8 pt-6 pb-0 border-b border-[var(--gray-4)] bg-[var(--gray-1)]">
        <h1 className="text-[20px] font-bold text-[var(--gray-12)] leading-tight">
          {t("Settings")}
        </h1>
        <p className="text-[13px] text-[var(--gray-9)] mt-1 mb-0">
          {t("settings.subtitle")}
        </p>
        {/* Underline tab bar */}
        <div className="flex mt-3.5 gap-0">
          {TABS.map(({ key, labelKey }) => {
            const active = effectiveTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={clsx(
                  "px-4 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap",
                  active
                    ? "border-[var(--accent-9)] text-[var(--accent-11)] font-medium"
                    : "border-transparent text-[var(--gray-9)] hover:text-[var(--gray-12)]",
                )}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto px-8 py-7">
        <div className="max-w-[860px]">
          {effectiveTab === SettingTabKey.AI         && <AIConfigPanel />}
          {effectiveTab === SettingTabKey.SOURCES     && <Sources />}
          {effectiveTab === SettingTabKey.APPEARANCE  && <Appearance />}
          {effectiveTab === SettingTabKey.BEHAVIOR    && <Behavior />}
        </div>
      </div>
    </div>
  );
}
