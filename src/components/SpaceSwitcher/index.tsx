"use client";

import * as React from "react";

import { cn } from "@/helpers/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpaceSwitcherProps {
  isCollapsed: boolean;
  spaces: {
    label: string;
    route: string;
    icon: React.ReactNode;
  }[];
}

export function SpaceSwitcher({ isCollapsed, spaces }: SpaceSwitcherProps) {
  const [selectedSpace, setSelectedSpace] = React.useState<string>(
    spaces[0].route
  );

  return (
    <Select defaultValue={selectedSpace} onValueChange={setSelectedSpace}>
      <SelectTrigger
        className={cn(
          "h-8 w-[140px] border-none focus:ring-0 focus:ring-transparent text-sm flex items-center gap-1 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
        )}
        aria-label="Select Space"
      >
        <SelectValue placeholder="Select an Space">
          {spaces.find((space) => space.route === selectedSpace)?.icon}
          <span className={cn("", isCollapsed && "hidden")}>
            {spaces.find((space) => space.route === selectedSpace)?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {spaces.map((space) => (
          <SelectItem key={space.route} value={space.route}>
            <div className="flex items-center text-xs gap-2 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              {space.icon}
              {space.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
