import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Command as CommandPrimitive } from "cmdk";
import { History, Inbox, Plus, RefreshCw, Settings, Star } from "lucide-react";
import { request } from "@/helpers/request";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import { getArticleKind, getPlatformBadge } from "@/helpers/articleKind";
import { getHostLabel } from "@/helpers/feedMeta";
import { FeedIcon } from "@/components/FeedIcon";
import i18n from "@/i18n";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FILTER_UNREAD = { id: 1, title: "Unread" };
const FILTER_READ = { id: 2, title: "Read" };

function flattenFeeds(items: FeedResItem[]): FeedResItem[] {
  return items.flatMap((item) =>
    item.item_type === "folder" ? flattenFeeds(item.children || []) : [item],
  );
}

function articleBadge(a: any, t: (k: string) => string) {
  const kind = getArticleKind(a);
  if (kind === "podcast") {
    return { char: t("fusion.badge.podcast"), cls: "b-pod" };
  }
  if (kind === "platform") {
    return getPlatformBadge(a, {
      platform: t("fusion.badge.platform"),
      douyin: t("fusion.badge.douyin"),
    });
  }
  return { char: t("fusion.badge.article"), cls: "b-art" };
}

/** 命令的中英文关键词：无论当前界面语言，两种语言都能搜到同一条命令 */
function bilingualTerms(key: string): string[] {
  return Array.from(new Set([i18n.t(key, { lng: "en" }), i18n.t(key, { lng: "zh" })])).map((s) =>
    s.toLowerCase(),
  );
}

/** 分组头：小号间距标题 + 右对齐计数（Raycast 式分组，fusion 计数药丸语法） */
function GroupHeading({ label, count }: { label: string; count: number }) {
  return (
    <span className="gh">
      <span className="gh-t">{label}</span>
      <span className="gh-n">{count}</span>
    </span>
  );
}

/** ⌘K 命令面板：命令 / 来源 / 文章，图标槽 + 分组计数 + 尾部元信息三列行 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<any[]>([]);

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      setAddFeedModalOpen: state.setAddFeedModalOpen,
      syncAllArticles: state.syncAllArticles,
      setFilter: state.setFilter,
    })),
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setArticles([]);
    }
  }, [open]);

  // esc 关闭（capture：先于其它热键）
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onOpenChange]);

  // 防抖搜索文章（复用 /api/search）
  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setArticles([]);
      return;
    }
    const timer = setTimeout(() => {
      request
        .get("/search", { params: { query: text, limit: 6 } })
        .then((res) => setArticles(res.data || []))
        .catch(() => setArticles([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const feeds = useMemo(() => {
    const all = flattenFeeds(store.subscribes || []);
    const text = query.trim().toLowerCase();
    return (text ? all.filter((f) => f.title.toLowerCase().includes(text)) : all).slice(0, 6);
  }, [store.subscribes, query]);

  const close = () => onOpenChange(false);

  const goArticle = (a: any) => {
    close();
    navigate(
      RouteConfig.LOCAL_ARTICLE.replace(":uuid", a.feed_uuid).replace(":id", String(a.id)),
    );
  };

  const goFeed = (f: FeedResItem) => {
    close();
    navigate(
      `${RouteConfig.LOCAL_FEED.replace(/:uuid/, f.uuid)}?feedUuid=${f.uuid}&feedUrl=${encodeURIComponent(f.feed_url)}&type=${f.item_type}`,
    );
  };

  const commands = [
    {
      label: t("fusion.cmd.add_feed"),
      terms: bilingualTerms("fusion.cmd.add_feed"),
      hint: "c",
      icon: <Plus size={13} />,
      run: () => {
        close();
        store.setAddFeedModalOpen(true);
      },
    },
    {
      label: t("fusion.cmd.sync_all"),
      terms: bilingualTerms("fusion.cmd.sync_all"),
      hint: "R",
      icon: <RefreshCw size={13} />,
      run: () => {
        close();
        store.syncAllArticles();
      },
    },
    {
      label: t("fusion.nav.unread"),
      terms: bilingualTerms("fusion.nav.unread"),
      hint: "",
      icon: <Inbox size={13} />,
      run: () => {
        close();
        store.setFilter(FILTER_UNREAD);
        navigate(RouteConfig.LOCAL_ALL);
      },
    },
    {
      label: t("fusion.nav.history"),
      terms: bilingualTerms("fusion.nav.history"),
      hint: "",
      icon: <History size={13} />,
      run: () => {
        close();
        store.setFilter(FILTER_READ);
        navigate(RouteConfig.LOCAL_ALL);
      },
    },
    {
      label: t("fusion.nav.starred"),
      terms: bilingualTerms("fusion.nav.starred"),
      hint: "",
      icon: <Star size={13} />,
      run: () => {
        close();
        navigate(RouteConfig.LOCAL_STARRED);
      },
    },
    {
      label: t("Settings"),
      terms: bilingualTerms("Settings"),
      hint: "",
      icon: <Settings size={13} />,
      run: () => {
        close();
        navigate(RouteConfig.SETTINGS);
      },
    },
  ];

  const text = query.trim().toLowerCase();
  const visibleCommands = text
    ? commands.filter((c) => c.terms.some((term) => term.includes(text)))
    : commands;

  const resultCount = visibleCommands.length + feeds.length + articles.length;

  if (!open) return null;

  return (
    <div className="fusion-veil" onClick={close}>
      <section
        className="fusion-float fusion-cmd"
        role="dialog"
        aria-label={t("fusion.search.placeholder")}
        onClick={(e) => e.stopPropagation()}
      >
        <CommandPrimitive className="fusion-cmd-root">
          <div className="fusion-cmd-in">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--fusion-ter)" strokeWidth="1.7">
              <circle cx="7" cy="7" r="4.8" />
              <path d="m11.2 11.2 3 3" />
            </svg>
            <CommandPrimitive.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={t("fusion.search.placeholder")}
            />
            <kbd className="fusion-kbd">esc</kbd>
          </div>

          <CommandPrimitive.List className="fusion-cmd-list">
            <CommandPrimitive.Empty>
              {t("Yay, no matching items.")}
            </CommandPrimitive.Empty>

            {visibleCommands.length > 0 && (
              <CommandPrimitive.Group
                heading={<GroupHeading label={t("fusion.cmd.commands")} count={visibleCommands.length} />}
              >
                {visibleCommands.map((c) => (
                  <CommandPrimitive.Item
                    key={c.label}
                    value={c.terms.join(" ")}
                    onSelect={c.run}
                  >
                    <span className="ic">{c.icon}</span>
                    <span className="t">{c.label}</span>
                    <span className="m">{c.hint ? <kbd>{c.hint}</kbd> : null}</span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {feeds.length > 0 && (
              <CommandPrimitive.Group
                heading={<GroupHeading label={t("fusion.cmd.feeds")} count={feeds.length} />}
              >
                {feeds.map((f) => (
                  <CommandPrimitive.Item
                    key={f.uuid}
                    value={`${f.title} ${f.feed_url}`}
                    onSelect={() => goFeed(f)}
                  >
                    <FeedIcon feed={f} />
                    <span className="t">{f.title}</span>
                    <span className="m">{getHostLabel(f)}</span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {articles.length > 0 && (
              <CommandPrimitive.Group
                heading={<GroupHeading label={t("fusion.cmd.articles")} count={articles.length} />}
              >
                {articles.map((a) => {
                  const badge = articleBadge(a, t);
                  return (
                    <CommandPrimitive.Item
                      key={a.uuid}
                      value={`${a.title} ${a.feed_title ?? ""}`}
                      onSelect={() => goArticle(a)}
                    >
                      <span className={`fusion-badge ${badge.cls}`}>{badge.char}</span>
                      <span className="t">{a.title}</span>
                      <span className="m">{a.feed_title}</span>
                    </CommandPrimitive.Item>
                  );
                })}
              </CommandPrimitive.Group>
            )}
          </CommandPrimitive.List>

          <div className="fusion-float-foot">
            <span>↵ {t("fusion.cmd.hint_open")}</span>
            <span>esc {t("fusion.cmd.hint_close")}</span>
            <span className="fusion-spring" />
            <span>{t("fusion.cmd.results", { count: resultCount })}</span>
          </div>
        </CommandPrimitive>
      </section>
    </div>
  );
}
