import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBearStore } from "@/hooks/useBearStore";
import { ThemeTag } from "./ThemeTag";

export const Theme = (props: any) => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));

  function handleThemeChange(value: string) {
    store.updateUserConfig({
      ...store.userConfig,
      theme: value,
    });

    document.documentElement.dataset.colorScheme = value;
  }

  return (
    <Select
      value={store.userConfig.theme}
      onValueChange={(v: string) => handleThemeChange(v)}
    >
      <SelectTrigger className="w-[220px] h-9">
        <SelectValue placeholder="Font" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="system">
          <ThemeTag scheme="system" name="System preference" />
        </SelectItem>
        <SelectItem value="light">
          <ThemeTag scheme="light" name="Light" />
        </SelectItem>
        <SelectItem value="dark">
          <ThemeTag scheme="dark" name="Dark" />
        </SelectItem>
        <SelectItem value="luckin">
          <ThemeTag scheme="luckin" name="Luckin" />
        </SelectItem>
        <SelectItem value="starbucks">
          <ThemeTag scheme="starbucks" name="StarBucks" />
        </SelectItem>
        <SelectItem value="tims">
          <ThemeTag scheme="tims" name="Tims" />
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
