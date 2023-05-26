import React, { useEffect, useState } from "react";
import { Panel, PanelSection } from "../Panel";
import { CustomizeStyle } from "@/components/SettingPanel/CustomizeStyle";
import { useBearStore } from "@/hooks/useBearStore";
// import { ColorTheme } from "./ColorTheme";

export const Appearance = () => {
  const store = useBearStore(state => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));

  return (
    <Panel
      title="Appearance"
      subTitle="Appearance
    Customize the appearance of the app. Automatically switch between day and night themes."
    >
      <PanelSection title="Style" subTitle="Set the view styles you want to use when you are reading.">
        <div className="mt-4">
          <CustomizeStyle className={ "w-[500px]" } styleConfig={ store.userConfig.customize_style }/>
        </div>
        <div className="mt-8 mb-4
          text-[var(--reading-p-font-size)]
          leading-[var(--reading-p-line-height)]
          font-[var(--reading-editable-typeface)]
        ">
          <p>人生得意须尽欢，莫使金樽空对月。</p>
          <p>Out, out, brief candle, life is but a walking shadow.</p>
        </div>
      </PanelSection>
      <PanelSection title="Theme" subTitle="Select the theme for the dashboard.">

      </PanelSection>
    </Panel>
  );
};
