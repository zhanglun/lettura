import React, {
  useEffect,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  ForwardedRef,
  createRef,
} from "react";
import { ArticleItem } from "../ArticleItem";
import { useBearStore } from "@/hooks/useBearStore";
import { useArticleListHook } from "./hooks";

export type ArticleListProps = {
  feedUuid: string | null;
  type: string | null;
  feedUrl: string | null;
  title: string | null;
};

export interface ArticleListRefType {
  getList: () => void;
  markAllRead: () => void;
  articlesRef: any;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const ArticleList = forwardRef(
  (
    props: ArticleListProps,
    ref: ForwardedRef<ArticleListRefType>
  ): JSX.Element => {
    const { feedUuid } = props;
    const store = useBearStore((state) => ({
      currentFilter: state.currentFilter,
      setArticleList: state.setArticleList,
      articleList: state.articleList,
      getArticleList: state.getArticleList,
    }));

    const { listRef } = useArticleListHook({ feedUuid });

    console.log("%c Line:42 🍧 listRef", "color:#4fff4B", listRef);

    const renderList = (): JSX.Element[] => {
      return (store.articleList || []).map((article: any, idx: number) => {
        return <ArticleItem article={article} key={article.id} />;
      });
    };

    return (
      <div className="grid grid-cols-1 pl-2 grid-rows-[calc(100%_-_var(--app-toolbar-height))]">
        <div ref={listRef}>
          <ul className="m-0 pb-2 grid gap-2">{renderList()}</ul>
        </div>
      </div>
    );
  }
);
