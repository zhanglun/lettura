import React, { useState } from "react";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { FeedResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { toast } from "sonner";

export interface DialogProps {
  feed: FeedResItem | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const DialogUnsubscribeFeed = React.memo((props: DialogProps) => {
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
          toast.error("Ops! Something wrong~", {
            description: err.message,
            duration: 2000,
          });
        });
    }
  };

  const handleCancel = () => {
    afterCancel();
  };

  return (
    <AlertDialog.Root open={dialogStatus} onOpenChange={setDialogStatus}>
      {trigger && <AlertDialog.Trigger>{trigger}</AlertDialog.Trigger>}
      <AlertDialog.Content>
        <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
        <AlertDialog.Description>
          This action cannot be undone. This will permanently delete the data relates with
          {feed && <span className="text-primary font-bold ml-1">{feed?.title}</span>}
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel onClick={() => handleCancel()}>Cancel</AlertDialog.Cancel>
          <Button
            className="text-destructive-foreground bg-destructive hover:bg-[hsl(var(--destructive)/0.9)]"
            onClick={() => confirmUnsubscribe()}
          >
            Unsubscribe
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
});
