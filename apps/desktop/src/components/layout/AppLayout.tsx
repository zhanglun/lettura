import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { Search } from "lucide-react";
import { Dialog, Text } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import { busChannel } from "@/helpers/busChannel";
import { LPodcast } from "@/components/LPodcast";
import { AddFeedChannel } from "@/components/AddFeed";
import { CommandPalette } from "./CommandPalette";

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
      tracks: state.tracks,
      podcastPlayingStatus: state.podcastPlayingStatus,
      updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
      syncAllArticles: state.syncAllArticles,
      addFeedModalOpen: state.addFeedModalOpen,
      setAddFeedModalOpen: state.setAddFeedModalOpen,
    })),
  );

  // Sidebar 退役后，订阅初始化移到壳层
  useEffect(() => {
    store.getSubscribes();
    const unsub = busChannel.on("getChannels", () => store.getSubscribes());
    return () => {
      unsub();
    };
  }, []);

  const isAll = location.pathname === RouteConfig.LOCAL_ALL;
  const isStarred = location.pathname.startsWith("/local/starred");
  const isSettings = location.pathname.startsWith("/settings");
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
      active: isSettings,
      onClick: () => navigate(`${RouteConfig.SETTINGS}?tab=subscriptions`),
    },
  ];

  const sectionTitle = isUnreadActive
    ? t("fusion.nav.unread")
    : isHistoryActive
      ? t("fusion.nav.history")
      : isStarred
        ? t("fusion.nav.starred")
        : isSettings
          ? t("fusion.nav.subscriptions")
          : "";

  const unreadCount = store.collectionMeta.total.unread;
  const playerVisible = store.tracks?.length > 0 || store.podcastPlayingStatus;

  useHotkeys("meta+k, ctrl+k", (e) => {
    e.preventDefault();
    setPaletteOpen((v) => !v);
  });
  useHotkeys("/", (e) => {
    e.preventDefault();
    setPaletteOpen(true);
  });
  useHotkeys("shift+/", () => setHelpOpen((v) => !v));
  useHotkeys("shift+r", () => store.syncAllArticles());
  useHotkeys("space", (e) => {
    if (!store.tracks?.length) return;
    e.preventDefault();
    store.updatePodcastPlayingStatus(!store.podcastPlayingStatus);
  });

  return (
    <div className="fusion-root">
      <section
        className="fusion-panel"
        style={playerVisible ? { bottom: 106 } : undefined}
      >
        <header className="fusion-top" data-tauri-drag-region="">
          <span className="fusion-logo" aria-hidden="true">
            <i />
          </span>
          <span className="fusion-sec">{sectionTitle}</span>
          {isUnreadActive && unreadCount > 0 && (
            <span className="fusion-cnt">{unreadCount}</span>
          )}
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
          <span className="fusion-spring" />
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
        <Outlet />
      </section>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}>
        <Dialog.Content maxWidth="440px">
          <Dialog.Title>{t("fusion.help.title")}</Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {t("fusion.help.desc")}
          </Dialog.Description>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13px]">
            {[
              ["j / k", t("fusion.help.jk")],
              ["⏎ / o", t("fusion.help.open")],
              ["esc", t("fusion.help.esc")],
              ["m", t("fusion.help.m")],
              ["M", t("fusion.help.M")],
              ["f", t("fusion.help.f")],
              ["v", t("fusion.help.v")],
              ["space", t("fusion.help.space")],
              ["R", t("fusion.help.R")],
              ["c", t("fusion.help.c")],
              ["⌘K / /", t("fusion.help.palette")],
              ["?", t("fusion.help.help")],
            ].map(([key, desc]) => (
              <React.Fragment key={key}>
                <kbd className="fusion-kbd">{key}</kbd>
                <Text size="2" color="gray">{desc}</Text>
              </React.Fragment>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Root>
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
