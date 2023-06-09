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
  return  <Select
  value={ theme }
  onValueChange={ (v: string) => handleThemeChange(v) }
>
  <SelectTrigger className="w-[180px] h-8">
    <SelectValue placeholder="Font"/>
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="system">System</SelectItem>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="Dark">Dark</SelectItem>
    <SelectItem value="luckin">Luckin</SelectItem>
    <SelectItem value="starbucks">StarBucks</SelectItem>
    <SelectItem value="tims">Tims</SelectItem>
  </SelectContent>
</Select>
}
