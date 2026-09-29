import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import React from "react";
import { useTranslation } from "react-i18next";
import type { FolderResItem } from "@/db";
import { busChannel } from "@/helpers/busChannel";
import * as dataAgent from "@/helpers/dataAgent";
import { toast } from "@/helpers/toast";

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
  const { folder, dialogStatus, setDialogStatus, afterConfirm, trigger } =
    props;

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
          toast.error(t(err.message) || t("Ops! Something wrong~"));
        });
    }
  };

  return (
    <>
      {trigger}
      <AlertDialog
        isOpen={dialogStatus}
        onOpenChange={setDialogStatus}
        title={t("Are you absolutely sure?")}
        description={t(
          "This action cannot be undone. This will permanently delete the data related to {{title}}",
          { title: folder?.title },
        )}
        actionLabel={t("Delete folder")}
        onAction={confirmDelete}
      />
    </>
  );
});
