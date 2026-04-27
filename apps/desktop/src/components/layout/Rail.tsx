import { useTranslation } from "react-i18next";
import { Sun, Layers, Rss, Search, Star, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";
import { RailItem } from "./RailItem";

export function Rail() {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      updateSettingDialogStatus: state.updateSettingDialogStatus,
    })),
  );

  return (
    <div className="flex flex-col items-center h-full py-3 bg-gray-1 w-12 shrink-0">
      <div className="flex items-center justify-center w-10 h-10 mb-4 text-accent-9 font-bold text-lg">
        L
      </div>

      <div className="flex flex-col items-center space-y-1 flex-1">
        <RailItem
          icon={Sun}
          label={t("nav.today")}
          to={RouteConfig.LOCAL_TODAY}
        />
        <RailItem
          icon={Layers}
          label={t("nav.topics")}
          to={RouteConfig.LOCAL_TOPICS}
        />
        <RailItem
          icon={Rss}
          label={t("nav.feeds")}
          to={RouteConfig.LOCAL_ALL}
        />
        <RailItem
          icon={Search}
          label={t("nav.search")}
          to={RouteConfig.SEARCH}
        />
        <RailItem
          icon={Star}
          label={t("nav.starred")}
          to={RouteConfig.LOCAL_STARRED}
        />
        <RailItem
          icon={Settings}
          label={t("nav.settings")}
          onClick={() => store.updateSettingDialogStatus(true)}
        />
      </div>
    </div>
  );
}
