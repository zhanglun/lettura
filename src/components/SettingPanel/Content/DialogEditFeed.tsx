import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Channel } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useToast } from "@/components/ui/use-toast";
import Dayjs from "dayjs";
import { Separator } from "@/components/ui/separator";
import { Link2 } from "lucide-react";
import { useBearStore } from "@/stores";

export interface DialogEditFeedProps {
  feed: Channel | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const DialogEditFeed = React.memo((props: DialogEditFeedProps) => {
  const { toast } = useToast();
  const store = useBearStore((state) => ({
    setFeedContextMenuTarget: state.setFeedContextMenuTarget,
  }));
  const {
    feed,
    dialogStatus,
    setDialogStatus,
    afterConfirm,
    afterCancel,
    trigger,
  } = props;
  const confirmUnsubscribe = () => {
    if (feed?.uuid) {
      dataAgent
        .deleteChannel(feed.uuid)
        .then(() => {
          busChannel.emit("getChannels");
          afterConfirm();
          setDialogStatus(false);
        })
        .catch((err) => {
          toast({
            variant: "destructive",
            title: "Ops! Something wrong~",
            description: err.message,
            duration: 2000,
          });
        });
    }
  };

  const handleCancel = (status: boolean) => {
    if (!status) {
      store.setFeedContextMenuTarget(null);
      setDialogStatus(false);
      afterCancel();
    }
  };

  return (
    <Dialog open={dialogStatus} onOpenChange={handleCancel}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
      <DialogContent>
        <div className="py-6">
          <header className="flex items-center">
            <div>
              <h3 className="text-2xl font-semibold leading-none tracking-tight text-foreground">
                {feed?.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feed?.description}
              </p>
              <div className="mt-3 space-y-0.5">
                <a
                  className="text-sm text-muted-foreground hover:text-primary hover:underline flex items-top space-x-1"
                  href={feed?.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{feed?.link}</span>
                </a>
                <p className="text-sm text-muted-foreground">
                  Date subscribed:{" "}
                  {Dayjs(feed?.create_date).format("YYYY-MM-DD HH:mm")}
                </p>
              </div>
            </div>
          </header>
          <Separator className="my-4" />
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Feed Address</p>
            <a
              className="text-sm font-normal leading-snug text-muted-foreground hover:text-primary hover:underline flex items-center space-x-1"
              href={feed?.feed_url}
              target="_blank"
              rel="noreferrer"
            >
              <Link2 className="w-4 h-4" />
              <span>{feed?.feed_url}</span>
            </a>
          </div>
        </div>
        {/*<DialogFooter>*/}
        {/*  <DialogCancel onClick={() => handleCancel()}>Cancel<DialogCancel>*/}
        {/*  <Button*/}
        {/*    className="text-destructive-foreground bg-destructive hover:bg-[hsl(var(--destructive)/0.9)]"*/}
        {/*    onClick={() => confirmUnsubscribe()}*/}
        {/*  >*/}
        {/*    Unsubscribe*/}
        {/*  </Button>*/}
        {/*<DialogFooter>*/}
      </DialogContent>
    </Dialog>
  );
});
