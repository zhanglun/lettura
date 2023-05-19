import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "../Panel";
import { Feed } from "./Feed";
import { FolderList } from "./FolderList";

export const FeedManager = () => {
  return (
    <Panel title="Content">
      <Tabs defaultValue="1">
        <TabsList className="grid w-[240px] grid-cols-2">
          <TabsTrigger value="1">Feeds</TabsTrigger>
          <TabsTrigger value="2">Folders</TabsTrigger>
        </TabsList>
        <TabsContent value="1">
          <Feed />
        </TabsContent>
        <TabsContent value={"2"}>
          <FolderList />
        </TabsContent>
      </Tabs>
    </Panel>
  );
};
