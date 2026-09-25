import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { Search } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import { busChannel } from "@/helpers/busChannel";
import { LPodcast } from "@/components/LPodcast";
import { AddFeedChannel } from "@/components/AddFeed";
import { CommandPalette } from "./CommandPalette";
import { HelpOverlay } from "./HelpOverlay";

const FILTER_UNREAD = { id: 1, title: "Unread" };
const FILTER_READ = { id: 2, title: "Read" };

/** fusion 壳：暖灰画布 + 玻璃主面板 + 顶栏导航 + ⌘K（Rail/Sidebar 退役） */
export const AppLayout = React.memo(function () {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const store = useBearStore(
    useShallow((state) => ({
      collectionMeta: state.collectionMeta,
      currentFilter: state.currentFilter,
      setFilter: state.setFilter,
      getSubscribes: state.getSubscribes,
      initCollectionMetas: state.initCollectionMetas,
      subscribes: state.subscribes,
      tracks: state.tracks,
      podcastPlayingStatus: state.podcastPlayingStatus,
      updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
      syncAllArticles: state.syncAllArticles,
      addFeedModalOpen: state.addFeedModalOpen,
      setAddFeedModalOpen: state.setAddFeedModalOpen,
      playerMode: state.playerMode,
      setPlayerMode: state.setPlayerMode,
    })),
  );

  // Sidebar 退役后，订阅与全局未读数初始化移到壳层
  useEffect(() => {
    store.getSubscribes();
    store.initCollectionMetas();
    const unsub = busChannel.on("getChannels", () => store.getSubscribes());
    return () => {
      unsub();
    };
  }, []);

  const isAll = location.pathname === RouteConfig.LOCAL_ALL;
  const isStarred = location.pathname.startsWith("/local/starred");
  const isFeeds = location.pathname.startsWith("/local/feeds");
  const isFeedsBrowse = location.pathname === RouteConfig.LOCAL_FEEDS;
  const isUnreadActive = isAll && store.currentFilter.id === 1;
  const isHistoryActive = isAll && store.currentFilter.id === 2;

  const navItems = [
    {
      key: "unread",
      label: t("fusion.nav.unread"),
      active: isUnreadActive,
      onClick: () => {
        navigate(RouteConfig.LOCAL_ALL);
        store.setFilter(FILTER_UNREAD);
      },
    },
    {
      key: "starred",
      label: t("fusion.nav.starred"),
      active: isStarred,
      onClick: () => navigate(RouteConfig.LOCAL_STARRED),
    },
    {
      key: "history",
      label: t("fusion.nav.history"),
      active: isHistoryActive,
      onClick: () => {
        navigate(RouteConfig.LOCAL_ALL);
        store.setFilter(FILTER_READ);
      },
    },
    {
      key: "subscriptions",
      label: t("fusion.nav.subscriptions"),
      active: isFeeds,
      onClick: () => navigate(RouteConfig.LOCAL_FEEDS),
    },
  ];

  const sourceCount = (store.subscribes || []).reduce<number>(
    (sum, item) =>
      sum + (item.item_type === "folder" ? item.children?.length ?? 0 : 1),
    0,
  );

  const unreadCount = store.collectionMeta.total.unread;
  // 顶栏药丸：浏览帧 = 源数，其余 = 全局未读（产品级徽章，常驻）
  const pillCount = isFeedsBrowse ? sourceCount : unreadCount;
  const playerVisible = store.tracks?.length > 0 || store.podcastPlayingStatus;

  useHotkeys("meta+k, ctrl+k", (e) => {
    e.preventDefault();
    setPaletteOpen((v) => !v);
  });
  useHotkeys("/", (e) => {
    e.preventDefault();
    setPaletteOpen(true);
  });
  useHotkeys("shift+/", () => {
    setHelpOpen((v) => !v);
    setPaletteOpen(false);
  });
  useHotkeys("meta+comma, ctrl+comma", () => {
    navigate(RouteConfig.SETTINGS);
  });
  useHotkeys("shift+r", () => store.syncAllArticles());
  // esc 逐级退回：悬浮层优先（Radix / 帮助在捕获阶段已 preventDefault 的那次 esc 不再收回播放器）
  useHotkeys(
    "escape",
    (e) => {
      if (e.defaultPrevented) return;
      if (store.playerMode === "full") {
        store.setPlayerMode("bar");
      }
    },
    [store],
  );
  useHotkeys("space", (e) => {
    if (!store.tracks?.length) return;
    e.preventDefault();
    store.updatePodcastPlayingStatus(!store.podcastPlayingStatus);
  });

  return (
    <div className="fusion-root">
      <section className="fusion-panel">
        <header className="fusion-top" data-tauri-drag-region="">
          <span className="fusion-logo" aria-hidden="true">
            <i />
          </span>
          {/* 产品名常驻左上；当前位置由导航高亮表达 */}
          <span className="fusion-sec">Lettura</span>
          {pillCount > 0 && <span className="fusion-cnt">{pillCount}</span>}
          <nav className="fusion-nav">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.key}
                className={item.active ? "on" : ""}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <span className="fusion-spring" data-tauri-drag-region="" />
          <button
            type="button"
            className="fusion-cmdbtn"
            onClick={() => setPaletteOpen(true)}
          >
            <Search size={12} />
            {t("fusion.search.placeholder")}
            <span className="fusion-spring" />
            <kbd>⌘K</kbd>
          </button>
        </header>
        {/* 播放卡浮在内容上：内容区不占位，只把「让位空白」的高度交给内层滚动容器（--fusion-player-inset） */}
        <div
          className="flex min-h-0 flex-1 flex-col"
          style={
            {
              "--fusion-player-inset": playerVisible && store.playerMode === "bar" ? "102px" : "0px",
            } as React.CSSProperties
          }
        >
          <Outlet />
        </div>
      </section>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <LPodcast visible={playerVisible} />
      <AddFeedChannel
        open={store.addFeedModalOpen}
        onOpenChange={store.setAddFeedModalOpen}
      >
        <span className="hidden" />
      </AddFeedChannel>
    </div>
  );
});
