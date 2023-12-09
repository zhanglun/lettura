import { formatDistanceToNow, parseISO } from "date-fns";
import { CheckCircle2, Circle, ExternalLink, Link, Star } from "lucide-react";
import { ArticleResItem } from "@/db";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { getBestImages } from "@/helpers/parseXML";

export interface ResultItemProps {
  article: ArticleResItem;
  onView: (article: ArticleResItem) => void;
}
export function ResultItem(props: ResultItemProps) {
  const { article } = props;
  const [readStatus, setReadStatus] = useState(article.read_status);
  const [banner, setBanner] = useState("");

  function handleClick() {
    props.onView(article);
  }

  useEffect(() => {
    let match_img = (article.description || article.description).match(
      /<img.*?src="(.*?)"/
    );

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
      <div className="flex gap-4">
        {banner && (
          <div className="flex-0 w-[180px] h-[100px] overflow-hidden bg-muted">
            <div
              className="w-full h-full bg-cover bg-center transition-all group-hover:scale-[1.5] "
              style={{ backgroundImage: `url(${banner})` }}
            ></div>
          </div>
        )}
        <div className="flex-1 text-sm text-foreground my-1 line-clamp-3">
          {article.description.replace(/(<([^>]+)>)/gi, "")}
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs">
          {formatDistanceToNow(parseISO(article.create_date), {
            includeSeconds: true,
            addSuffix: true,
          })}
        </div>
        <div className="flex items-center gap-1">
          <Icon className="w-7 h-7">
            <Star strokeWidth={1} size={20} />
          </Icon>
          {article.read_status === 1 && (
            <Icon className="w-7 h-7">
              <Circle strokeWidth={1} size={20} />
            </Icon>
          )}
          {article.read_status === 2 && (
            <Icon className="w-7 h-7">
              <CheckCircle2 strokeWidth={1} size={20} />
            </Icon>
          )}
          <Icon className="w-7 h-7">
            <ExternalLink strokeWidth={1} size={20} />
          </Icon>
          <Icon className="w-7 h-7">
            <Link strokeWidth={1} size={20} />
          </Icon>
        </div>
      </div>
    </div>
  );
}
