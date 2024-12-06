import React from "react";
import { open } from "@tauri-apps/api/shell";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";
import Dayjs from "dayjs";
import { Separator, Dialog, Heading, IconButton, Button } from "@radix-ui/themes";
import { Github, Link2, Shell } from "lucide-react";
import { useBearStore } from "@/stores";
import logo from "@/logo.svg";

export const DialogAboutApp = React.memo(() => {
  const store = useBearStore((state) => ({
    aboutDialogStatus: state.aboutDialogStatus,
    updateAboutDialogStatus: state.updateAboutDialogStatus,
    appMetadata: state.appMetadata,
  }));

  return (
    <Dialog.Root open={store.aboutDialogStatus} onOpenChange={store.updateAboutDialogStatus}>
      <Dialog.Content className="w-[300px] flex flex-col gap-3">
        <img src={logo} className="w-[90px] h-[90px] m-auto" />
        <div className="text-lg font-bold text-center">Lettura</div>
        <div className="mt-3 text-center text-sm">
          <div>Version: {store.appMetadata.version}</div>
          <div>OS: {store.appMetadata.OS}</div>
        </div>
        <div className="flex gap-5 justify-center text-sm">
          <Button size="2" variant="ghost" onClick={() => open("https://zhanglun.github.io/lettura/")}>
            <Shell size={14} /> Home
          </Button>
          <Button size="2" variant="ghost" onClick={() => open("https://github.com/zhanglun/lettura")}>
            <Github size={14} /> GitHub
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
});
