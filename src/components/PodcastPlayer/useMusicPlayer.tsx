import { useEffect, useRef, useState } from "react";

export function secondsToMinutesAndSeconds(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time - minutes * 60);

  return {
      minutes,
      seconds
  }
}

export function numberToPercent(n: number, max_n: number) {
  const percentage = n == 0 ? 0 : (n / max_n) * 100;
  return percentage
}

export function percentOf(n: number, percentage: number) {
  return n * percentage / 100
}

export const useMusicPlayer = () => {
  const audio = useRef(document.createElement("audio"));

  const [isPlaying, setIsPlaying] = useState(false);
  const [src, setSrc] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [updatedTime, updateTime] = useState(0);
  const [maxTime, setMaxTime] = useState(0);

  useEffect(() => {
    audio.current.preload = "metadata";

    audio.current.ondurationchange = () => {
      setMaxTime(audio.current.duration);
    };

    audio.current.onended = () => {
      setIsPlaying(false);
    };

    audio.current.ontimeupdate = () => {
      setCurrentTime(audio.current.currentTime);
    };
  }, []);

  useEffect(() => {
    updateTime(0);

    if (src != "") {
      audio.current.src = src;
    }

    if (isPlaying) {
      audio.current.play();
    }
  }, [src]);

  useEffect(() => {
    audio.current.currentTime = updatedTime;
    setCurrentTime(updatedTime);
  }, [updatedTime]);

  useEffect(() => {
    if (isPlaying) {
      console.log('is main')
      audio.current.play();
    } else {
      audio.current.pause();
    }
  }, [isPlaying]);

  return {
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    currentTime,
    updateTime,
    maxTime,
    setSrc
  }
};
