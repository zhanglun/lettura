import React from "react";
import { toast } from "sonner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { FolderResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useTranslation } from "react-i18next";

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
  const {
    folder,
    dialogStatus,
    setDialogStatus,
    afterConfirm,
    trigger,
  } = props;

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

  return (
    <>
      {trigger}
      <AlertDialog
        isOpen={dialogStatus}
        onOpenChange={setDialogStatus}
        title={t("Are you absolutely sure?")}
        description={t(
          "This action cannot be undone. This will permanently delete the data relates with",
          { title: folder?.title },
        )}
        actionLabel={t("Delete folder")}
        onAction={confirmDelete}
      />
    </>
  );
});
