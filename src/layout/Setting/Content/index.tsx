import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "../Panel";
import { Feed } from "./Feed";
import { FolderList } from "./FolderList";
import { Callout } from "@radix-ui/themes";
import { AlertCircleIcon } from "lucide-react";

export const FeedManager = () => {
  return (
    <Panel title="Content">
      <Callout.Root color="red" role="alert">
        <Callout.Icon>
          <AlertCircleIcon />
        </Callout.Icon>
        <Callout.Text>
          This feature will be removed in the future, and Letura will provide a better content management feature.{" "}
        </Callout.Text>
      </Callout.Root>
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
