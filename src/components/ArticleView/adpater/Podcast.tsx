import { useEffect, useState } from "react";
import linkifyStr from "linkify-string";
import clsx from "clsx";

export function PodcastAdapter(props: any) {
  const { article, content, medias } = props;

  function renderMediaBox(media: any) {
    const { description, content, thumbnails } = media;
    console.log("%c Line:67 🥓 media", "color:#f5ce50", media);

    function renderContent() {
      return content.map((c: any) => {
        if (c.url) {
          return (
            <figure>
              <audio controls src={c.url}></audio>
            </figure>
          );
        }
      });
    }

    function renderThumbnails () {
      return thumbnails.map((t: any) => {
        if (t.image && t.image.uri) {
          return (
            <img src={t.image.uri} alt={t.image.uri} />
          );
        }
      });
    }

    return (
      <div className="reading-content">
        <div>
          {renderThumbnails()}
        </div>
        <div className="pb-6">{renderContent()}</div>
        <div
          style={{ whiteSpace: "pre-line" }}
          dangerouslySetInnerHTML={{
            __html: linkifyStr(description?.content || ""),
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
        className={clsx("reading-content", "text-detail-paragraph")}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      />
    </div>
  );
}
