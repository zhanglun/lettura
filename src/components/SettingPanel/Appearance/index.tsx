import React, { useEffect, useState } from "react";
import { Panel, PanelSection } from "../Panel";
import {CustomizeStyle} from "@/components/SettingPanel/CustomizeStyle";
import {useBearStore} from "@/hooks/useBearStore";
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
      <PanelSection title="Font">

      </PanelSection>
      <PanelSection title="Style">
        <div>
          <CustomizeStyle className={"w-[500px]"} styleConfig={store.userConfig.customize_style} />
        </div>
      </PanelSection>
      <PanelSection title="Theme" subTitle="Select the theme for the dashboard.">

      </PanelSection>
    </Panel>
  );
};
