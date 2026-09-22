import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { request } from "@/helpers/request";
import { useBearStore } from "@/stores";
import { RouteConfig } from "@/config";
import { FeedResItem } from "@/db";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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

/** ⌘K 命令面板：文章（防抖搜索）/ 来源（本地订阅）/ 命令 */
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

  const commands: { label: string; hint: string; run: () => void }[] = [
    {
      label: t("fusion.cmd.add_feed"),
      hint: "c",
      run: () => {
        close();
        store.setAddFeedModalOpen(true);
      },
    },
    {
      label: t("fusion.cmd.sync_all"),
      hint: "R",
      run: () => {
        close();
        store.syncAllArticles();
      },
    },
    {
      label: t("fusion.nav.unread"),
      hint: "",
      run: () => {
        close();
        store.setFilter(FILTER_UNREAD);
        navigate(RouteConfig.LOCAL_ALL);
      },
    },
    {
      label: t("fusion.nav.history"),
      hint: "",
      run: () => {
        close();
        store.setFilter(FILTER_READ);
        navigate(RouteConfig.LOCAL_ALL);
      },
    },
    {
      label: t("fusion.nav.starred"),
      hint: "",
      run: () => {
        close();
        navigate(RouteConfig.LOCAL_STARRED);
      },
    },
    {
      label: t("Settings"),
      hint: "",
      run: () => {
        close();
        navigate(RouteConfig.SETTINGS);
      },
    },
  ];

  const text = query.trim().toLowerCase();
  const visibleCommands = text
    ? commands.filter((c) => c.label.toLowerCase().includes(text))
    : commands;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("fusion.search.placeholder")}
      />
      <CommandList>
        <CommandEmpty>{t("Yay, no matching items.")}</CommandEmpty>
        {visibleCommands.length > 0 && (
          <CommandGroup heading={t("fusion.cmd.commands")}>
            {visibleCommands.map((c) => (
              <CommandItem key={c.label} onSelect={c.run}>
                {c.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {feeds.length > 0 && (
          <CommandGroup heading={t("fusion.cmd.feeds")}>
            {feeds.map((f) => (
              <CommandItem key={f.uuid} value={`${f.title} ${f.feed_url}`} onSelect={() => goFeed(f)}>
                {f.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {articles.length > 0 && (
          <CommandGroup heading={t("fusion.cmd.articles")}>
            {articles.map((a) => (
              <CommandItem key={a.uuid} value={a.title} onSelect={() => goArticle(a)}>
                {a.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
