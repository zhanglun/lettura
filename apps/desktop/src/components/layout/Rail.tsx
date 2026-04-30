import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Layers,
  Rss,
  Search,
  Star,
  Settings,
} from "lucide-react";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import clsx from "clsx";

interface RailItem {
  icon: React.ReactNode;
  labelKey: string;
  route?: string;
  action?: () => void;
  matchPaths: string[];
}

export const Rail = React.memo(function () {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      updateSettingDialogStatus: state.updateSettingDialogStatus,
    })),
  );

  const items: RailItem[] = [
    {
      icon: <Sparkles size={18} />,
      labelKey: t("layout.rail.today"),
      route: RouteConfig.LOCAL_TODAY,
      matchPaths: [RouteConfig.LOCAL_TODAY],
    },
    {
      icon: <Layers size={18} />,
      labelKey: t("layout.rail.topics"),
      route: RouteConfig.LOCAL_TOPICS,
      matchPaths: [RouteConfig.LOCAL_TOPICS],
    },
    {
      icon: <Rss size={18} />,
      labelKey: t("layout.rail.feeds"),
      route: RouteConfig.LOCAL_ALL,
      matchPaths: [
        RouteConfig.LOCAL_ALL,
        RouteConfig.LOCAL_FEED,
        RouteConfig.LOCAL_ARTICLE,
      ],
    },
    {
      icon: <Search size={18} />,
      labelKey: t("layout.rail.search"),
      route: RouteConfig.SEARCH,
      matchPaths: [RouteConfig.SEARCH],
    },
    {
      icon: <Star size={18} />,
      labelKey: t("layout.rail.starred"),
      route: RouteConfig.LOCAL_STARRED,
      matchPaths: [RouteConfig.LOCAL_STARRED],
    },
  ];

  const settingsItem: RailItem = {
    icon: <Settings size={18} />,
    labelKey: t("layout.rail.settings"),
    action: () => store.updateSettingDialogStatus(true),
    matchPaths: [],
  };

  const isActive = (item: RailItem) => {
    return item.matchPaths.some((p) => {
      if (p.includes(":uuid") || p.includes(":id")) {
        const pattern = p
          .replace(":uuid", "[^/]+")
          .replace(":id", "[^/]+");
        return new RegExp(`^${pattern}$`).test(location.pathname);
      }
      return location.pathname === p;
    });
  };

  const handleClick = (item: RailItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigate(item.route);
    }
  };

  return (
    <div className="flex flex-col items-center w-[48px] h-full py-2 bg-[var(--gray-1)] border-r border-[var(--gray-4)] select-none shrink-0">
      <div className="flex flex-col items-center gap-1 flex-1">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Tooltip key={item.labelKey} content={item.labelKey} side="right">
              <IconButton
                variant="ghost"
                size="2"
                className={clsx(
                  "w-9 h-9 rounded-lg transition-colors",
                  active
                    ? "bg-[var(--accent-9)] text-white hover:bg-[var(--accent-10)] hover:text-white"
                    : "text-[var(--gray-9)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)]",
                )}
                onClick={() => handleClick(item)}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          );
        })}
      </div>
      <Tooltip content={settingsItem.labelKey} side="right">
        <IconButton
          variant="ghost"
          size="2"
          className="w-9 h-9 rounded-lg text-[var(--gray-9)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)] transition-colors"
          onClick={() => handleClick(settingsItem)}
        >
          {settingsItem.icon}
        </IconButton>
      </Tooltip>
    </div>
  );
});
