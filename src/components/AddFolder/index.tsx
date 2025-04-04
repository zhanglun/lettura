import React, { useEffect, useRef, useState, useMemo, ChangeEvent } from "react";
import * as dataAgent from "../../helpers/dataAgent";
import { FolderResItem } from "@/db";
import { useBearStore } from "@/stores";
import { Dialog, TextField, Tooltip, Button } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";

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
  console.log("%c Line:19 🥪 folder", "color:#ed9ec7", props);
  const store = useBearStore(
    useShallow((state) => ({
      getSubscribes: state.getSubscribes,
    }))
  );
  const { dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } = props;
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
    afterCancel && afterCancel();
  };

  const handleSave = async () => {
    if (!name) {
      return false;
    }

    setConfirming(true);

    let p: Promise<any> = Promise.resolve();

    if (action === "add") {
      p = dataAgent.createFolder(name);
    } else if (folder) {
      p = dataAgent.updateFolder(folder.uuid, name);
    }

    p.then((res) => {
      console.log("🚀 ~ file: index.tsx:59 ~ p.then ~ res:", res);
      if (res[0] > 0) {
        store.getSubscribes();
        afterConfirm && afterConfirm();
        handleCancel();
      }
    })
      .catch((err) => {
        console.log("🚀 ~ file: index.tsx:66 ~ p.then ~ err:", err);
      })
      .finally(() => {
        setConfirming(false);
      });
  };

  const title = useMemo(() => {
    if (action === "add") {
      return t("Add folder");
    }
    if (action === "edit") {
      return t("Edit folder");
    }
  }, [action]);

  const content = useMemo(() => {
    if (action === "add") {
      return t("Organize your subscribes");
    }
    if (action === "edit") {
      return t("Update your folder");
    }
  }, [action]);

  useEffect(() => {
    if (dialogStatus && inputRef && inputRef.current) {
      inputRef.current.focus();
    }

    if (action === "edit" && folder) {
      // @ts-ignore
      setName(folder.name || folder.title);
    }
  }, [dialogStatus]);

  return (
    <Dialog.Root open={dialogStatus} onOpenChange={setDialogStatus}>
      {trigger && (
        <Tooltip content={title}>
          <Dialog.Trigger>{trigger}</Dialog.Trigger>
        </Tooltip>
      )}
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Title className="lex items-center" size="6" mt="2" mb="1">
          {title}
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          {content}
        </Dialog.Description>
        <div className="py-3">
          <TextField.Root
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
            ref={inputRef}
          ></TextField.Root>
          <div className="flex justify-end gap-3 mt-4">
            <Dialog.Close>
              <Button variant="soft">{t("Cancel")}</Button>
            </Dialog.Close>
            <Button onClick={handleSave} disabled={confirming || !name} loading={confirming}>
              {confirming ? t("Saving") : t("Save")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
});
