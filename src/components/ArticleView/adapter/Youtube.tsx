import { Heading, Text } from "@radix-ui/themes";
import { wraperWithRadix } from "../ContentRender";

export function YoutubeAdapter(props: any) {
  const { article, content, medias } = props;
  console.log("🚀 ~ file: Youtube.tsx:6 ~ YoutubeAdapter ~ article:", article);

  function createYoutubePageHeader() {
    return (
      <div className="mb-4">
        <Heading size="7">{article.title}</Heading>
      </div>
    );
  }

  function renderMediaBox(media: any) {
    const { description, content } = media;
    const text = description?.content;
    const lines = text?.split(/\n/) || [];
    const pElements = lines
      .map((line: string, index: number) => {
        const linkRegex = /(https?:\/\/)([\w\d./-]+)(\/[\w\d./-]*)?/;
        const linkMatch = line.match(linkRegex);
        if (linkMatch) {
          const url = linkMatch[0];
          const linkText = linkMatch[2] || url;
          return `<p key="${index}">${line.replace(
            linkRegex,
            `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
          )}</p>`;
        }
        return `<p key="${index}">${line}</p>`;
      })
      .join("");

    function renderContent() {
      return content.map((c: any) => {
        if (/youtube.com\/v/.test(c.url)) {
          const videoId = c.url.split("/").pop();
          return (
            <div className="relative">
              <div className="aspect-video bg-gray-200 animate-pulse" />
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                width="100%"
                height="360"
                className="absolute inset-0 w-full h-full"
                loading="lazy"
              />
            </div>
          );
        }
      });
    }

    return (
      <div>
        <div className="pb-6">{renderContent()}</div>
        <div>{wraperWithRadix(pElements || "")}</div>
      </div>
    );
  }

  return (
    <div className="w-[500px] m-auto py-20">
      {medias[0] && createYoutubePageHeader()}
      {medias && medias.length > 0 && <div>{medias.map(renderMediaBox)}</div>}
    </div>
  );
}
