import { ArticleResItem } from "@/db";
import { ResultItem } from "./ResultItem";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { useState } from "react";
import { useBearStore } from "@/stores";
import { useSearchListHook } from "./hooks";
import clsx from "clsx";
import { Skeleton } from "@/components/ui/skeleton";

export interface SearchResultProps
  extends React.HTMLAttributes<HTMLDivElement> {
  query: string;
}
export function SearchResult(props: SearchResultProps) {
  const { className } = props;
  const store = useBearStore((state) => ({
    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,
  }));
  const { resultList, listRef, loadRef, loading, observerTarget } = useSearchListHook();
  console.log("%c Line:21 🍓 articleList", "color:#465975", resultList);
  const [currentArticle, setCurrentArticle] = useState<ArticleResItem | null>(
    null
  );

  function handelViewResultItem(article: ArticleResItem) {
    store.setArticleDialogViewStatus(true);
    setCurrentArticle(article);
  }

  function renderResultList(list: ArticleResItem[]) {
    return (
      <div>
        {list.map((article) => {
          return (
            <ResultItem
              key={article.uuid}
              article={article}
              onView={handelViewResultItem}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={clsx("overflow-auto", className)}>
      <div className="max-w-[840px] m-auto" ref={listRef}>
        {renderResultList(resultList)}
        <div ref={loadRef}>
          {loading && (
            <div className="p-3 pl-6 grid gap-1 relative">
              <Skeleton className="h-5 w-full" />
              <div>
                <Skeleton className="h-3 w-full" />
              </div>
              <div>
                <Skeleton className="h-3 w-full m-[-2px]" />
              </div>
              <div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          )}
        </div>
        <div ref={observerTarget}>2</div>
      </div>

      <ArticleDialogView
        article={currentArticle}
        dialogStatus={store.articleDialogViewStatus}
        setDialogStatus={store.setArticleDialogViewStatus}
        afterConfirm={() => {}}
        afterCancel={() => {
          setCurrentArticle(null);
        }}
      />
    </div>
  );
}
