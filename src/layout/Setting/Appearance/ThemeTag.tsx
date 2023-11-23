import React, { useEffect, useState } from "react";

export interface ThemeTagProps {
  scheme: string;
  name: string;
}

export const ThemeTag = (props: ThemeTagProps) => {
  const { scheme = "system", name } = props;
  const [theme, setTheme] = useState("");

  useEffect(() => {
    if (scheme === "system") {
      setTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
      );
    } else {
      setTheme(scheme);
    }
  }, [scheme]);

  return (
    <div className="grid grid-flow-col gap-2 items-center">
      <span
        className="
        flex items-center h-6 px-1 border border-border rounded-md bg-background text-foreground
        before:content-['']
        before:block
        before:w-2
        before:h-2
        before:rounded-full
        before:mr-1
        before:bg-primary
        before:text-primary"
        data-color-scheme={theme}
      >
        Aa
      </span>
      <span>{name}</span>
    </div>
  );
};
