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
    <div className="bg-muted overflow-hidden rounded-sm">
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
    db.podcasts
      .delete(record.id)
      .then((res: any) => {
        console.log("%c Line:33 🍣 res", "color:#ed9ec7", res);
      })
      .catch((err: any) => {
        console.log("%c Line:35 🌰 err", "color:#f5ce50", err);
      });
  }

  function renderList() {
    return (list || []).map((_: any, idx: number) => {
      const { description, thumbnail } = _;

      return (
        <div
          className={clsx("group relative cursor-default rounded-md", {
            "bg-accent": current?.uuid === _.uuid,
          })}
        >
          <div className="hover:bg-accent flex gap-3 rounded-sm p-3">
            <div className="relative h-[60px] w-[60px]">
              {createThumbnail(thumbnail)}
              <div
                className={clsx(
                  "flex items-center justify-center rounded-sm pl-[3px]",
                  "text-primary-foreground bg-foreground/70 cursor-pointer",
                  "absolute bottom-0 left-0 right-0 top-0",
                  "group-hover:visible",
                  {
                    invisible: current?.uuid !== _.uuid,
                  },
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
            <div className="shrink grow basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap">
              <p className="mb-1 shrink grow basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold">
                {_.title}
              </p>
              <p className="text-muted-foreground mb-2 text-xs">
                {_.feed_title}
              </p>
              <p className="text-muted-foreground line-clamp-2 text-xs leading-normal">
                {(description || _.description).replace(/(<([^>]+)>)/gi, "")}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 top-0 flex items-center justify-center bg-gradient-to-l from-[bg-panel] to-transparent p-2 opacity-0 transition-all group-hover:opacity-100">
            <Trash2
              size={18}
              strokeWidth={1.5}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => removePodcast(_)}
            />
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
        "bg-panel flex h-[calc(100vh_-theme(padding.4))] w-[320px] flex-col shadow rounded-md p-2"
      )}
    >
      <Player list={list} onPlayingStatusChange={handlePlayingStatusChange} />
      <div className="flex-1 overflow-auto">{renderList()}</div>
    </div>
  );
};
