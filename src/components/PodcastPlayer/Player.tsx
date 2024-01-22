import React, { useEffect, useRef, useState } from "react";
import { secondsToMinutesAndSeconds } from "./useMusicPlayer";
import clsx from "clsx";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

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
  current: any;
  onPlayingStatusChange: (status: boolean) => void;
}

const formatTime = (currentTime: any) => {
  const minutes = Math.floor(currentTime / 60);
  let seconds = Math.floor(currentTime % 60);

  const formatTime =
    minutes + ":" + (seconds >= 10 ? String(seconds) : "0" + (seconds % 60));

  return formatTime;
};

export const Player = React.forwardRef((props: PlayerProps, ref) => {
  const { list } = props;
  const [pause, setPause] = useState(true);

  const [currentTime, setCurrentTime] = useState({ minutes: 0, seconds: 0 });
  const [maxTime, setMaxTime] = useState({ minutes: 0, seconds: 0 });
  const [currentAudio, setCurrentAudio] = useState(0);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const playHeadRef = useRef<HTMLDivElement | null>(null);
  const hoverPlayHeadRef = useRef<HTMLDivElement | null>(null);

  const onPlayButtonClick = () => {
    const currentSong = list[currentAudio];
    const audio = new Audio(currentSong.mediaURL);

    if (pause) {
      playerRef.current && playerRef.current.play();
    } else {
      playerRef.current && playerRef.current.pause();
    }

    setPause(!pause);
  };

  const prevSong = () => {
    setCurrentAudio((cur) => (cur + list.length - 1) % list.length);
    updatePlayer(list[currentAudio]);

    if (pause) {
      playerRef.current && playerRef.current.play();
    }
  };

  const nextSong = () => {
    setCurrentAudio((cur) => (cur + 1) % list.length);
    updatePlayer(list[currentAudio]);

    if (pause) {
      playerRef.current && playerRef.current.play();
    }
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
    const audio = new Audio(song.audio);

    playerRef?.current?.load();
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
      const userClickWidthInPercent =
        (userClickWidth * 100) / playHeadRect.width;

      playHead.style.width = userClickWidthInPercent + "%";
      player.currentTime = (duration * userClickWidthInPercent) / 100;

      console.log(
        "🚀 ~ changeCurrentTime ~ player.currentTime:",
        player.currentTime
      );
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
      const userClickWidthInPercent =
        (userClickWidth * 100) / playHeadRect.width;

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

  useEffect(() => {
    playerRef.current &&
      playerRef.current.addEventListener("timeupdate", timeUpdate, false);
    playerRef.current &&
      playerRef.current.addEventListener("ended", nextSong, false);
    timelineRef.current &&
      timelineRef.current.addEventListener("click", changeCurrentTime, false);
    timelineRef.current &&
      timelineRef.current.addEventListener("mousemove", hoverTimeLine, false);
    timelineRef.current &&
      timelineRef.current.addEventListener("mouseout", resetTimeLine, false);

    return () => {
      playerRef.current &&
        playerRef.current.removeEventListener("timeupdate", timeUpdate, false);
      playerRef.current &&
        playerRef.current.removeEventListener("ended", nextSong, false);
      timelineRef.current &&
        timelineRef.current.removeEventListener(
          "click",
          changeCurrentTime,
          false
        );
      timelineRef.current &&
        timelineRef.current.removeEventListener(
          "mousemove",
          hoverTimeLine,
          false
        );
      timelineRef.current &&
        timelineRef.current.removeEventListener(
          "mouseout",
          resetTimeLine,
          false
        );
    };
  }, []);

  useEffect(() => {
    console.log("%c Line:207 🥥 props.current", "color:#465975", props.current);
    if (list && list.length) {
      for(let i = 0; i<list.length; i++) {
        if (list[i].uuid === props.current.uuid) {
          setCurrentAudio(i);
          updatePlayer(list[i]);
          playerRef.current && playerRef.current.play();
          setPause(false);
        }
      }
    }
  }, [props.current]);

  useEffect(() => {
    props.onPlayingStatusChange(!pause);
  }, [pause])

  return (
    <div className="pt-4 px-4 m-auto">
      <div className="m-auto bg-muted rounded-2xl shadow-lg">
        <img
          alt="uri"
          src={list[currentAudio]?.thumbnail}
          className="rounded-2xl"
        />
      </div>
      <div className="my-4 flex justify-center">
        <div className="w-full bg-card rounded-2xl">
          <audio ref={playerRef}>
            <source src={list[currentAudio]?.mediaURL} />
            Your browser does not support the audio element.
          </audio>
          <div className="flex gap-2 mx-4 my-4">
            <TimeDisplay time={currentTime} />
            <div
              ref={timelineRef}
              id="timeline"
              className="relative m-auto w-full h-1 bg-secondary rounded-md cursor-pointer group"
            >
              <div
                ref={playHeadRef}
                id="playhead"
                className="relative z-[2] w-0 h-1 rounded-md bg-primary"
              ></div>
              <div
                ref={hoverPlayHeadRef}
                className={clsx(
                  "absolute z-[1] top-0 w-0 h-1 rounded-md bg-slate-600 transition-opacity duration-300 ease-in opacity-0 group-hover:after:opacity-100 group-hover:before:opacity-100 group-hover:opacity-100",
                  "before:content-[attr(data-content)] before:opacity-1 before:block before:absolute before:-top-[40px] before:-right-[23px] before:z-10 before:p-1 before:text-center before:bg-slate-800 before:text-white before:rounded-md",
                  "after:content-[''] after:opacity-0 after:block after:absolute after:-top-[8px] after:-right-[8px] after:border-t-[8px_solid] after:border-t-slate-800 after:border-l-[8px_solid_transparent] after:border-r-[8px_solid_transparent] after:bg-slate-800 after:text-white after:rounded-md"
                )}
                data-content="0:00"
              ></div>
            </div>
            <TimeDisplay time={maxTime} />
          </div>
          <div className="flex gap-8 items-center justify-center py-3">
            <SkipBack
              size={20}
              onClick={prevSong}
              className="cursor-pointer text-accent-foreground hover:text-accent-foreground/80 transition-all"
            />
            <div
              className={clsx(
                "w-[42px] h-[42px]",
                "flex items-center justify-center",
                "rounded-full bg-foreground",
                "text-background",
                "cursor-pointer",
                "hover:scale-110",
                "transition-all"
              )}
              onClick={onPlayButtonClick}
            >
              {pause && <Play size={26} strokeWidth={1} className="pl-[3px]" />}
              {/* {!pause && <PlayingBar />} */}
              {!pause && <Pause size={26} strokeWidth={1} />}
            </div>
            <SkipForward
              size={20}
              onClick={nextSong}
              className="cursor-pointer text-accent-foreground hover:text-accent-foreground/80 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
