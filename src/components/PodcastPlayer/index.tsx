import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { Play, Trash2 } from "lucide-react";
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

  function removePodcast(record: any) {
    console.log("%c Line:30 🥥 record", "color:#7f2b82", record);
    db.podcasts.delete(record.id).then((res) => {
      console.log("%c Line:33 🍣 res", "color:#ed9ec7", res);
    }).catch((err) => {
      console.log("%c Line:35 🌰 err", "color:#f5ce50", err);
    })
  }

  function renderList() {
    return (list || []).map((_: any, idx: number) => {
      const { description, thumbnail } = _;

      return (
        <div
          className={clsx("group cursor-default rounded-lg relative", {
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
              <p className="mb-2 text-xs text-muted-foreground">
                {_.feed_title}
              </p>
              <p className="text-xs line-clamp-2 text-muted-foreground leading-normal">
                {(description || _.description).replace(/(<([^>]+)>)/gi, "")}
              </p>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 p-2 flex items-center justify-center bg-gradient-to-l from-zinc-200 to-transparent opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 size={18} strokeWidth={1.5} className="text-muted-foreground hover:text-foreground" onClick={() => removePodcast(_)}/>
          </div>
        </div>
      );
    });
  }

  function handlePlayingStatusChange(status: boolean, current: any) {
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
