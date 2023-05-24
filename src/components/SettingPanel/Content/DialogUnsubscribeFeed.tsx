import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Channel } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useToast } from "@/components/ui/use-toast";

export interface DialogProps {
  feed: Channel | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const DialogUnsubscribeFeed = React.memo((props: DialogProps) => {
  const { toast } = useToast();
  const { feed, dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } = props;

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
            duration: 2,
          });
        });
    }
  };

  const handleCancel = () => {
    afterCancel();
  }

  return (
    <AlertDialog
      open={dialogStatus}
      onOpenChange={setDialogStatus}
    >
      {trigger && <AlertDialogTrigger>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the data
            relates with
            {feed && (
              <span className="text-primary font-bold ml-1">{feed?.title}</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleCancel()}>Cancel</AlertDialogCancel>
          <Button
            className="text-destructive-foreground bg-destructive hover:bg-[hsl(var(--destructive)/0.9)]"
            onClick={() => confirmUnsubscribe()}
          >
            Unsubscribe
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
