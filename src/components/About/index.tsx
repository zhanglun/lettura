import React from "react";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";
import Dayjs from "dayjs";
import { Separator, Dialog, Heading } from "@radix-ui/themes";
import { Link2 } from "lucide-react";
import { useBearStore } from "@/stores";
import logo from "@/logo.svg";

export const DialogAboutApp = React.memo(() => {
  const store = useBearStore((state) => ({
    aboutDialogStatus: state.aboutDialogStatus,
    updateAboutDialogStatus: state.updateAboutDialogStatus,
  }));

  return (
    <Dialog.Root open={store.aboutDialogStatus} onOpenChange={store.updateAboutDialogStatus}>
      <Dialog.Content className="flex flex-col gap-3">
        <img src={logo} className="w-[90px] h-[90px] m-auto" />
        <div className="text-lg font-bold text-center">Lettura</div>
        {/*<DialogFooter>*/}
        {/*  <DialogCancel onClick={() => handleCancel()}>Cancel<DialogCancel>*/}
        {/*  <Button*/}
        {/*    className="text-destructive-foreground bg-destructive hover:bg-[hsl(var(--destructive)/0.9)]"*/}
        {/*    onClick={() => confirmUnsubscribe()}*/}
        {/*  >*/}
        {/*    Unsubscribe*/}
        {/*  </Button>*/}
        {/*<DialogFooter>*/}
      </Dialog.Content>
    </Dialog.Root>
  );
});
