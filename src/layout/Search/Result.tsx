import { ArticleResItem } from "@/db";
import { ResultItem } from "./ResultItem";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { useState } from "react";
import { useBearStore } from "@/stores";

export interface SearchResultProps {
  resultList: ArticleResItem[];
}
export function SearchResult(props: SearchResultProps) {
  const store = useBearStore((state) => ({
    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,
  }));
  const { resultList } = props;
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
    <div className="max-w-[840px] m-auto">
      {renderResultList(resultList)}

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
