import linkifyStr from "linkify-string";
import he from "he";
import { Button } from "@radix-ui/themes";
import { Podcast, db } from "@/helpers/podcastDB";
import { toast } from "sonner";
import { busChannel } from "@/helpers/busChannel";

export function PodcastAdapter(props: any) {
  const { article, content, medias } = props;

  console.log("content", content);
  console.log("medias", medias);
  console.log("article", article);

  function addToPlayListAndPlay(media: any) {
    const { description, content, thumbnails } = media;
    console.log("%c Line:17 🌶 media", "color:#ea7e5c", media);
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
      update_date: article.update_date,
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
      .catch('ConstraintError', () => {
        // already in the list, play it immediately
        busChannel.emit("addMediaAndPlay", record);
      });
  }

  function renderMediaBox(media: any) {
    const { description, content, thumbnails } = media;

    function renderContent() {
      return content.map((c: any) => {
        if (c.url && c.content_type.indexOf('audio/') === 0) {
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
        <div
          className="text-xs text-muted-foreground"
          style={{ whiteSpace: "pre-line" }}
          dangerouslySetInnerHTML={{
            __html: linkifyStr(
              he.decode((description?.content || "").replace(/<[^<>]+>/gi, ""))
            ),
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {medias && medias.length > 0 && <div>{medias.map(renderMediaBox)}</div>}
      <div
        key={article.uuid}
        className={"reading-content mt-6"}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      />
    </div>
  );
}
