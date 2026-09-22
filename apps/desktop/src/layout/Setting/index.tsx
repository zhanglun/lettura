import { Appearance } from "./Appearance";
import { Sources } from "./Sources";
import { Subscriptions } from "./Subscriptions";
import { Behavior } from "./Behavior";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import "./index.css";

/** 一页极简设置：tab=subscriptions 为订阅管理，其余（外观/同步/OPML/数据）合为一页 */
export function SettingPage() {
  const { t } = useTranslation();
  const search = useLocation().search;
  const isSubscriptions =
    new URLSearchParams(search).get("tab") === "subscriptions";

  if (isSubscriptions) {
    return (
      <div className="flex-1 h-full overflow-auto px-8 py-7">
        <Subscriptions />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-auto">
      <div className="max-w-[960px] mx-auto px-8 py-7 flex flex-col gap-10">
        <header>
          <h1 className="text-[20px] font-bold text-[var(--gray-12)] leading-tight">
            {t("Settings")}
          </h1>
          <p className="text-[13px] text-[var(--gray-9)] mt-1">
            {t("settings.subtitle")}
          </p>
        </header>

        <section>
          <h2 className="settings-section-h">{t("Appearance & Reading")}</h2>
          <Appearance />
        </section>

        <section>
          <h2 className="settings-section-h">{t("settings.sync_sources")}</h2>
          <Sources />
        </section>

        <section>
          <h2 className="settings-section-h">{t("settings.tab.behavior_title")}</h2>
          <Behavior />
        </section>
      </div>
    </div>
  );
}
