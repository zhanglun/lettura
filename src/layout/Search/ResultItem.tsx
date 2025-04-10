import { formatDistanceToNow, parseISO } from "date-fns";
import { ArticleResItem } from "@/db";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { getFeedLogo } from "@/helpers/parseXML";
import * as dataAgent from "@/helpers/dataAgent";
import { ArticleReadStatus } from "@/typing";
import { Avatar } from "@radix-ui/themes";

export interface ResultItemProps {
  article: ArticleResItem;
  onView: (article: ArticleResItem) => void;
}
export function ResultItem(props: ResultItemProps) {
  const { article } = props;
  const [readStatus, setReadStatus] = useState(article.read_status);

  function handleClick() {
    props.onView(article);

    if (article.read_status === ArticleReadStatus.UNREAD) {
      dataAgent.updateArticleReadStatus(article.uuid, ArticleReadStatus.READ).then(() => {
        article.read_status = ArticleReadStatus.READ;
        console.log("%c Line:26 🍑 article.read_status", "color:#b03734", article.read_status);
        setReadStatus(ArticleReadStatus.READ);
      });
    }
  }

  useEffect(() => {
    setReadStatus(article.read_status);
  }, [article.read_status]);

  return (
    <div
      className={clsx(
        "list-none rounded-md pr-2 pl-5 flex flex-col gap-1 relative select-none",
        "group hover:bg-[var(--accent-a3)] hover:cursor-pointer",
        {
          "text-[var(--gray-10)]": readStatus === ArticleReadStatus.READ,
        }
      )}
      onClick={handleClick}
    >
      <div className="py-2 border-b flex gap-2 items-center justify-between">
        <div className="overflow-hidden flex gap-2 items-center">
          <Avatar
            size="1"
            src={getFeedLogo(article.feed_url)}
            fallback={article.feed_title?.slice(0, 1) || "L"}
            alt={article.feed_title}
            className="rounded w-5 h-5"
          />

          <div className="grow-1 shrink-0 text-sm font-bold">{article.title}</div>
          <div className="grow-0 shrink-1 text-xs overflow-hidden text-ellipsis mr-1 whitespace-nowrap">
            {article.description.replace(/(<([^>]+)>)/gi, "")}
          </div>
        </div>
        <div className="shrink-0 grow-1 flex gap-3 items-center">
          <div className="grow-1 shrink-0 text-xs mx-3">
            {formatDistanceToNow(parseISO(article.create_date), {
              includeSeconds: true,
              addSuffix: true,
            })}
          </div>
          {/* <div className="grow-1 shrink-0 flex items-center gap-4">
            <StarAndRead article={article} />
            <ReadingOptions article={article} />
          </div> */}
        </div>
      </div>
    </div>
  );
}
