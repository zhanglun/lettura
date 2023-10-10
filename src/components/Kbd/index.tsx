import React from "react";
import { clsx } from "clsx";

export const Kbd = ({ val, className }: { val: string, className?: string }) => {
  return <kbd
    className={ clsx(`
              bg-[#fafafa]
              dark:bg-[hsla(232,15%,94%,0.12)]
              rounded-[0.1rem]
              shadow-[0_0.1rem_0_0.05rem_#b8b8b8,0_0.1rem_0_#b8b8b8,0_-0.1rem_0.2rem_#fff_inset]
              dark:shadow-[rgb(30,_32,_41)_0px_2px_0px_1px,_rgb(30,_32,_41)_0px_2px_0px_0px,_rgba(237,_238,_242,_0.2)_0px_-2px_4px_0px_inset]
              text-[#000000de]
              dark:text-[rgb(233,_235,_252)]
              inline-block
              text-[11px]
              px-1
              py-0
              align-text-top
              break-words
              `, className) }
  >
    { val }
  </kbd>
}
