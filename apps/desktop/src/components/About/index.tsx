import React from "react";
import { open } from "@tauri-apps/plugin-shell";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Button } from "@astryxdesign/core/Button";
import { Link2, Shell } from "lucide-react";
import { useBearStore } from "@/stores";
import logo from "@/logo.svg";

export const DialogAboutApp = React.memo(() => {
  const store = useBearStore((state) => ({
    aboutDialogStatus: state.aboutDialogStatus,
    updateAboutDialogStatus: state.updateAboutDialogStatus,
    appMetadata: state.appMetadata,
  }));

  return (
    <Dialog
      isOpen={store.aboutDialogStatus}
      onOpenChange={store.updateAboutDialogStatus}
      width={300}
      padding={5}
    >
      <div className="flex flex-col gap-3">
        <img
          src={logo}
          className="w-[90px] h-[90px] m-auto"
          alt="Lettura Logo"
        />
        <div className="text-lg font-bold text-center">Lettura</div>
        <div className="mt-3 text-center text-sm">
          <div>Version: {store.appMetadata.version}</div>
          <div>OS: {store.appMetadata.OS}</div>
        </div>
        <div className="flex gap-5 justify-center text-sm">
          <Button
            size="sm"
            variant="ghost"
            icon={<Shell size={14} />}
            label="Home"
            onClick={() => open("https://zhanglun.github.io/lettura/")}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<Link2 size={14} />}
            label="GitHub"
            onClick={() => open("https://github.com/zhanglun/lettura")}
          />
        </div>
      </div>
    </Dialog>
  );
});
