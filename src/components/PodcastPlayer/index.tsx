import { Play } from "lucide-react";
import { Separator } from "../ui/separator";
import { list } from "./data";
import clsx from "clsx";

function createThumbnail(thumbnails: any) {
  const first = thumbnails[0];
  const uri = first && first.image && first.image.uri ? first.image.uri : "";

  return (
    <div className="bg-muted rounded-sm overflow-hidden">
      {uri && <img alt="uri" src={uri} className="max-w-[60px]" />}
    </div>
  );
}

export const PodcastPlayer = () => {
  function renderList() {
    return [
      ...list,
      ...list,
      ...list,
      ...list,
      ...list,
      ...list,
      ...list,
      ...list,
      ...list,
    ]
      .map((_) => {
        let media = [];

        try {
          media = JSON.parse(_.media_object);
        } catch (e) {
          media = [];
        }

        _.media = media[0];
        return _;
      })
      .map((_) => {
        const { description, content, thumbnails = [] } = _.media;

        console.log(thumbnails);

        return (
          <div className="group cursor-default">
            <Separator className="group-hover:invisible" />
            <div className="flex gap-3 p-3 rounded-sm hover:bg-accent">
              <div className="relative w-[60px] h-[60px]">
                {createThumbnail(thumbnails)}
                <div
                  className={clsx(
                    "rounded-sm pl-[3px] flex items-center justify-center",
                    "text-primary-foreground bg-foreground/70 cursor-pointer",
                    "absolute top-0 left-0 bottom-0 right-0",
                    "invisible group-hover:visible"
                  )}
                >
                  <Play fill={"currentColor"} size={24} />
                </div>
              </div>
              <div>
                <p className="font-bold text-sm mb-1">{_.title}</p>
                {/*<p className="mb-2 text-xs text-muted-foreground">这里是feed名称</p>*/}
                <p className="text-xs line-clamp-2 text-muted-foreground leading-normal">
                  {(description || _.description).replace(/(<([^>]+)>)/gi, "")}
                </p>
              </div>
            </div>
          </div>
        );
      });
  }

  return (
    <div
      className={clsx(
        "fixed right-0 top-0 bottom-0 z-10",
        "w-[360px] bg-background",
        "flex flex-col"
      )}
    >
      <div className="h-[420px] shrink-0"></div>
      <div className="overflow-auto">
        {renderList()}
      </div>
    </div>
  );
};
