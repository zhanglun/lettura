import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { Play } from "lucide-react";
import { Player } from "./Player";
import { db } from "@/helpers/podcastDB";
import { PlayingBar } from "./PlayingBar";
import { busChannel } from "@/helpers/busChannel";

function createThumbnail(thumbnail: any) {
  return (
    <div className="bg-muted rounded-sm overflow-hidden">
      {thumbnail && <img alt="uri" src={thumbnail} className="max-w-[60px]" />}
    </div>
  );
}

export const PodcastPlayer = () => {
  const list =
    useLiveQuery(() => db.podcasts.toCollection().reverse().toArray()) || [];
  const [current, setCurrent] = useState<any>(null);
  const [playing, setPlaying] = useState<boolean>(false);

  function playRecord(record: any) {
    setCurrent(record);
    busChannel.emit("addMediaAndPlay", record);
  }

  function renderList() {
    return (list || []).map((_: any, idx: number) => {
      const { description, thumbnail } = _;

      return (
        <div
          className={clsx("group cursor-default rounded-lg", {
            "bg-accent": current?.uuid === _.uuid,
          })}
        >
          <div className="flex gap-3 p-3 rounded-sm hover:bg-accent">
            <div className="relative w-[60px] h-[60px]">
              {createThumbnail(thumbnail)}
              <div
                className={clsx(
                  "rounded-sm pl-[3px] flex items-center justify-center",
                  "text-primary-foreground bg-foreground/70 cursor-pointer",
                  "absolute top-0 left-0 bottom-0 right-0",
                  "group-hover:visible",
                  {
                    invisible: current?.uuid !== _.uuid,
                  }
                )}
                onClick={() => playRecord(_)}
              >
                {
                  <Play
                    fill={"currentColor"}
                    size={24}
                    className={clsx("group-hover:visible", {
                      block: current?.uuid === _.uuid && !playing,
                      hidden: current?.uuid === _.uuid && playing,
                    })}
                  />
                }

                {playing && current?.uuid === _.uuid && <PlayingBar />}
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

  function handlePlayingStatusChange(status: boolean, current: any) {
    console.log("%c Line:82 🍢 current", "color:#6ec1c2", current);
    console.log("%c Line:82 🍎 status", "color:#ea7e5c", status);
    setPlaying(status);
    setCurrent(current);
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
        <Player list={list} onPlayingStatusChange={handlePlayingStatusChange} />
      </div>
      <div className="overflow-auto">{renderList()}</div>
    </div>
  );
};
