import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import * as dataAgent from "../../helpers/dataAgent";
import { FolderResItem } from "@/db";
import { useBearStore } from "@/stores";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Button } from "@astryxdesign/core/Button";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { TextInput } from "@astryxdesign/core/TextInput";
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
  const store = useBearStore(
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
      p = dataAgent.createFolder(name);
    } else if (folder) {
      p = dataAgent.updateFolder(folder.uuid, name);
    }

    p.then((res) => {
      if (res[0] > 0) {
        store.getSubscribes();
        afterConfirm?.();
        handleCancel();
      }
    })
      .catch((err) => {
      })
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
      <Dialog
        isOpen={dialogStatus}
        onOpenChange={setDialogStatus}
        width={425}
      >
        <DialogHeader title={title} subtitle={content} />
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
      </Dialog>
    </>
  );
});
