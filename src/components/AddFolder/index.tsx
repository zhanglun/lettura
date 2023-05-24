import React, { useEffect, useRef, useState, ChangeEvent } from "react";
import { useModal } from "../Modal/useModal";
import * as dataAgent from "../../helpers/dataAgent";
import { busChannel } from "../../helpers/busChannel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Icon } from "../Icon";
import { Folder as Folder2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Folder } from "@/db";

export interface AddFolderProps {
  action: "add" | "edit";
  folder?: Folder;
}

export const AddFolder = (props: AddFolderProps) => {
  const { action, folder } = props;
  const [showStatus, , , toggleModal] = useModal();
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handleCancel = () => {
    setConfirming(false);
    setName("");
    toggleModal();
  };

  const handleSave = async () => {
    setConfirming(true);

    dataAgent
      .createFolder(name)
      .then((res) => {
        if (res > 0) {
          busChannel.emit("getChannels");
          handleCancel();
        }
      })
      .finally(() => {
        setConfirming(false);
      });
  };

  useEffect(() => {
    if (showStatus && inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showStatus]);


  useEffect(() => {
    if(action === 'edit' && folder) {
      setName(folder.name);
    }
  }, [action]);

  return (
    <Dialog open={showStatus} onOpenChange={handleCancel}>
      <DialogTrigger asChild>
        <Icon>
          <Folder2 size={16} />
        </Icon>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            Create Folder
          </DialogTitle>
          <DialogDescription>Organize your subscribes</DialogDescription>
        </DialogHeader>
        <div className="pb-5">
          <div className="mb-3">
            <Input
              type="text"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleNameChange(e.target.value)
              }
              ref={inputRef}
            />
          </div>
          <div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
