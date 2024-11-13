import React, { useCallback, useEffect, useRef, useState } from "react";
import { secondsToMinutesAndSeconds } from "./useMusicPlayer";
import clsx from "clsx";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/stores";
import { IconButton } from "@radix-ui/themes";

type TimeDisplayProps = {
  time: { minutes: number; seconds: number };
};

export const TimeDisplay = ({ time }: TimeDisplayProps) => {
  return (
    <div className="text-xs">
      {time.minutes}:{time.seconds.toString().padStart(2, "0")}
    </div>
  );
};

export interface PlayerProps {
  list: any[];
  onPlayingStatusChange: (status: boolean, current: any) => void;
}

const formatTime = (currentTime: any) => {
  const minutes = Math.floor(currentTime / 60);
  let seconds = Math.floor(currentTime % 60);

  const formatTime = minutes + ":" + (seconds >= 10 ? String(seconds) : "0" + (seconds % 60));

  return formatTime;
};

export const Player = React.forwardRef((props: PlayerProps, ref) => {
  const { list } = props;
  const store = useBearStore((state) => ({
    podcastPlayingStatus: state.podcastPlayingStatus,
    updatePodcastPlayingStatus: state.updatePodcastPlayingStatus,
  }));
  const [pause, setPause] = useState(true);
  const [currentTime, setCurrentTime] = useState({ minutes: 0, seconds: 0 });
  const [maxTime, setMaxTime] = useState({ minutes: 0, seconds: 0 });
  const [currentAudio, setCurrentAudio] = useState(0);
  const [currentMedia, setCurrentMedia] = useState<any>();
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const playHeadRef = useRef<HTMLDivElement | null>(null);
  const hoverPlayHeadRef = useRef<HTMLDivElement | null>(null);

  const onPlayButtonClick = () => {
    const currentSong = list[currentAudio];

    if (playerRef.current) {
      if (playerRef.current.readyState === 0) {
        setPause(true);

        playerRef.current.src = currentSong.mediaURL;
        playerRef.current.load();
      }

      if (pause) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }

      setPause(!pause);
    }
  };

  const prevSong = () => {
    setCurrentAudio((currentAudio + list.length - 1) % list.length);
    setCurrentMedia(list[(currentAudio + list.length - 1) % list.length]);
    updatePlayer(list[(currentAudio + list.length - 1) % list.length]);

    playerRef.current && playerRef.current.play();
  };

  const nextSong = () => {
    setCurrentAudio((currentAudio + 1) % list.length);
    setCurrentMedia(list[(currentAudio + 1) % list.length]);
    updatePlayer(list[(currentAudio + 1) % list.length]);

    playerRef.current && playerRef.current.play();
  };

  const timeUpdate = () => {
    const player = playerRef.current;
    const timeline = timelineRef.current;
    const playHead = playHeadRef.current;

    if (player && timeline && playHead) {
      const duration = player.duration;
      const playPercent = 100 * (player.currentTime / duration);

      playHead.style.width = playPercent + "%";
      setCurrentTime(secondsToMinutesAndSeconds(player.currentTime));
    }
  };

  const updatePlayer = (song: any) => {
    if (playerRef.current) {
      playerRef.current.src = song.mediaURL;
      playerRef.current.load();
    }
  };

  const changeCurrentTime = (e: any) => {
    const player = playerRef.current;
    const timeline = timelineRef.current;
    const playHead = playHeadRef.current;

    if (player && timeline && playHead) {
      const duration = player.duration;
      const playHeadRect: DOMRect = timeline.getBoundingClientRect();
      const left = playHeadRect.left;
      const userClickWidth = e.clientX - left;
      const userClickWidthInPercent = (userClickWidth * 100) / playHeadRect.width;

      playHead.style.width = userClickWidthInPercent + "%";
      player.currentTime = (duration * userClickWidthInPercent) / 100;

      console.log("🚀 ~ changeCurrentTime ~ player.currentTime:", player.currentTime);
    }
  };

  const hoverTimeLine = (e: any) => {
    const player = playerRef.current;
    const timeline = timelineRef.current;
    const playHead = playHeadRef.current;
    const hoverPlayHead = hoverPlayHeadRef.current;

    if (player && timeline && playHead && hoverPlayHead) {
      const duration = player.duration;
      const playHeadRect: DOMRect = timeline.getBoundingClientRect();
      const left = playHeadRect.left;
      const userClickWidth = e.clientX - left;
      const userClickWidthInPercent = (userClickWidth * 100) / playHeadRect.width;

      if (userClickWidthInPercent <= 100) {
        hoverPlayHead.style.width = userClickWidthInPercent + "%";
      }

      const time = (duration * userClickWidthInPercent) / 100;

      if (time >= 0 && time <= duration) {
        hoverPlayHead.dataset.content = formatTime(time);
      }
    }
  };

  const resetTimeLine = () => {
    if (hoverPlayHeadRef && hoverPlayHeadRef.current) {
      hoverPlayHeadRef.current.style.width = 0 + "";
    }
  };

  const receiveNewRecord = useCallback(
    (record: any) => {
      console.log("%c Line:154 🍅 record", "color:#3f7cff", record);
      if (list && list.length) {
        for (let i = 0; i < list.length; i++) {
          if (list[i].uuid === record.uuid) {
            setCurrentAudio(i);
            setCurrentMedia(list[i]);
            updatePlayer(list[i]);
            playerRef.current && playerRef.current.play();
            setPause(false);
          }
        }
      }
    },
    [list]
  );

  function renderPlayButton() {
    if (pause) {
      return <Play size={26} className="pl-[3px]" />;
    } else if (!pause) {
      return <Pause size={26} />;
    }
  }

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.addEventListener("timeupdate", timeUpdate, false);
      playerRef.current.addEventListener("ended", nextSong, false);
    }

    if (timelineRef.current) {
      timelineRef.current.addEventListener("click", changeCurrentTime, false);
      timelineRef.current.addEventListener("mousemove", hoverTimeLine, false);
      timelineRef.current.addEventListener("mouseout", resetTimeLine, false);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.removeEventListener("timeupdate", timeUpdate, false);
        playerRef.current.removeEventListener("ended", nextSong, false);
      }

      if (timelineRef.current) {
        timelineRef.current.removeEventListener("click", changeCurrentTime, false);
        timelineRef.current.removeEventListener("mousemove", hoverTimeLine, false);
        timelineRef.current.removeEventListener("mouseout", resetTimeLine, false);
      }
    };
  }, []);

  useEffect(() => {
    // reset currentAudio and currentMedia
    if (currentMedia) {
      const idx = list.findIndex((_) => _.id === currentMedia.id);
      setCurrentAudio(idx);
    } else {
      setPause(true);
      setCurrentAudio(0);
      setCurrentMedia(list[0]);
    }

    const sub = busChannel.on("addMediaAndPlay", (record) => {
      receiveNewRecord(record);
    });

    return () => {
      sub();
    };
  }, [list]);

  useEffect(() => {
    props.onPlayingStatusChange(!pause, list[currentAudio]);
  }, [pause, currentAudio]);

  useEffect(() => {
    store.updatePodcastPlayingStatus(!pause);
  }, [pause]);

  return (
    <div className="m-auto w-full">
      <div className="bg-muted before:bg-muted relative m-auto w-full rounded-sm pt-[100%] shadow-md before:absolute before:left-0 before:top-0 before:h-full before:w-full before:content-['']">
        {list[currentAudio]?.thumbnail && (
          <img alt="uri" src={list[currentAudio]?.thumbnail} className="absolute left-0 top-0 rounded-md" />
        )}
      </div>
      <div>
        <div className="mt-4 text-center">{list[currentAudio]?.title}</div>
        <div className="text-muted-foreground my-1 text-center text-sm">{list[currentAudio]?.feed_title}</div>
      </div>
      <div className="my-3 flex justify-center">
        <div className="bg-[var(--gray-3)] w-full rounded-md">
          <audio ref={playerRef} preload="true">
            <source src={list[currentAudio]?.mediaURL} />
            Your browser does not support the audio element.
          </audio>
          <div className="m-3 mt-4 flex gap-2">
            <TimeDisplay time={currentTime} />
            <div
              ref={timelineRef}
              id="timeline"
              className="bg-[var(--gray-6)] group relative m-auto h-1 w-full cursor-pointer rounded-md"
            >
              <div
                ref={playHeadRef}
                id="playhead"
                className="bg-[var(--gray-12)] relative z-[2] h-1 w-0 rounded-md"
              ></div>
              <div
                ref={hoverPlayHeadRef}
                className={clsx(
                  "absolute top-0 z-[1] h-1 w-0 rounded-md bg-slate-600 opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100 group-hover:before:opacity-100 group-hover:after:opacity-100",
                  "before:opacity-1 before:absolute before:-right-[23px] before:-top-[30px] before:z-10 before:block before:rounded-md before:bg-slate-800 before:p-1 before:text-center before:text-white before:content-[attr(data-content)]",
                  "after:absolute after:-right-[12px] after:-top-[8px] after:block after:rounded-md after:border-l-[8px_solid_transparent] after:border-r-[8px_solid_transparent] after:border-t-[8px_solid] after:border-t-slate-800 after:bg-slate-800 after:text-white after:opacity-0 after:content-[''] text-xs"
                )}
                data-content="0:00"
              ></div>
            </div>
            <TimeDisplay time={maxTime} />
          </div>
          <div className="flex items-center justify-center gap-8 py-4 pt-1">
            <IconButton radius="full" variant="ghost" color="gray">
              <SkipBack size={20} onClick={prevSong} />
            </IconButton>
            <IconButton
              className={clsx(
                "hover:scale-110",
                "transition-all"
              )}
              radius="full" variant="ghost" color="gray"
              size="3"
              onClick={onPlayButtonClick}
            >
              {renderPlayButton()}
            </IconButton>
            <IconButton radius="full" variant="ghost" color="gray">
              <SkipForward
                size={20}
                onClick={nextSong}
              />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
});
