import React, { useState } from "react";
import { toast } from "sonner";
import { Button, AlertDialog, Flex } from "@radix-ui/themes";
import { Channel, FeedResItem, FolderResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";

export interface DialogProps {
  folder?: FolderResItem | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const DialogDeleteFolder = React.memo((props: DialogProps) => {
  const { folder, dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } = props;

  const confirmDelete = () => {
    if (folder?.uuid) {
      dataAgent
        .deleteFolder(folder.uuid)
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
          {folder && <span className="text-primary font-bold ml-1">{folder?.name}</span>}
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel onClick={() => handleCancel()}>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <Button variant="solid" color="red" onClick={() => confirmDelete()}>
            Delete folder
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
});
