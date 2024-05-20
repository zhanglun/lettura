import { useState } from "react";
import { Panel } from "../Panel";
import { Feed } from "./Feed";
import { FolderList } from "./FolderList";
import { SegmentedControl } from "@radix-ui/themes";

export const FeedManager = () => {
  const [currentSegmented, setCurrentSegmented] = useState("1");

  return (
    <Panel title="Content">
      <SegmentedControl.Root
        defaultValue="1"
        onValueChange={(v: string) => {
          setCurrentSegmented(v);
        }}
      >
        <SegmentedControl.Item value="1">Feeds</SegmentedControl.Item>
        <SegmentedControl.Item value="2">Folders</SegmentedControl.Item>
      </SegmentedControl.Root>
      <div>
        {currentSegmented === "1" && <Feed />}
        {currentSegmented === "2" && <FolderList />}
      </div>
    </Panel>
  );
};
