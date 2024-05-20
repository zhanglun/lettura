import React, { useEffect, useRef, useState, ChangeEvent } from "react";
import * as dataAgent from "../../helpers/dataAgent";
import { Folder, Folder as Folder2, Loader2 } from "lucide-react";
import { FeedResItem } from "@/db";
import { useBearStore } from "@/stores";
import { Dialog, TextField, Tooltip, Button } from "@radix-ui/themes";

export interface AddFolderProps {
  action: "add" | "edit";
  folder?: FeedResItem | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const AddFolder = (props: AddFolderProps) => {
  const { action, folder } = props;
  const store = useBearStore((state) => ({
    getFeedList: state.getFeedList,
  }));
  const { dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } = props;
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handleCancel = () => {
    setConfirming(false);
    setName("");
    setDialogStatus(false);
    afterCancel();
  };

  const handleStatusChange = () => {
    handleCancel();
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
        store.getFeedList();
        afterConfirm();
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

  useEffect(() => {
    if (action === "add") {
      setTitle("Add Folder");
      setContent("Organize your subscribes");
    }
    if (action === "edit") {
      setContent("Edit Folder");
      setContent("Update your folder");
    }
  }, [action]);

  useEffect(() => {
    if (dialogStatus && inputRef && inputRef.current) {
      inputRef.current.focus();
    }

    if (action === "edit" && folder) {
      setName(folder.title);
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
        <Dialog.Title className="lex items-center" size="6" mt="2" mb="1">{title}</Dialog.Title>
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
              <Button variant="soft">Cancel</Button>
            </Dialog.Close>
            <Button onClick={handleSave} disabled={confirming || !name} loading={confirming}>
              {confirming ? "Saving" : "Save"}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
