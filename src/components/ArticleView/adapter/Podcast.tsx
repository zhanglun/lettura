import { Avatar, Button, Heading } from "@radix-ui/themes";
import { Podcast } from "@/helpers/podcastDB";
import { wraperWithRadix } from "../ContentRender";
import { ArticleResItem } from "@/db";
import { useBearStore } from "@/stores";
import dayjs from "dayjs";

export interface PodcastAdapter {
  article: ArticleResItem;
  content: string;
  medias: any;
}

export function PodcastAdapter(props: PodcastAdapter) {
  const { article, content, medias } = props;
  const { addToPlayListAndPlay } = useBearStore();

  console.log("content", content);
  console.log("medias", medias);
  console.log("article", article);

  function handleAddToPlayListAndPlay(media: any) {
    const { description, content, thumbnails } = media;
    const mediaURL = content[0].url;
    const mediaType = content[0].content_type;
    const thumbnail = thumbnails[0].image.uri;
    const text = description?.content || article.description;

    const record = {
      uuid: article.uuid,
      title: article.title,
      link: article.link,
      feed_url: article.feed_url,
      feed_uuid: article.feed_uuid,
      author: article.author,
      feed_title: article.feed_title,
      feed_logo: article.feed_logo,
      pub_date: article.pub_date,
      create_date: article.create_date,
      starred: article.starred,
      mediaURL,
      mediaType,
      thumbnail,
      description: text,
      add_date: new Date().getTime(),
    } as Podcast;

    // 直接使用 store 的方法，它会处理数据库操作和状态更新
    addToPlayListAndPlay(record);
  }

  function renderMediaBox(media: any) {
    const { description, content, thumbnails } = media;

    function renderContent() {
      return content.map((c: any) => {
        if (c.url && c.content_type.indexOf("audio/") === 0) {
          return (
            <figure className="my-3">
              <Button onClick={() => handleAddToPlayListAndPlay(media)}>Play</Button>
            </figure>
          );
        }
      });
    }

    return (
      <div>
        <div>{renderContent()}</div>
        <div>{wraperWithRadix(description?.content || "")}</div>
      </div>
    );
  }

  function createPodcastPageHeader() {
    const { description, content, thumbnails } = medias[0];
    const t = thumbnails[0];

    return (
      <div className="flex gap-4 flex-col items-center mb-4">
        <div className="w-[130px] rounded-lg overflow-hidden">
          <img src={t.image.uri} alt={t.image.uri} className="object-cover" />
        </div>
        <Heading size="7">{article.title}</Heading>
        <div>
          <div className="flex gap-3 items-center">
            <Avatar radius="medium" size="1" src={article.feed_logo} fallback={article.feed_title?.slice(0, 1)} />
            <span className="font-semibold text-[var(--accent-12)]">
              {article.feed_title} {article.author}
            </span>
            <span className="text-sm text-[var(--gray-12)]">{dayjs(article.pub_date).format("YYYY-MM-DD HH:mm")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[500px] m-auto py-20">
      {medias[0] && createPodcastPageHeader()}
      <div className="flex items-center justify-between mb-4">
        {medias && medias.length > 0 && <div>{renderMediaBox(medias[0])}</div>}
      </div>
      <div className="mb-4">{wraperWithRadix(content)}</div>
    </div>
  );
}
