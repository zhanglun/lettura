import React, { useEffect, useState } from "react";
import styles from "../setting.module.scss";
import { Panel, PanelSection } from "../Panel";
// import { ColorTheme } from "./ColorTheme";

export const Appearance = () => {
  return (
    <Panel
      title="Appearance"
      subTitle="Appearance
    Customize the appearance of the app. Automatically switch between day and night themes."
    >
      <PanelSection title="Font">

      </PanelSection>
      <PanelSection title="Theme" subTitle="Select the theme for the dashboard.">

      </PanelSection>
    </Panel>
  );
};
