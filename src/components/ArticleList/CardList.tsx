import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  createRef
} from "react";
import { useBearStore } from "@/hooks/useBearStore";
import { ArticleListProps } from "@/components/ArticleList/index";
import { useArticleListHook } from "@/components/ArticleList/hooks";
import { ArticleCardItem } from "@/components/ArticleItem/Card";

export const ArticleCardList = (props: ArticleListProps): JSX.Element => {
  const { feedUuid } = props;
  const store = useBearStore(state => ({
    currentFilter: state.currentFilter,
    setArticleList: state.setArticleList,
    articleList: state.articleList,
    getArticleList: state.getArticleList
  }));
  useArticleListHook({ feedUuid })

  const renderList = (): JSX.Element[] => {
    return (store.articleList || []).map((article: any, idx: number) => {
      return (
        <ArticleCardItem
          article={ article }
          key={ article.id }
        />
      );
    });
  };

  return (
    <div className="">
      <ul className="m-[0_auto] py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:max-w-3xl lg:max-w-5xl">{ renderList() }</ul>
    </div>
  );
};
