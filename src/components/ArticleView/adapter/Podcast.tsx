import { Button } from "@radix-ui/themes";
import { Podcast } from "@/helpers/podcastDB";
import { wraperWithRadix } from "../ContentRender";
import { ArticleResItem } from "@/db";
import { useBearStore } from "@/stores";

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
      feed_title: article.feed_title,
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

    function renderThumbnails() {
      return thumbnails.map((t: any) => {
        if (t.image && t.image.uri) {
          return <img src={t.image.uri} alt={t.image.uri} />;
        }
      });
    }

    return (
      <div>
        <div>{renderThumbnails()}</div>
        <div>{renderContent()}</div>
        <div>{wraperWithRadix(description?.content || "")}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">{wraperWithRadix(content)}</div>
      {medias && medias.length > 0 && <div>{medias.map(renderMediaBox)}</div>}
    </div>
  );
}
