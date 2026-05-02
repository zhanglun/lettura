import { useMemo, useState } from "react";
import { formatDistanceToNow, isToday, parseISO } from "date-fns";
import {
  Archive,
  Bookmark,
  Download,
  FolderPlus,
  Library,
  Star,
  Tags,
} from "lucide-react";
import { Avatar, Button } from "@radix-ui/themes";
import { ArticleResItem } from "@/db";
import { MainPanel } from "@/components/MainPanel";
import { View } from "../Article/View";
import { useArticle } from "../Article/useArticle";
import { getFeedLogo } from "@/helpers/parseXML";

function stripHtml(value = "") {
  return value.replace(/(<([^>]+)>)/gi, "").replace(/\s+/g, " ").trim();
}

function formatTime(date?: string) {
  if (!date) return "";
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return date;
  }
}

function isFromToday(article: ArticleResItem) {
  try {
    return isToday(parseISO(article.create_date));
  } catch {
    return false;
  }
}

function SavedArticleCard(props: {
  article: ArticleResItem;
  active: boolean;
  onOpen: (article: ArticleResItem) => void;
}) {
  const { article, active, onOpen } = props;
  const summary = stripHtml(article.description || article.content || "");

  return (
    <button
      type="button"
      onClick={() => onOpen(article)}
      className={
        active
          ? "w-full border-l-2 border-[var(--accent-9)] bg-[var(--accent-a2)] px-4 py-3 text-left"
          : "w-full px-4 py-3 text-left transition hover:bg-[var(--gray-a3)]"
      }
    >
      <div className="flex items-start gap-3">
        <Avatar
          size="2"
          src={article.feed_logo || getFeedLogo(article.feed_url)}
          fallback={article.feed_title?.slice(0, 1) || "L"}
          className="mt-0.5 rounded"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--gray-12)]">
              {article.title}
            </h3>
            <Star
              size={14}
              fill="currentColor"
              className="shrink-0 text-[var(--amber-9)]"
            />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--gray-10)]">
            <span>{article.feed_title || "Unknown feed"}</span>
            <span>·</span>
            <span>{formatTime(article.create_date)}</span>
          </div>
          {summary && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--gray-11)]">
              {summary}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function SavedGroup(props: {
  title: string;
  subtitle: string;
  articles: ArticleResItem[];
  selected?: ArticleResItem | null;
  onOpen: (article: ArticleResItem) => void;
}) {
  if (props.articles.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)]">
      <div className="flex items-center justify-between border-b border-[var(--gray-5)] bg-[var(--gray-2)] px-4 py-2">
        <div className="text-xs font-semibold text-[var(--gray-12)]">
          {props.title}
        </div>
        <div className="text-xs text-[var(--gray-10)]">{props.subtitle}</div>
      </div>
      <div className="divide-y divide-[var(--gray-5)]">
        {props.articles.map((article) => (
          <SavedArticleCard
            key={article.uuid}
            article={article}
            active={props.selected?.uuid === article.uuid}
            onOpen={props.onOpen}
          />
        ))}
      </div>
    </div>
  );
}

export const StarredPage = () => {
  const { articles, isLoading, isEmpty, isReachingEnd, size, setSize } =
    useArticle({});
  const [selectedArticle, setSelectedArticle] =
    useState<ArticleResItem | null>(null);

  const todayArticles = useMemo(
    () => articles.filter((article) => isFromToday(article)),
    [articles],
  );
  const earlierArticles = useMemo(
    () => articles.filter((article) => !isFromToday(article)),
    [articles],
  );
  const feedCount = useMemo(
    () => new Set(articles.map((article) => article.feed_uuid)).size,
    [articles],
  );
  const withNotesCount = useMemo(
    () =>
      articles.filter((article) =>
        stripHtml(article.description || article.content || ""),
      ).length,
    [articles],
  );

  return (
    <MainPanel>
      <div className="flex h-full w-full overflow-hidden bg-[var(--gray-1)]">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--gray-2)] md:flex">
          <div className="border-b border-[var(--gray-5)] p-4">
            <div className="text-sm font-semibold text-[var(--gray-12)]">
              Starred
            </div>
            <div className="mt-1 text-xs leading-5 text-[var(--gray-10)]">
              收藏、稍后读和长期参考资料。
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              收藏夹
            </div>
            {[
              ["全部收藏", articles.length, "var(--amber-9)"],
              ["研究素材", Math.min(12, articles.length), "var(--accent-9)"],
              ["工程实践", Math.min(9, articles.length), "var(--green-9)"],
              ["产品观察", Math.min(6, articles.length), "var(--blue-9)"],
            ].map(([label, count, color]) => (
              <button
                type="button"
                key={label}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: color as string }}
                />
                <span>{label}</span>
                <span className="ml-auto text-[10px] text-[var(--gray-9)]">
                  {count as number}
                </span>
              </button>
            ))}
            <div className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
              标签
            </div>
            {["# agent-frameworks", "# rust", "# pricing"].map((tag) => (
              <button
                type="button"
                key={tag}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
              >
                <Tags size={12} />
                {tag}
              </button>
            ))}
          </div>
        </aside>

        <section
          className={
            selectedArticle
              ? "flex w-[420px] shrink-0 flex-col border-r border-[var(--gray-5)] bg-[var(--color-panel-solid)]"
              : "flex min-w-0 flex-1 flex-col bg-[var(--color-panel-solid)]"
          }
        >
          <div className="border-b border-[var(--gray-5)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-[var(--gray-12)]">
                  Starred
                </h1>
                <p className="mt-1 text-sm text-[var(--gray-10)]">
                  把有长期价值的文章沉淀成可回看的资料库。
                </p>
              </div>
              <Button variant="surface" color="gray">
                <Download size={14} />
                导出
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--accent-8)] bg-[var(--accent-a3)] px-3 py-1.5 text-xs font-medium text-[var(--accent-11)]">
                全部
              </span>
              <span className="rounded-full border border-[var(--gray-5)] px-3 py-1.5 text-xs font-medium text-[var(--gray-11)]">
                稍后读
              </span>
              <span className="rounded-full border border-[var(--gray-5)] px-3 py-1.5 text-xs font-medium text-[var(--gray-11)]">
                已归档
              </span>
              <span className="rounded-full border border-[var(--gray-5)] px-3 py-1.5 text-xs font-medium text-[var(--gray-11)]">
                只看笔记
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5">
            {isLoading && articles.length === 0 ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4"
                  >
                    <div className="mb-3 h-3 w-28 rounded bg-[var(--gray-a4)]" />
                    <div className="mb-2 h-4 w-4/5 rounded bg-[var(--gray-a4)]" />
                    <div className="h-3 w-full rounded bg-[var(--gray-a3)]" />
                  </div>
                ))}
              </div>
            ) : isEmpty ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--gray-6)] bg-[var(--gray-a2)] p-8 text-center">
                <Library
                  size={42}
                  strokeWidth={1.5}
                  className="text-[var(--gray-9)]"
                />
                <h2 className="mt-4 text-base font-semibold text-[var(--gray-12)]">
                  暂无收藏
                </h2>
                <p className="mt-2 max-w-[360px] text-sm leading-6 text-[var(--gray-10)]">
                  在阅读文章时点亮星标，内容会出现在这里，并按时间、来源和标签整理。
                </p>
              </div>
            ) : (
              <>
                <SavedGroup
                  title="今天收藏"
                  subtitle={`${todayArticles.length} 篇`}
                  articles={todayArticles}
                  selected={selectedArticle}
                  onOpen={setSelectedArticle}
                />
                <SavedGroup
                  title="本周回看"
                  subtitle="按收藏时间排序"
                  articles={earlierArticles}
                  selected={selectedArticle}
                  onOpen={setSelectedArticle}
                />
                {!isReachingEnd && (
                  <Button
                    variant="surface"
                    color="gray"
                    loading={isLoading}
                    onClick={() => setSize(size + 1)}
                  >
                    加载更多
                  </Button>
                )}
              </>
            )}
          </div>
        </section>

        {selectedArticle ? (
          <View
            article={selectedArticle}
            closable
            onClose={() => setSelectedArticle(null)}
          />
        ) : (
          <aside className="hidden w-[280px] shrink-0 overflow-auto border-l border-[var(--gray-5)] bg-[var(--gray-2)] p-4 lg:block">
            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                收藏状态
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
                  <div className="text-2xl font-bold text-[var(--gray-12)]">
                    {articles.length}
                  </div>
                  <div className="text-xs text-[var(--gray-10)]">全部收藏</div>
                </div>
                <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
                  <div className="text-2xl font-bold text-[var(--accent-11)]">
                    {feedCount}
                  </div>
                  <div className="text-xs text-[var(--gray-10)]">来源</div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                建议整理
              </div>
              <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--gray-12)]">
                  <FolderPlus size={14} />
                  创建收藏夹
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--gray-11)]">
                  有 {withNotesCount} 篇收藏带摘要，可优先整理为研究素材。
                </p>
                <Button className="mt-3" size="1">
                  创建收藏夹
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-10)]">
                阅读队列
              </div>
              {articles.slice(0, 3).map((article) => (
                <button
                  type="button"
                  key={article.uuid}
                  onClick={() => setSelectedArticle(article)}
                  className="mb-2 flex w-full items-start gap-2 rounded-md bg-[var(--gray-a2)] px-2 py-2 text-left text-xs text-[var(--gray-11)] hover:bg-[var(--gray-a3)]"
                >
                  <Bookmark size={13} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{article.title}</span>
                </button>
              ))}
              {articles.length === 0 && (
                <div className="rounded-md bg-[var(--gray-a2)] px-3 py-3 text-xs leading-5 text-[var(--gray-10)]">
                  <Archive size={14} className="mb-2" />
                  星标文章后会自动形成阅读队列。
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </MainPanel>
  );
};
