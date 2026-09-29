import { Button } from "@astryxdesign/core/Button";
import { Kbd } from "@astryxdesign/core/Kbd";
import { CircleHelp, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { AddFeedChannel } from "@/components/AddFeed";
import { LPodcast } from "@/components/LPodcast";
import { seekSharedAudioBy } from "@/components/LPodcast/useAudioPlayer";
import { RouteConfig } from "@/config";
import { busChannel } from "@/helpers/busChannel";
import { recordNav } from "@/helpers/navHistory";
import { HK } from "@/shortcuts";
import { useBearStore } from "@/stores";
import { CommandPalette } from "./CommandPalette";
import { HelpOverlay } from "./HelpOverlay";

const FILTER_UNREAD = { id: 1, title: "Unread" };
const FILTER_READ = { id: 2, title: "Read" };

/** fusion 壳：暖灰画布 + 玻璃主面板 + 顶栏导航 + ⌘K（Rail/Sidebar 退役） */
const buttonBorder = { border: "1px solid var(--color-border)" };

export const AppLayout = React.memo(() => {
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

  // 路由足迹：esc「回到上一页」的事实来源
  useEffect(() => {
    recordNav(location.pathname + location.search);
  }, [location.pathname, location.search]);

  const isAll = location.pathname === RouteConfig.LOCAL_ALL;
  const isStarred = location.pathname.startsWith("/local/starred");
  const isFeeds = location.pathname.startsWith("/local/feeds");
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

  const playerVisible = store.tracks?.length > 0 || store.podcastPlayingStatus;

  useHotkeys(HK.palette, (e) => {
    e.preventDefault();
    setPaletteOpen((v) => !v);
  });
  useHotkeys(HK.paletteFocus, (e) => {
    e.preventDefault();
    setPaletteOpen(true);
  });
  useHotkeys(HK.help, () => {
    setHelpOpen((v) => !v);
    setPaletteOpen(false);
  });
  useHotkeys(HK.settings, () => {
    navigate(RouteConfig.SETTINGS);
  });
  useHotkeys(HK.syncAll, () => store.syncAllArticles());
  // ←/→：播客 ±30s（有曲目且浮层未挡住时全局生效）
  useHotkeys(HK.seekBack, () => {
    if (
      !store.tracks?.length ||
      paletteOpen ||
      helpOpen ||
      store.addFeedModalOpen
    )
      return;
    seekSharedAudioBy(-30);
  }, [store, paletteOpen, helpOpen]);
  useHotkeys(HK.seekFwd, () => {
    if (
      !store.tracks?.length ||
      paletteOpen ||
      helpOpen ||
      store.addFeedModalOpen
    )
      return;
    seekSharedAudioBy(30);
  }, [store, paletteOpen, helpOpen]);
  // esc 逐级退回：悬浮层优先（浮层 / 帮助在捕获阶段已 preventDefault 的那次 esc 不再收回播放器）
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
  useHotkeys(HK.playPause, (e) => {
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
          <Button
            variant="secondary"
            size="sm"
            style={buttonBorder}
            icon={<Search size={12} />}
            label={t("fusion.search.placeholder")}
            endContent={<Kbd keys="mod+k" />}
            onClick={() => setPaletteOpen(true)}
          />
          {/* 快捷键表的可见入口：? 键的鼠标通路（HelpOverlay） */}
          <Button
            variant="secondary"
            size="sm"
            style={buttonBorder}
            aria-label={t("fusion.help.title")}
            label={t("fusion.help.title")}
            isIconOnly
            icon={<CircleHelp size={13} />}
            onClick={() => setHelpOpen(true)}
          />
        </header>
        {/* 播放卡浮在内容上：内容区不占位，只把「让位空白」的高度交给内层滚动容器（--fusion-player-inset） */}
        <div
          className="flex min-h-0 flex-1 flex-col"
          style={
            {
              "--fusion-player-inset":
                playerVisible && store.playerMode === "bar" ? "102px" : "0px",
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
