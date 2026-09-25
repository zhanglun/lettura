import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { History, Inbox, Plus, RefreshCw, Settings, Star } from "lucide-react";
import { request } from "@/helpers/request";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { getCarrier, mediaBadge } from "@/helpers/mediaType";
import { getHostLabel } from "@/helpers/feedMeta";
import { FeedIcon } from "@/components/FeedIcon";
import { CommandPalette as AstryxCommandPalette } from "@astryxdesign/core/CommandPalette";
import type { SearchableItem } from "@astryxdesign/core/Typeahead";
import i18n from "@/i18n";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FILTER_UNREAD = { id: 1, title: "Unread" };
const FILTER_READ = { id: 2, title: "Read" };

interface ItemAux {
  group: string;
  icon: React.ReactNode;
  meta?: string;
  run: () => void;
}

type PaletteItem = SearchableItem<ItemAux>;

function flattenFeeds(items: FeedResItem[]): FeedResItem[] {
  return items.flatMap((item) =>
    item.item_type === "folder" ? flattenFeeds(item.children || []) : [item],
  );
}

function articleIcon(a: any, t: (k: string) => string) {
  const badge = mediaBadge(getCarrier(a), a.origin, {
    text: t("fusion.badge.article"),
    audio: t("fusion.badge.podcast"),
    video: t("fusion.badge.video"),
    email: t("fusion.badge.email"),
  });
  return <span className={`fusion-badge ${badge.cls}`}>{badge.char}</span>;
}

/** 命令的中英文关键词：两种语言都能搜到同一条命令 */
function bilingualTerms(key: string): string[] {
  return Array.from(
    new Set([i18n.t(key, { lng: "en" }), i18n.t(key, { lng: "zh" })]),
  ).map((s) => s.toLowerCase());
}

/** ⌘K 命令面板：命令 / 来源 / 文章（Astryx CommandPalette + 自定义异步 SearchSource） */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 当前可见项 id→run 注册表：search/bootstrap 写入，onValueChange 读取
  const registry = useRef(new Map<string, () => void>());

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      setAddFeedModalOpen: state.setAddFeedModalOpen,
      syncAllArticles: state.syncAllArticles,
      setFilter: state.setFilter,
    })),
  );

  // Astryx 初始不高亮首项；打开后对输入框派发一次 ArrowDown，使 Enter 直达首项
  useEffect(() => {
    if (!open) return;
    const fire = () => {
      const input = document.querySelector<HTMLInputElement>(
        '[role="combobox"]',
      );
      input?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
    };
    const timer = setTimeout(fire, 120);
    return () => clearTimeout(timer);
  }, [open]);

  const searchSource = useMemo(() => {
    const close = () => onOpenChange(false);
    const reg = registry.current;
    const register = (list: PaletteItem[]) => {
      for (const it of list) reg.set(it.id, it.auxiliaryData!.run);
    };

    const goArticle = (a: any) =>
      navigate(
        RouteConfig.LOCAL_ARTICLE.replace(":uuid", a.feed_uuid).replace(
          ":id",
          String(a.id),
        ),
      );
    const goFeed = (f: FeedResItem) =>
      navigate(
        `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f.uuid)}?feedUuid=${f.uuid}&feedUrl=${encodeURIComponent(f.feed_url)}&type=${f.item_type}`,
      );

    const commandDefs = [
      {
        key: "add",
        labelKey: "fusion.cmd.add_feed",
        icon: <Plus size={13} />,
        run: () => store.setAddFeedModalOpen(true),
      },
      {
        key: "sync",
        labelKey: "fusion.cmd.sync_all",
        icon: <RefreshCw size={13} />,
        run: () => store.syncAllArticles(),
      },
      {
        key: "unread",
        labelKey: "fusion.nav.unread",
        icon: <Inbox size={13} />,
        run: () => {
          store.setFilter(FILTER_UNREAD);
          navigate(RouteConfig.LOCAL_ALL);
        },
      },
      {
        key: "history",
        labelKey: "fusion.nav.history",
        icon: <History size={13} />,
        run: () => {
          store.setFilter(FILTER_READ);
          navigate(RouteConfig.LOCAL_ALL);
        },
      },
      {
        key: "starred",
        labelKey: "fusion.nav.starred",
        icon: <Star size={13} />,
        run: () => navigate(RouteConfig.LOCAL_STARRED),
      },
      {
        key: "settings",
        labelKey: "Settings",
        icon: <Settings size={13} />,
        run: () => navigate(RouteConfig.SETTINGS),
      },
    ];

    const commandItems: PaletteItem[] = commandDefs.map((c) => ({
      id: `cmd:${c.key}`,
      label: t(c.labelKey),
      auxiliaryData: {
        group: t("fusion.cmd.commands"),
        icon: c.icon,
        run: () => {
          close();
          c.run();
        },
      },
    }));

    const feedItems: PaletteItem[] = flattenFeeds(store.subscribes || []).map(
      (f) => ({
        id: `feed:${f.uuid}`,
        label: f.title,
        auxiliaryData: {
          group: t("fusion.cmd.feeds"),
          icon: <FeedIcon feed={f} />,
          meta: getHostLabel(f),
          run: () => {
            close();
            goFeed(f);
          },
        },
      }),
    );

    const bootstrapList = commandItems.concat(feedItems.slice(0, 6));
    register(bootstrapList);

    return {
      bootstrap: () => bootstrapList,
      search: (query: string) => {
        const text = query.toLowerCase();
        const cmds = commandItems.filter((c) =>
          bilingualTerms(
            commandDefs.find((d) => c.id === `cmd:${d.key}`)!.labelKey,
          ).some((term) => term.includes(text)),
        );
        const feeds = feedItems
          .filter((f) => f.label.toLowerCase().includes(text))
          .slice(0, 6);

        // 文章走后端异步搜索，与本地命令/来源过滤并发，合并返回
        return request
          .get("/search", { params: { query: text, limit: 6 } })
          .then((res) => {
            const articles: PaletteItem[] = (res.data || []).map((a: any) => ({
              id: `article:${a.uuid}`,
              label: a.title,
              auxiliaryData: {
                group: t("fusion.cmd.articles"),
                icon: articleIcon(a, t),
                meta: a.feed_title,
                run: () => {
                  close();
                  goArticle(a);
                },
              },
            }));
            const merged = cmds.concat(feeds, articles);
            register(merged);
            return merged;
          })
          .catch(() => {
            const local = cmds.concat(feeds);
            register(local);
            return local;
          });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, t, navigate, onOpenChange]);

  return (
    <AstryxCommandPalette
      isOpen={open}
      onOpenChange={onOpenChange}
      searchSource={searchSource}
      label={t("fusion.search.placeholder")}
      onValueChange={(id) => registry.current.get(id)?.()}
      renderItem={(item) => (
        <>
          <span className="ic">{item.auxiliaryData?.icon}</span>
          <span className="t">{item.label}</span>
          {item.auxiliaryData?.meta && (
            <span className="m">{item.auxiliaryData.meta}</span>
          )}
        </>
      )}
      emptySearchText={t("Yay, no matching items.")}
    />
  );
}
