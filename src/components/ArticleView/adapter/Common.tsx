import { Avatar, Heading, Separator } from "@radix-ui/themes";
import { wraperWithRadix } from "../ContentRender";
import { ArticleResItem } from "@/db";
import Dayjs from "dayjs";

export interface CommonAdapterProps {
  content: string;
  article: ArticleResItem;
  feedLogo: string;
  delegateContentClick: any;
}

export const CommonAdapter = ({ article, feedLogo, delegateContentClick, content }: CommonAdapterProps) => {
  const { pub_date } = article;

  return (
    <div className="m-auto pt-1 pb-20 px-4 max-w-[calc(var(--reading-editable-line-width)_*_1px)]">
      <div className="pb-4">
        <Heading className="mt-6 mb-5" size="8">
          {article.title}
        </Heading>
        <div className="flex items-center gap-2 text-sm sm:flex-wrap">
          <div className="flex items-center gap-2 rounded-full bg-[var(--gray-4)] py-0.5 pl-0.5 pr-3">
            <Avatar
              radius="full"
              className="w-6 h-6"
              src={feedLogo}
              fallback={article.feed_title?.slice(0, 1)}
            ></Avatar>
            <span className="text-[var(--gray-12)]">{article.feed_title}</span>
          </div>
          <span>{Dayjs(new Date(pub_date || new Date())).format("YYYY-MM-DD HH:mm")}</span>
          {article.author && <span>· {article.author}</span>}
        </div>
      </div>
      <Separator size="4" />
      <div className="m-auto pt-1 mt-6" onClick={delegateContentClick}>
        {article.image && (
          <div className="w-full my-4  text-center">
            <img src={article.image} alt="" className="bg-accent" />
          </div>
        )}
        <div>{wraperWithRadix(content)}</div>
      </div>
    </div>
  );
};
