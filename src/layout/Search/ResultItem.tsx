import { formatDistanceToNow, parseISO } from "date-fns";
import { ExternalLink, Link } from "lucide-react";
import { ArticleResItem } from "@/db";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { open } from "@tauri-apps/api/shell";
import { Icon } from "@/components/Icon";
import { getBestImages, getFeedLogo } from "@/helpers/parseXML";
import * as dataAgent from "@/helpers/dataAgent";
import { ArticleReadStatus } from "@/typing";
import { toast } from "sonner";
import { StarAndRead } from "@/layout/Article/StarAndRead";
import { Avatar, Tooltip } from "@radix-ui/themes";
import { ReadingOptions } from "../Article/ReadingOptions";

export interface ResultItemProps {
  article: ArticleResItem;
  onView: (article: ArticleResItem) => void;
}
export function ResultItem(props: ResultItemProps) {
  const { article } = props;
  console.log("🚀 ~ ResultItem ~ article:", article);
  const [readStatus, setReadStatus] = useState(article.read_status);
  const [banner, setBanner] = useState("");

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

  function handleCopyLink() {
    const { link } = article;

    navigator.clipboard.writeText(link).then(
      function () {
        toast("Copied");
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  }

  function openInBrowser() {
    article && open(article?.link);
  }

  useEffect(() => {
    let match_img = (article.description || article.description).match(/<img.*?src="(.*?)"/);

    console.log("%c Line:45 🍔 match_img", "color:#93c0a4", match_img);

    if (match_img?.[1]) {
      setBanner(match_img[1]);
    } else {
      getBestImages([article]).then((res) => {
        setBanner(res[0].image);
      });
    }
  }, [article]);

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
          <div className="grow-1 shrink-0 flex items-center gap-3">
            <StarAndRead article={article} />
            <ReadingOptions article={article} />
          </div>
        </div>
      </div>
    </div>
  );
}
