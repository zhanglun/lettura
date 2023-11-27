import { ArticleResItem } from "@/db";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CheckCircle2, ExternalLink, Link, Star } from "lucide-react";

export interface SearchResultProps {
  resultList: ArticleResItem[];
}
export function SearchResult(props: SearchResultProps) {
  const { resultList } = props;

  function renderResultList(list: ArticleResItem[]) {
    return (
      <div>
        {list.map((article) => {
          return (
            <div className="p-3">
              <div className="w-full text-base font-medium text-foreground text-ellipsis overflow-hidden whitespace-nowrap leading-7">
                {article.title}
              </div>
              <div className="text-sm text-muted-foreground leading-6">
                {article.feed_title}
              </div>
              <div className="text-sm text-foreground my-1 line-clamp-3">
                {article.description.replace(/(<([^>]+)>)/gi, "")}
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs">
                  {formatDistanceToNow(parseISO(article.create_date), {
                    includeSeconds: true,
                    addSuffix: true,
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <Star strokeWidth={1} size={20} />
                  <CheckCircle2 strokeWidth={1} size={20} />
                  <ExternalLink strokeWidth={1} size={20} />
                  <Link strokeWidth={1} size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-[840px] m-auto">{renderResultList(resultList)}</div>
  );
}
