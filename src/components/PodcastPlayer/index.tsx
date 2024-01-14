import { useEffect, useState } from "react";
import clsx from "clsx";
import { Play, SkipBack, SkipForward } from "lucide-react";
import { Separator } from "../ui/separator";
import { list } from "./data";
import { createWavesurfer } from "./wave";

function createThumbnail(thumbnail: any) {
  return (
    <div className="bg-muted rounded-sm overflow-hidden">
      {thumbnail && <img alt="uri" src={thumbnail} className="max-w-[60px]" />}
    </div>
  );
}

export const PodcastPlayer = () => {
  const [current, setCurrent] = useState<any>(null);

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
    ].map((_) => {
      const { description, thumbnail } = _;

      return (
        <div className="group cursor-default">
          <Separator className="group-hover:invisible" />
          <div className="flex gap-3 p-3 rounded-sm hover:bg-accent">
            <div className="relative w-[60px] h-[60px]">
              {createThumbnail(thumbnail)}
              <div
                className={clsx(
                  "rounded-sm pl-[3px] flex items-center justify-center",
                  "text-primary-foreground bg-foreground/70 cursor-pointer",
                  "absolute top-0 left-0 bottom-0 right-0",
                  "invisible group-hover:visible"
                )}
                onClick={() => setCurrent(_)}
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

  useEffect(() => {
    if (current && current.sourceURL) {
      createWavesurfer(document.querySelector("#wave"), current.sourceURL);
    }
  }, [current]);

  return (
    <div
      className={clsx(
        "fixed right-0 top-0 bottom-0 z-10",
        "w-[360px] bg-background",
        "flex flex-col"
      )}
    >
      <div className="h-[420px] shrink-0">
        <div className="w-[160px] h-[160px] m-auto">
          <div className="bg-muted rounded-sm overflow-hidden">
            {current && (
              <img
                alt="uri"
                src={current.thumbnail}
                className="max-w-[160px]"
              />
            )}
          </div>
          <div id="wave"></div>
          <div className="flex gap-8 items-center justify-center py-3">
            <SkipBack size={18} />
            <div
              className={clsx(
                "w-[38px] h-[38px] pl-[3px]",
                "flex items-center justify-center",
                "rounded-full bg-foreground",
                "text-background"
              )}
            >
              <Play size={24} strokeWidth={1} />
            </div>
            <SkipForward size={18} />
          </div>
        </div>
      </div>
      <div className="overflow-auto">{renderList()}</div>
    </div>
  );
};
