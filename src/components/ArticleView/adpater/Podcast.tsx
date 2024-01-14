import linkifyStr from "linkify-string";
import he from "he";
import { Button } from "@/components/ui/button";

export function PodcastAdapter(props: any) {
  const { article, content, medias } = props;

  console.log("content", content);
  console.log("medias", medias);
  console.log("article", article);

  function addToPlayListAndPlay(media) {
    const { description, content, thumbnails } = media;
    const sourceURL = content[0].url;
    const thumbnail = thumbnails[0].image.uri;
    const text = description.content;

    // TODO: save data in client
  }

  function renderMediaBox(media: any) {
    const { description, content, thumbnails } = media;

    console.log("🚀 ~ renderMediaBox ~ media:", media)

    function renderContent() {
      return content.map((c: any) => {
        if (c.url) {
          return (
            <figure className="my-3">
              {/* <audio controls src={ c.url }></audio> */}
              <Button onClick={() => addToPlayListAndPlay(media)}>Play</Button>
            </figure>
          );
        }
      });
    }

    function renderThumbnails() {
      return thumbnails.map((t: any) => {
        if (t.image && t.image.uri) {
          return (
            <img src={ t.image.uri } alt={ t.image.uri } />
          );
        }
      });
    }

    return (
      <div className="reading-content">
        <div>
          { renderThumbnails() }
        </div>
        <div className="pb-6">{ renderContent() }</div>
        <div
          className="text-xs text-muted-foreground"
          style={ { whiteSpace: "pre-line" } }
          dangerouslySetInnerHTML={ {
            __html: linkifyStr(he.decode((description?.content || "").replace(/<[^<>]+>/ig, "")))
          } }
        />
      </div>
    );
  }

  return (
    <div>
      { medias && medias.length > 0 && <div>{ medias.map(renderMediaBox) }</div> }
      <div
        key={ article.uuid }
        className={ "reading-content mt-6" }
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={ {
          __html: content
        } }
      />
    </div>
  );
}
