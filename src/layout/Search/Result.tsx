import { ArticleResItem } from "@/db";
import { ResultItem } from "./ResultItem";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { useEffect, useState } from "react";
import { useBearStore } from "@/stores";
import clsx from "clsx";
import { Skeleton } from "@/components/ui/skeleton";

export interface SearchResultProps
  extends React.HTMLAttributes<HTMLDivElement> {
  query: string;
  resultList: ArticleResItem[];
}

export function SearchResult(props: SearchResultProps) {
  const { className, resultList } = props;
  const store = useBearStore((state) => ({
    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,
  }));
  const [ currentArticle, setCurrentArticle ] = useState<ArticleResItem | null>(
    null
  );

  function handelViewResultItem(article: ArticleResItem) {
    store.setArticleDialogViewStatus(true);
    setCurrentArticle(article);
  }

  function renderResultList(list: ArticleResItem[]) {
    return (
      <div>
        { list.map((article) => {
          return (
            <ResultItem
              key={ article.uuid }
              article={ article }
              onView={ handelViewResultItem }
            />
          );
        }) }
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[840px] m-auto">
        { renderResultList(resultList) }
      </div>
      <ArticleDialogView
        article={ currentArticle }
        dialogStatus={ store.articleDialogViewStatus }
        setDialogStatus={ store.setArticleDialogViewStatus }
        afterConfirm={ () => {
        } }
        afterCancel={ () => {
          setCurrentArticle(null);
        } }
      />
    </>
  );
}
