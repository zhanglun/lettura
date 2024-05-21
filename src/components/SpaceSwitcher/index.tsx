"use client";

import * as React from "react";

import { cn } from "@/helpers/cn";
import { Select } from "@radix-ui/themes";

interface SpaceSwitcherProps {
  isCollapsed: boolean;
  spaces: {
    label: string;
    route: string;
    icon?: React.ReactNode;
  }[];
}

export function SpaceSwitcher({ isCollapsed, spaces }: SpaceSwitcherProps) {
  const [selectedSpace, setSelectedSpace] = React.useState<string>(spaces[0].route);

  return (
    <Select.Root defaultValue={selectedSpace} onValueChange={setSelectedSpace}>
      <Select.Trigger
        className={cn(
          "h-8 w-[120px] border-none",
          isCollapsed && "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
        )}
        aria-label="Select Space"
      >
        <div>
          {spaces.find((space) => space.route === selectedSpace)?.icon}
          <span className={cn("", isCollapsed && "hidden")}>
            {spaces.find((space) => space.route === selectedSpace)?.label}
          </span>
        </div>
      </Select.Trigger>
      <Select.Content>
        {spaces.map((space) => (
          <Select.Item key={space.route} value={space.route}>
            <div className="flex items-center text-xs gap-2 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              {space.icon}
              {space.label}
            </div>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
