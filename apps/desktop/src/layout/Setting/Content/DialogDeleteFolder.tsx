import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import React from "react";
import { useTranslation } from "react-i18next";
import type { FolderResItem } from "@/db";
import { busChannel } from "@/helpers/busChannel";
import { apiDelete } from "@/helpers/http";
import { toast } from "@/helpers/toast";

export interface DialogProps {
  folder?: FolderResItem | null;
  /** 成员订阅源数：>0 时描述里枚举爆炸半径（组删 = 级联删全部成员源与它们的文章） */
  feedCount?: number;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const DialogDeleteFolder = React.memo((props: DialogProps) => {
  const { t } = useTranslation();
  const { folder, feedCount, dialogStatus, setDialogStatus, afterConfirm, trigger } =
    props;

  const confirmDelete = () => {
    if (folder?.uuid) {
      apiDelete(`/folders/${folder.uuid}`)
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
        description={
          (feedCount ?? 0) > 0
            ? t("settings.folder_delete.with_sources", {
                title: folder?.title,
                count: feedCount,
              })
            : t(
                "This action cannot be undone. This will permanently delete the data related to {{title}}",
                { title: folder?.title },
              )
        }
        actionLabel={t("Delete folder")}
        onAction={confirmDelete}
      />
    </>
  );
});
