import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import type { FolderResItem } from "@/db";
import { toast } from "@/helpers/toast";
import { useAppStore } from "@/stores";
import { apiPost } from "../../helpers/http";

export interface AddFolderProps {
  action: "add" | "edit";
  folder?: FolderResItem | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm?: () => void;
  afterCancel?: () => void;
}

export const AddFolder = React.memo((props: AddFolderProps) => {
  const { t } = useTranslation();
  const { action, folder } = props;
  const store = useAppStore(
    useShallow((state) => ({
      getSubscribes: state.getSubscribes,
    })),
  );
  const { dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } =
    props;
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handleCancel = () => {
    setConfirming(false);
    setName("");
    setDialogStatus(false);
    afterCancel?.();
  };

  const handleSave = async () => {
    if (!name) {
      return false;
    }

    setConfirming(true);

    let p: Promise<any> = Promise.resolve();

    if (action === "add") {
      p = apiPost<[number, string]>("/folders", { name });
    } else if (folder) {
      p = apiPost<[number, string]>(`/folders/${folder.uuid}`, { name });
    }

    p.then((res) => {
      if (res[0] > 0) {
        toast.success(
          action === "add" ? t("Folder created") : t("Folder updated"),
        );
        store.getSubscribes();
        afterConfirm?.();
        handleCancel();
      }
    })
      .catch((err) => {})
      .finally(() => {
        setConfirming(false);
      });
  };

  const title = useMemo(() => {
    return action === "edit" ? t("Edit folder") : t("Add folder");
  }, [action, t]);

  const content = useMemo(() => {
    return action === "edit"
      ? t("Update your folder")
      : t("Organize your subscribes");
  }, [action, t]);

  useEffect(() => {
    if (dialogStatus && inputRef && inputRef.current) {
      inputRef.current.focus();
    }

    if (action === "edit" && folder) {
      setName(folder.title);
    }
  }, [dialogStatus, action, folder]);

  return (
    <>
      {trigger && (
        <Tooltip content={title} placement="above">
          {trigger}
        </Tooltip>
      )}
      <Dialog isOpen={dialogStatus} onOpenChange={setDialogStatus} width={425}>
        <Layout
          header={<DialogHeader title={title} subtitle={content} />}
          content={
            <LayoutContent isScrollable={false}>
              <div className="py-3">
                <TextInput
                  label={title}
                  isLabelHidden
                  value={name}
                  onChange={(v) => handleNameChange(v)}
                  ref={inputRef}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="secondary"
                    label={t("Cancel")}
                    onClick={handleCancel}
                  />
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    isDisabled={confirming || !name}
                    isLoading={confirming}
                    label={confirming ? t("Saving") : t("Save")}
                  />
                </div>
              </div>
            </LayoutContent>
          }
        />
      </Dialog>
    </>
  );
});
