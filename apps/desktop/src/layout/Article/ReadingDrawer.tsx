import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RowThumb } from "@/components/ArticleItem";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ReaderControls } from "@/components/ReaderControls";
import type { ArticleResItem } from "@/db";
import { formatRelative } from "@/helpers/feedMeta";

export interface ReadingDrawerProps {
  article: ArticleResItem;
  /** 下一篇（完读区卡片，j/k 直达） */
  nextArticle?: ArticleResItem | null;
  onOpenNext?: () => void;
  /** 已读并返回列表 */
  onMarkBack?: () => void;
  onClose?: () => void;
  onArticleUpdate?: (updated: ArticleResItem) => void;
  /** 列表滚动容器：抽屉的滚动宿主（实心顶栏切换 / 进度轨 / 大纲 spy 的视口源） */
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

/* ── 方向契约（2026-10-01 阅读面重设计 seed 360afa8e；2026-10-10 抽屉化改版；
 *    同日二次修订：抽屉 chrome 轻量化）──
 * 打字机隧道从整页宿主迁入列表原位抽屉（Inoreader 动线，用户拍板）：
 * 命中行被抽屉取代（展开后原行不再显示）；无返回钮——X 点击收起、esc 同效；
 * 排版与语义不变——右缘进度轨、margin 大纲、680px 列、完读区；
 * 滚动宿主从内建 ScrollBox 换成列表滚动容器，读完往下滚就是队列。
 * chrome 只剩一条 40px 工具条（列表家具，非页面顶栏）：左返回 icon、
 * 右动作 + 关闭，滚过题区中缝才浮现题名——首屏是文章本身，不是页面壳。
 */

interface TocItem {
  id: number;
  text: string;
  level: 2 | 3;
}

/** 原位阅读抽屉：渲染在命中行下方的文章块，列表续其下 */
export function ReadingDrawer({
  article,
  nextArticle,
  onOpenNext,
  onMarkBack,
  onClose,
  onArticleUpdate,
  viewportRef,
}: ReadingDrawerProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  // 滚过 160px（题区离场）后工具条中缝浮现题名
  const [scrolled, setScrolled] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeToc, setActiveToc] = useState<number | null>(null);
  const [wideEnough, setWideEnough] = useState(
    () => window.matchMedia("(min-width: 1280px)").matches,
  );
  const drawerRef = useRef<HTMLElement>(null);

  // 窗口宽度门槛：大纲只在 1280px+ 的右缘留白里生存
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => setWideEnough(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // 滚动观察宿主 = 列表滚动容器：实心顶栏切换 / 进度 / 大纲 spy 全部以
  // 「视口矩形 × 抽屉矩形」的相对几何计算，不依赖滚动方向与容器实现
  useEffect(() => {
    const vp = viewportRef.current;
    const drawer = drawerRef.current;
    if (!vp || !drawer) return;

    // 大纲的数据源：正文标题（内容异步渲染后由 MutationObserver 重建）
    let headings: HTMLElement[] = [];
    const rebuild = () => {
      headings = [
        ...drawer.querySelectorAll<HTMLElement>(
          ".fusion-article-body h2, .fusion-article-body h3",
        ),
      ];
      headings.forEach((h, i) => {
        h.setAttribute("data-toc", String(i));
      });
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
    mo.observe(drawer, { childList: true, subtree: true });

    let raf = 0;
    const update = () => {
      raf = 0;
      const vpRect = vp.getBoundingClientRect();
      const dRect = drawer.getBoundingClientRect();
      // 抽屉顶滚过工具条高度（48px ≈ 40 条高 + 余量）→ 实底 + 发丝线 + 题名
      // （静止态工具条透明，正文不得从它底下穿过）
      setScrolled(vpRect.top - dRect.top > 48);
      // 进度：视口底（读点）在抽屉内的位置走完多少
      const passed = Math.min(
        Math.max(vpRect.bottom - dRect.top, 0),
        dRect.height,
      );
      setProgress(
        dRect.height > 0 ? Math.round((passed / dRect.height) * 100) : 0,
      );
      // 大纲 spy：最后一个滚过视口上 42% 线的标题
      let active: number | null = null;
      for (const h of headings) {
        if (
          h.getBoundingClientRect().top <
          vpRect.top + vp.clientHeight * 0.42
        ) {
          active = Number(h.getAttribute("data-toc"));
        }
      }
      setActiveToc(active);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      vp.removeEventListener("scroll", onScroll);
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (moRaf) cancelAnimationFrame(moRaf);
    };
  }, [article, viewportRef]);

  const jumpToToc = (id: number) => {
    const target = drawerRef.current?.querySelector<HTMLElement>(
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

  const showToc = wideEnough && toc.length >= 2;

  return (
    <article
      className={`fusion-drawer${scrolled ? " is-scrolled" : ""}`}
      data-reading-drawer=""
      ref={drawerRef}
    >
      {/* 抽屉工具条：40px sticky。静止态「不存在」——无底色无发丝线，只是
          右上角一簇动作（Inoreader 同款：无返回，X 收起）；滚过题区后长出
          实底 + 发丝线并浮现题名（is-scrolled），变成压住正文的阅读顶栏 */}
      <div className="fusion-dbar">
        <span className="fusion-spring" />
        <span className="t">{article.title}</span>
        <span className="fusion-spring" />
        <ReaderControls
          article={article}
          showBrowser
          compact
          onStarChange={onArticleUpdate}
          onReadChange={onArticleUpdate}
        />
        <IconButton
          size="sm"
          variant="ghost"
          icon={<X size={14} />}
          label={t("Close")}
          onClick={onClose}
        />
      </div>

      {/* 右缘轨 + margin 大纲的悬浮层：sticky 于抽屉内，随列表滚动保持可见 */}
      <div className="fusion-dfloat" aria-hidden="true">
        <div className="fusion-drailhold">
          <div className="fusion-rail">
            <div className="fill" style={{ height: `${progress}%` }} />
          </div>
        </div>
        {showToc && (
          <div className="fusion-dtochold">
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
          </div>
        )}
      </div>

      {/* 正文（排版继承隧道：680px 列，题/meta/完读区 UI sans，正文同族 sans） */}
      <div className="mx-auto w-full max-w-[680px] px-10 pt-7 pb-11">
        <ArticleDetail article={article} />

        {/* 完读区：发丝线夹「· 完 ·」，下一篇入卡（j/k 直达）；卡下就是队列 */}
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
                  new Date(nextArticle.pub_date || nextArticle.create_date),
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
      </div>
    </article>
  );
}
