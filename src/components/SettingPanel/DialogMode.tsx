import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useModal } from "../Modal/useModal";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Icon } from "../Icon";
import { ArrowLeft, Loader2, Plus, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SettingPanel } from "./index";

export const SettingDialog = (props: any) => {
  const { showStatus, toggleModal } = useModal();

  const handleCancel = () => {
    toggleModal();
  };

  const handleStatusChange = () => {
    handleCancel();
  };

  return (
    <Dialog open={showStatus} onOpenChange={handleStatusChange}>
      <DialogTrigger asChild>
        <Icon>
          <Settings size={16} />
        </Icon>
      </DialogTrigger>
      <DialogContent className="w-[90%]">
        <SettingPanel></SettingPanel>
      </DialogContent>
    </Dialog>
  );
};
