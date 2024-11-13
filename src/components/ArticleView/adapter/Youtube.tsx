import { useEffect, useState } from "react";
import linkifyStr from "linkify-string";

export function YoutubeAdapter(props: any) {
  const { content, medias } = props;

  function renderMediaBox(media: any) {
    const { description, content, thumbnails } = media;
    console.log("%c Line:67 🥓 media", "color:#f5ce50", media);

    function renderContent() {
      return content.map((c: any) => {
        if (/youtube.com\/v/.test(c.url)) {
          const videoId = c.url.split("/").pop();
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              width="640"
              height="360"
            />
          );
        }
      });
    }

    return (
      <div className="reading-content">
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
    </div>
  );
}
