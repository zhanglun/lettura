import React from "react";
import { Panel, PanelSection } from "../Panel";

export const KeyBox = (props: { name: string; description: string }) => {
  return (
    <>
      <kbd>{props.name}</kbd>
      <span>{props.description}</span>
    </>
  );
};

export const Shortcut = () => {
  return (
    <Panel title="Shortcut">
      <PanelSection title="">
        <ul>
          <li>
            <KeyBox name="n" description="View next article" />
          </li>
          <li>
            <kbd>N</kbd> or <kbd>Shift + n</kbd> View previous article
          </li>
          <li>
            <kbd>j</kbd> Scroll down
          </li>
          <li>
            <kbd>k</kbd> Scroll up
          </li>
          <li>
            <kbd>o</kbd> Open link in browser
          </li>
        </ul>
      </PanelSection>
    </Panel>
  );
};
