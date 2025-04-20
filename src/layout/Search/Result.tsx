import { useState } from "react";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { ArticleResItem } from "@/db";
import { ResultItem } from "./ResultItem";

export interface SearchResultProps extends React.HTMLAttributes<HTMLDivElement> {
  resultList: ArticleResItem[];
  height: number;
  onArticleClick: (article: ArticleResItem) => void;
  moreItemsLoading: boolean;
  loadMore: any;
  hasNextPage: boolean;
}

export function SearchResult(props: SearchResultProps) {
  const { resultList = [], height, moreItemsLoading, loadMore, hasNextPage } = props;
  const itemCount = hasNextPage ? resultList.length + 1 : resultList.length;
  console.log("🚀 ~ SearchResult ~ resultList:", resultList);
  const [currentArticle, setCurrentArticle] = useState<ArticleResItem | null>(null);

  function handelViewResultItem(article: ArticleResItem) {
    setCurrentArticle(article);
    props.onArticleClick(article);
  }

  return (
    <InfiniteLoader isItemLoaded={(index) => index < resultList.length} itemCount={itemCount} loadMoreItems={loadMore}>
      {({ onItemsRendered, ref }) => (
        <List
          height={height}
          width={"100%"}
          itemCount={itemCount}
          itemSize={10}
          onItemsRendered={onItemsRendered}
          ref={ref}
          overscanCount={4}
        >
          {({ index, style }) => {
            const itemLoading = index === resultList.length;

            if (itemLoading) {
              // return loading state
              return "loading";
            } else {
              // return item
              return (
                <ResultItem key={resultList[index]?.uuid} article={resultList[index]} onView={handelViewResultItem} />
              );
            }
          }}
        </List>
      )}
    </InfiniteLoader>
  );
}
