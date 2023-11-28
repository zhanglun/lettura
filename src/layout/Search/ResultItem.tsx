import { formatDistanceToNow, parseISO } from "date-fns";
import { CheckCircle2, ExternalLink, Link, Star } from "lucide-react";
import { ArticleResItem } from "@/db";
import clsx from "clsx";
import { useEffect, useState } from "react";

export interface ResultItemProps {
  article: ArticleResItem;
  onView: (article: ArticleResItem) => void;
}
export function ResultItem(props: ResultItemProps) {
  const { article } = props;
  const [readStatus, setReadStatus] = useState(article.read_status);

  function handleClick () {
    props.onView(article);
  }

  useEffect(() => {
    setReadStatus(article.read_status);
  }, [article.read_status]);

  return (
    <div
      className={clsx(
        "list-none rounded-sm p-3 pl-6 grid gap-1 relative select-none",
        "group hover:bg-accent hover:cursor-pointer",
        {
          "text-[hsl(var(--foreground)_/_80%)]": readStatus === 2,
        }
      )}
        onClick={handleClick}
    >
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
}
