import React, { useState } from "react";
import { toast } from "sonner";
import { Button, AlertDialog, Flex } from "@radix-ui/themes";
import { FolderResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useTranslation, Trans } from "react-i18next";

export interface DialogProps {
  folder?: FolderResItem | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const DialogDeleteFolder = React.memo((props: DialogProps) => {
  const { t } = useTranslation();
  const { folder, dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } = props;
  console.log("🚀 ~ DialogDeleteFolder ~ folder:", folder)

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
          toast.error(t("Ops! Something wrong~"), {
            description: t(err.message),
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
        <AlertDialog.Title>{t("Are you absolutely sure?")}</AlertDialog.Title>
        <AlertDialog.Description>
          <Trans
            i18nKey={"This action cannot be undone. This will permanently delete the data relates with"}
            components={{ bold: <strong /> }}
            values={{
              title: folder?.title,
            }}
          ></Trans>
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel onClick={() => handleCancel()}>
            <Button variant="soft" color="gray">
              {t("Cancel")}
            </Button>
          </AlertDialog.Cancel>
          <Button variant="solid" color="red" onClick={() => confirmDelete()}>
            {t("Delete folder")}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
});
