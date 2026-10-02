import { Button } from "@astryxdesign/core/Button";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Check, ChevronLeft, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { RowThumb } from "@/components/ArticleItem";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import {
  ScrollBox,
  type ScrollBoxRefObject,
} from "@/components/ArticleView/ScrollBox";
import { ReaderControls } from "@/components/ReaderControls";
import type { ArticleResItem } from "@/db";
import { formatRelative } from "@/helpers/feedMeta";
import { useAppStore } from "@/stores";

export interface ArticleViewProps {
  article: ArticleResItem | null;
  /** 详情滚动容器句柄：ArticleView 的 j/k 滚动用（传入后由 ScrollBox 挂载） */
  scrollRef?: React.RefObject<ScrollBoxRefObject | null>;
  /** 下一篇（完读区卡片，j/k 直达） */
  nextArticle?: ArticleResItem | null;
  onOpenNext?: () => void;
  /** 已读并返回列表 */
  onMarkBack?: () => void;
  closable?: boolean;
  onClose?: () => void;
  onArticleUpdate?: (updated: ArticleResItem) => void;
}

/* ── 方向契约（2026-10-01 阅读面重设计 · seed 360afa8e；二次修订同日用户拍板） ──
 * THESIS: 正文是唯一的主角——滚过标题幕后切换到实心顶栏（题名居中、操作保留、不透明），
 *   焦带让视口中央的文字全亮；拒绝的旧排布：常驻顶栏 + 顶缘进度发丝线的「仪表盘阅读」。
 * OWN-WORLD: 静密×聚光令牌不变（玻璃面板/墨三级/发丝线/accent/宋体正文/环境光）；
 *   新词汇 = 实心滚动顶栏、右缘覆盖进度轨、margin 大纲（具名捐赠）。
 * STORY: 读者打开即读，滚深后题名与操作跟着走（实心不透明）；位置感由右缘轨与大纲供给；
 *   esc 永远回家，j/k 永远滚动，f/space/⌘K 不变。
 * FIRST VIEWPORT: 打开时标题幕完整（题 + meta + 正文首屏全亮）、原栏在场；
 *   下滚过 160px 后原栏上滑、实心顶栏顶入（题名居中）；右缘轨常驻；
 *   大纲在正文 ≥2 个标题且窗口 ≥1280px 时常驻，否则静默缺席。
 * FORM: 掷中候选 #4「打字机隧道」（三选一锁定），TOC 为 #5「信封双轴」的捐赠（raise）；
 *   二次修订：去幽灵题名/渐隐幕，改实心顶栏（用户实测后拍板）。
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 *   finish review, the verdict, DESIGN.md, and every shipping raster carrying
 *   its provenance.
 */
interface TocItem {
  id: number;
  text: string;
  level: 2 | 3;
}

// 焦带只落正文块：头部三件套（kind/题/meta）不参与压暗——契约 FIRST VIEWPORT
// 「打开时题 + meta + 正文首屏全亮」，滚离后由 16vh 渐隐幕自然收走（mock 同语义）
const FOCUS_SELECTOR =
  ".fusion-article-body > *, .fusion-article-body > * > *";

/** 阅读面：打字机隧道——chrome 退场 + 焦带 + 右缘轨 + margin 大纲（detail.html 的替代） */
export function View({
  article,
  nextArticle,
  onOpenNext,
  onMarkBack,
  closable,
  onClose,
  onArticleUpdate,
  scrollRef,
}: ArticleViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ uuid?: string }>();
  const setArticle = useAppStore((state) => state.setArticle);
  const [progress, setProgress] = useState(0);
  // 二次修订（用户拍板）：滚过 160px 即切换到实心顶栏（题名居中 + 操作保留，不透明），
  // 回到顶部换回开屏原栏；无透明浮层、无渐隐幕
  const [scrolled, setScrolled] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeToc, setActiveToc] = useState<number | null>(null);
  const [wideEnough, setWideEnough] = useState(
    () => window.matchMedia("(min-width: 1280px)").matches,
  );
  const internalRef = useRef<ScrollBoxRefObject>(null);
  const scrollBoxRef = scrollRef ?? internalRef;

  // 切换文章回滚顶部，进度线归零
  useEffect(() => {
    scrollBoxRef.current?.scrollToTop();
    setProgress(0);
  }, [article?.uuid, scrollBoxRef]);

  // 窗口宽度门槛：大纲只在 1280px+ 的右缘留白里生存
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => setWideEnough(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = scrollBoxRef.current?.getElement();
    if (!el || !article) return;

    // 焦带 + 大纲的数据源：正文块与标题（内容异步渲染后由 MutationObserver 重建）
    let blocks: HTMLElement[] = [];
    let headings: HTMLElement[] = [];
    const rebuild = () => {
      blocks = [...el.querySelectorAll<HTMLElement>(FOCUS_SELECTOR)];
      headings = [
        ...el.querySelectorAll<HTMLElement>(
          ".fusion-article-body h2, .fusion-article-body h3",
        ),
      ];
      headings.forEach((h, i) => h.setAttribute("data-toc", String(i)));
      setToc(
        headings
          .map((h, i) => ({
            id: i,
            text: (h.textContent || "").trim(),
            level: (h.tagName === "H3" ? 3 : 2) as 2 | 3,
          }))
          .filter((item) => item.text.length > 0),
      );
    };
    rebuild();

    let moRaf = 0;
    const mo = new MutationObserver(() => {
      if (moRaf) return;
      moRaf = requestAnimationFrame(() => {
        moRaf = 0;
        rebuild();
      });
    });
    mo.observe(el, { childList: true, subtree: true });

    let raf = 0;

    const update = () => {
      raf = 0;
      // 二次修订：滚过 160px 切实心顶栏，回顶换回原栏（无透明浮层、无渐隐幕）
      setScrolled(el.scrollTop > 160);
      // reduced-motion 实时读：阅读中途切系统设置即刻生效（与 wideEnough 对齐）
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      // 焦带：视口中央带全亮，向上下缘线性降灰（reduced-motion 用户保持全亮）
      const vhHalf = el.clientHeight * 0.5;
      if (!reduced) {
        for (const node of blocks) {
          const r = node.getBoundingClientRect();
          if (r.bottom < -80 || r.top > el.clientHeight + 80) continue;
          const d =
            Math.abs(r.top + r.height / 2 - vhHalf) / (el.clientHeight * 0.34);
          node.style.opacity = Math.max(
            0.3,
            Math.min(1, 1.15 - Math.max(0, d - 0.3) * 0.85),
          ).toFixed(2);
        }
      }
      // 大纲 spy：最后一个滚过视口上 42% 线的标题
      let active: number | null = null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top < el.clientHeight * 0.42) {
          active = Number(h.getAttribute("data-toc"));
        }
      }
      setActiveToc(active);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      el.removeEventListener("scroll", onScroll);
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (moRaf) cancelAnimationFrame(moRaf);
    };
  }, [article?.uuid, scrollBoxRef, article]);

  const jumpToToc = (id: number) => {
    const el = scrollBoxRef.current?.getElement();
    const target = el?.querySelector<HTMLElement>(
      `.fusion-article-body [data-toc="${id}"]`,
    );
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  const handleBack = () => {
    if (closable) {
      onClose?.();
      return;
    }
    setArticle(null);
    if (params.uuid) {
      navigate(`/local/feeds/${params.uuid}`);
    }
  };

  const renderPlaceholder = () => {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--fusion-ter)]"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-medium text-[var(--fusion-ink)] mb-2">
          {t("Ready to Read")}
        </h2>
        <p className="text-[var(--fusion-sub)] text-base">
          {t("Select an article from your subscribe to start reading")}
        </p>
      </div>
    );
  };

  const showToc = article !== null && wideEnough && toc.length >= 2;

  return (
    <div className="relative flex h-full min-h-0 flex-1 min-w-0 flex-col">
      {/* 开屏原栏：透明底 + 发丝线（滚过 160px 让位给实心顶栏） */}
      <div className={`fusion-rtop ${scrolled ? "hide" : ""}`}>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={12} />}
          label={t("article.view.back")}
          endContent={<Kbd keys="esc" />}
          onClick={handleBack}
        />
        {article && (
          <span className="d-src">
            {article.feed_title} ·{" "}
            {formatRelative(new Date(article.pub_date || article.create_date))}
          </span>
        )}
        <span className="fusion-spring" />
        {article && (
          <ReaderControls
            article={article}
            showBrowser
            onStarChange={onArticleUpdate}
            onReadChange={onArticleUpdate}
          />
        )}
        {closable && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={14} />}
            label={t("Close")}
            endContent={<Kbd keys="esc" />}
            onClick={onClose}
          />
        )}
      </div>

      {/* 滚动实心顶栏（二次修订）：不透明，题名居中，操作保留 */}
      <div className={`fusion-rbar ${scrolled ? "" : "hide"}`} aria-hidden={!scrolled}>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft size={12} />}
          label={t("article.view.back")}
          endContent={<Kbd keys="esc" />}
          onClick={handleBack}
          tabIndex={scrolled ? 0 : -1}
        />
        <span className="fusion-spring" />
        <span className="t">{article?.title}</span>
        <span className="fusion-spring" />
        {article && (
          <ReaderControls
            article={article}
            showBrowser
            onStarChange={onArticleUpdate}
            onReadChange={onArticleUpdate}
          />
        )}
        {closable && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={14} />}
            label={t("Close")}
            endContent={<Kbd keys="esc" />}
            onClick={onClose}
            tabIndex={scrolled ? 0 : -1}
          />
        )}
      </div>

      {/* 右缘覆盖进度轨：唯一的仪表读数 */}
      <div className="fusion-rail" aria-hidden="true">
        <div className="fill" style={{ height: `${progress}%` }} />
      </div>

      {/* margin 大纲（信封双轴捐赠）：≥3 个标题且宽窗时常驻 */}
      {showToc && (
        <nav className="fusion-toc" aria-label={t("article.view.toc")}>
          {toc.map((item) => (
            <a
              key={item.id}
              role="button"
              tabIndex={0}
              className={`${item.level === 3 ? "lv3" : ""} ${activeToc === item.id ? "on" : ""}`}
              onClick={() => jumpToToc(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  jumpToToc(item.id);
                }
              }}
            >
              {item.text}
            </a>
          ))}
        </nav>
      )}

      {/* 正文 */}
      <ScrollBox
        className="fusion-dscroll min-h-0 w-full flex-1"
        ref={scrollBoxRef}
        onProgress={setProgress}
      >
        {/* 外壳（题/meta/完读区）继承 UI sans；宋体只落在 .fusion-article-body 正文上 */}
        <div className="mx-auto w-full max-w-[680px] px-10 pt-[94px] pb-11">
          {article ? (
            <>
              <ArticleDetail article={article} />

              {/* 完读区：发丝线夹「· 完 ·」，下一篇入卡（j/k 直达） */}
              <div className="fusion-fin">· 完 ·</div>
              {nextArticle ? (
                <div className="fusion-nextcard">
                  <div className="fusion-next-h">
                    {t("article.view.next_up")} · ↑/↓
                  </div>
                  <div
                    className="fusion-row"
                    role="button"
                    tabIndex={0}
                    onClick={onOpenNext}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onOpenNext?.();
                    }}
                  >
                    <span className="fusion-st">
                      <span className="fusion-dot" />
                    </span>
                    <RowThumb article={nextArticle} />
                    <span className="fusion-title">{nextArticle.title}</span>
                    <span className="fusion-src">
                      {nextArticle.feed_logo && (
                        <img
                          className="fusion-ficon"
                          src={nextArticle.feed_logo}
                          alt=""
                          loading="lazy"
                        />
                      )}
                      <span className="fn">{nextArticle.feed_title}</span>
                    </span>
                    <span className="fusion-date">
                      {formatRelative(
                        new Date(
                          nextArticle.pub_date || nextArticle.create_date,
                        ),
                      )}
                    </span>
                    <span />
                  </div>
                </div>
              ) : (
                <div className="fusion-next-h">{t("article.view.no_next")}</div>
              )}
              <div className="fusion-endacts">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Check size={12} />}
                  label={t("article.view.mark_back")}
                  endContent={<Kbd keys="m" />}
                  onClick={onMarkBack}
                />
              </div>
            </>
          ) : (
            renderPlaceholder()
          )}
        </div>
      </ScrollBox>
    </div>
  );
}
