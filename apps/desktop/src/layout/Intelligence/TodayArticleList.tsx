import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  ArticleListVirtual,
  ArticleListVirtualRefType,
} from "@/components/ArticleListVirtual";
import { useBearStore } from "@/stores";
import { CheckCheck } from "lucide-react";
import { useArticle } from "@/layout/Article/useArticle";
import { ArticleReadStatus } from "@/typing";
import { ArticleResItem } from "@/db";
import { IconButton, Select, Tooltip } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { throttle } from "lodash";

export interface TodayArticleListRefObject {
  goNext: () => void;
  goPrev: () => void;
}

export const TodayArticleList = React.memo(
  React.forwardRef<TodayArticleListRefObject>((_props, listForwarded) => {
    const { t } = useTranslation();
    const listRef = useRef<ArticleListVirtualRefType | null>(null);

    const store = useBearStore(
      useShallow((state) => ({
        article: state.article,
        setArticle: state.setArticle,
        markArticleListAsRead: state.markArticleListAsRead,
        updateArticleStatus: state.updateArticleStatus,
        setHasMorePrev: state.setHasMorePrev,
        setHasMoreNext: state.setHasMoreNext,
        currentFilter: state.currentFilter,
        setFilter: state.setFilter,
      })),
    );

    const {
      articles,
      isLoading,
      size,
      mutate,
      setSize,
      isEmpty,
      isReachingEnd,
    } = useArticle({});

    const filterList = useMemo(
      () => [
        { id: 0, title: i18next.t("All articles") },
        { id: 1, title: i18next.t("Unread") },
        { id: 2, title: i18next.t("Read") },
      ],
      [],
    );

    const markAllRead = () => {
      return store.markArticleListAsRead(true, false).then(() => {
        mutate();
      });
    };

    const changeFilter = useCallback(
      (id: any) => {
        if (filterList.some((_) => _.id === parseInt(id, 10))) {
          store.setFilter({
            ...filterList.filter((_) => _.id === parseInt(id, 10))[0],
          });
        }
      },
      [filterList, store.setFilter],
    );

    function calculateItemPosition(
      direction: "up" | "down",
      article: ArticleResItem | null,
    ) {
      if (!article?.uuid) return;

      const $li = document.getElementById(article.uuid);
      const bounding = $li?.getBoundingClientRect();
      const winH = window.innerHeight;

      if (bounding && bounding.top < 58) {
        const offset = 58 - bounding.top;
        const scrollTop =
          (listRef?.current?.innerRef.current?.scrollTop || 0) - offset;
        listRef?.current?.innerRef.current?.scrollTo(0, scrollTop);
      } else if (bounding && bounding.bottom > winH) {
        const offset = bounding.bottom - winH;
        const scrollTop =
          (listRef?.current?.innerRef.current?.scrollTop || 0) + offset;
        listRef?.current?.innerRef.current?.scrollTo(0, scrollTop);
      }
    }

    const goPreviousArticle = () => {
      let previousItem: ArticleResItem;
      const uuid = store.article?.uuid;

      for (let i = 0; i < articles.length; i++) {
        if (articles[i].uuid === uuid && i === 0) {
          store.setHasMorePrev(false);
          store.setHasMoreNext(true);
          break;
        }

        if (articles[i].uuid === uuid && i !== 0) {
          previousItem = articles[i - 1];
          previousItem.read_status = ArticleReadStatus.READ;
          store.updateArticleStatus(
            { ...previousItem },
            ArticleReadStatus.READ,
          );
          store.setArticle(previousItem);
          store.setHasMorePrev(true);
          store.setHasMoreNext(true);
          calculateItemPosition("up", previousItem);
          break;
        }
      }
    };

    const goNextArticle = () => {
      let nextItem: ArticleResItem = {} as ArticleResItem;
      const uuid = store.article?.uuid;

      if (!uuid) return;

      for (let i = 0; i < articles.length; i++) {
        if (articles[i].uuid === uuid && i < articles.length - 1) {
          nextItem = articles[i + 1];
          break;
        }
      }

      store.updateArticleStatus({ ...nextItem }, ArticleReadStatus.READ);
      nextItem.read_status = ArticleReadStatus.READ;
      store.setArticle(nextItem);
      calculateItemPosition("down", nextItem);
    };

    const goPrevRef = useRef<(() => void) | null>(null);
    const goNextRef = useRef<(() => void) | null>(null);

    goPrevRef.current = throttle(() => goPreviousArticle(), 300);
    goNextRef.current = throttle(() => goNextArticle(), 300);

    useEffect(() => {
      return () => {
        goPrevRef.current = null;
        goNextRef.current = null;
      };
    }, []);

    const goPrev = useCallback(() => {
      goPrevRef.current?.();
    }, []);

    const goNext = useCallback(() => {
      goNextRef.current?.();
    }, []);

    useImperativeHandle(listForwarded, () => ({
      goNext,
      goPrev,
    }));

    return (
      <div className="w-[var(--app-article-width)] border-r flex flex-col h-full">
        <div className="h-[var(--app-toolbar-height)] grid grid-cols-[auto_1fr] items-center justify-between border-b shrink-0">
          <div className="pl-3 text-base font-bold text-article-headline">
            <span className="cursor-default">{t("Today")}</span>
          </div>
          <div className="flex items-center justify-end px-2 gap-x-3">
            <Select.Root
              defaultValue={`${store.currentFilter.id}`}
              onValueChange={changeFilter}
              size="1"
            >
              <Select.Trigger
                variant="surface"
                color="gray"
                className="hover:bg-[var(--accent-a3)]"
              />
              <Select.Content>
                {filterList.map((item) => (
                  <Select.Item key={`${item.id}`} value={`${item.id}`}>
                    {item.title}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Tooltip content={t("Mark all as read")}>
              <IconButton
                onClick={markAllRead}
                size="2"
                variant="ghost"
                color="gray"
                className="text-[var(--gray-12)]"
              >
                <CheckCheck size={14} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <ArticleListVirtual
          ref={listRef}
          articles={articles}
          title={null}
          isLoading={isLoading}
          isEmpty={isEmpty}
          isReachingEnd={isReachingEnd}
          size={size}
          setSize={setSize}
        />
      </div>
    );
  }),
);
