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

  const renderItem = (item: RailItem) => {
    const active = isActive(item);

    return (
      <button
        key={item.labelKey}
        type="button"
        aria-label={item.labelKey}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border-0 p-0 transition-all duration-150",
          active
            ? "bg-[var(--accent-9)] text-white shadow-sm hover:bg-[var(--accent-10)] hover:text-white"
            : "bg-transparent text-[var(--gray-9)] hover:bg-[var(--gray-a3)] hover:text-[var(--gray-11)]",
        )}
        onClick={() => handleClick(item)}
      >
        {item.icon}
        <span className="pointer-events-none absolute left-12 z-[100] hidden whitespace-nowrap rounded bg-[var(--gray-12)] px-2 py-1 text-xs font-normal leading-4 text-white shadow-sm group-hover:block">
          {item.labelKey}
        </span>
      </button>
    );
  };

  return (
    <div className="flex h-full w-[52px] shrink-0 select-none flex-col items-center gap-1 border-r border-[var(--gray-5)] bg-[var(--gray-3)] py-3">
      {items.map(renderItem)}
      <div className="flex-1" />
      {renderItem(settingsItem)}
    </div>
  );
});
