import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from 'dexie-react-hooks';
import clsx from "clsx";
import { Play, SkipBack, SkipForward } from "lucide-react";
import { Separator } from "../ui/separator";
import { Player } from "./Player";
import { db } from "@/helpers/podcastDB";

function createThumbnail(thumbnail: any) {
  return (
    <div className="bg-muted rounded-sm overflow-hidden">
      {thumbnail && <img alt="uri" src={thumbnail} className="max-w-[60px]" />}
    </div>
  );
}

export const PodcastPlayer = () => {
  const list = useLiveQuery(() => db.podcasts.toCollection().sortBy('add_date')) || [];
  console.log("%c Line:19 🍋 list", "color:#ed9ec7", list);
  const [current, setCurrent] = useState<number>(0);

  function renderList() {
    return (list || []).map((_: any, idx: number) => {
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
                onClick={() => setCurrent(idx)}
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
      <div className="shrink-0">
        <Player list={list} current={current} />
      </div>
      <div className="overflow-auto">{renderList()}</div>
    </div>
  );
};
