import { wraperWithRadix } from "../ContentRender";
import { ArticleResItem } from "@/db";
import Dayjs from "dayjs";

export interface CommonAdapterProps {
  content: string;
  article: ArticleResItem;
  delegateContentClick: any;
}

export const CommonAdapter = ({
  article,
  delegateContentClick,
  content,
}: CommonAdapterProps) => {
  const { pub_date } = article;

  return (
    <div className="pb-20">
      <div className="pb-5">
        <h1 className="mb-4 text-[28px] font-bold leading-[1.3] text-[var(--gray-12)]">
          {article.title}
        </h1>
        <div className="mb-8 text-[13px] text-[var(--gray-9)]">
          <span className="font-medium text-[var(--accent-9)]">
            {article.feed_title}
          </span>
          {article.author && <span> · {article.author}</span>}
          <span>
            {" "}
            · {Dayjs(new Date(pub_date || new Date())).format("YYYY-MM-DD")}
          </span>
        </div>
      </div>
      <div
        className="reading-detail-content text-[15px] leading-7 text-[var(--gray-12)]"
        onClick={delegateContentClick}
      >
        {article.image && (
          <div className="my-6 w-full text-center">
            <img
              src={article.image}
              alt=""
              className="max-h-[420px] w-full rounded-md object-cover"
            />
          </div>
        )}
        <div>{wraperWithRadix(content)}</div>
      </div>
    </div>
  );
};
