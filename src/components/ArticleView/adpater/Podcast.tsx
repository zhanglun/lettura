import linkifyStr from "linkify-string";
import he from "he";

export function PodcastAdapter(props: any) {
  const { article, content, medias } = props;

  console.log("content", content);
  console.log("medias", medias);
  console.log("article", article);

  function renderMediaBox(media: any) {
    const { description, content, thumbnails } = media;

    function renderContent() {
      return content.map((c: any) => {
        if (c.url) {
          return (
            <figure>
              <audio controls src={ c.url }></audio>
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
