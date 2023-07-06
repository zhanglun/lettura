import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBearStore } from '@/hooks/useBearStore';

export const Theme = (props: any) => {
  const { className, styleConfig } = props;
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));
  const [ theme, setTheme ] = useState("light");

  function handleThemeChange(
    value: string
  ) {
    setTheme(value);

    store.updateUserConfig({
      ...store.userConfig,
      theme: value,
    });

    document.documentElement.dataset.colorScheme = value;
  }

  return <Select
    value={ store.userConfig.theme }
    onValueChange={ (v: string) => handleThemeChange(v) }
  >
    <SelectTrigger className="w-[180px]">
    <span className="
    flex items-center h-8 px-2 border border-border rounded-md bg-background text-foreground
    before:content-['•']
    before:text-[2rem]
    before:leading-8
    before:mr-2
    before:text-primary">Aa</span>
      <SelectValue placeholder="Font"/>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="system">System</SelectItem>
      <SelectItem value="light">
        <span className="border-border rounded-md bg-background text-foreground" data-color-scheme="light">Aa</span>
        Light</SelectItem>
      <SelectItem value="dark">
        <span className="border-border rounded-md bg-background text-foreground" data-color-scheme="dark">Aa</span>
        Dark</SelectItem>
      <SelectItem value="luckin">
        <span className="border-border rounded-md bg-background text-foreground" data-color-scheme="luckin">Aa</span>
        Luckin</SelectItem>
      <SelectItem value="starbucks">StarBucks</SelectItem>
      <SelectItem value="tims">Tims</SelectItem>
    </SelectContent>
  </Select>
}
