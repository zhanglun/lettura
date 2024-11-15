import { Button } from "@radix-ui/themes";
import { Podcast, db } from "@/helpers/podcastDB";
import { toast } from "sonner";
import { busChannel } from "@/helpers/busChannel";
import { wraperWithRadix } from "../ContentRender";
import { ArticleResItem } from "@/db";

export interface PodcastAdapter {
  article: ArticleResItem;
  content: string;
  medias: any;
}
export function PodcastAdapter(props: PodcastAdapter) {
  const { article, content, medias } = props;

  console.log("content", content);
  console.log("medias", medias);
  console.log("article", article);

  function addToPlayListAndPlay(media: any) {
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

    db.podcasts
      .add(record)
      .then((res: any) => {
        console.log("%c Line:27 🌮 res", "color:#f5ce50", res);
        toast.success("start playing");
        setTimeout(() => {
          busChannel.emit("addMediaAndPlay", record);
        }, 50);
      })
      .catch("ConstraintError", () => {
        // already in the list, play it immediately
        busChannel.emit("addMediaAndPlay", record);
      });
  }

  function renderMediaBox(media: any) {
    const { description, content, thumbnails } = media;

    function renderContent() {
      return content.map((c: any) => {
        if (c.url && c.content_type.indexOf("audio/") === 0) {
          return (
            <figure className="my-3">
              <Button onClick={() => addToPlayListAndPlay(media)}>Play</Button>
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
