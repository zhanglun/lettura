import { Cog, Database, Keyboard, Palette, Rss, Settings, Waypoints } from "lucide-react";
import { Dialog, Heading, IconButton, Kbd, Tooltip } from "@radix-ui/themes";
import { useHotkeys } from "react-hotkeys-hook";
import { General } from "./General";
import { Appearance } from "./Appearance";
import { Shortcut } from "./ShortCut";
import { ProxySetting } from "./Proxy";
import { ImportAndExport } from "./ImportAndExport";
import { useEffect, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useBearStore } from "@/stores";
import { SettingTabKey } from "@/typing";
import "./index.css";
import clsx from "clsx";

interface SettingPageProps {
  children: React.ReactNode;
}

export function SettingPage({ children }: SettingPageProps) {
  const store = useBearStore((state) => ({
    settingDialogStatus: state.settingDialogStatus,
    updateSettingDialogStatus: state.updateSettingDialogStatus,
  }));

  const [activeTab, setActiveTab] = useState<SettingTabKey>(SettingTabKey.GENERAL);

  useHotkeys("s", () => {
    store.updateSettingDialogStatus(true);
  });

  const handleStatusChange = (status: boolean) => {
    store.updateSettingDialogStatus(status);

    if (!status) {
      setActiveTab(SettingTabKey.GENERAL);
    }
  };

  return (
    <Dialog.Root open={store.settingDialogStatus} onOpenChange={handleStatusChange}>
      <Tooltip
        content={
          <>
            Go to settings <Kbd className="ml-3">s</Kbd>
          </>
        }
        side="right"
        className="w-full"
      >
        <Dialog.Trigger>{children}</Dialog.Trigger>
      </Tooltip>

      <Dialog.Content className="max-w-[900px] p-0">
        <Dialog.Close>
          <IconButton className="absolute right-5 top-5" variant="ghost">
            <Cross2Icon />
          </IconButton>
        </Dialog.Close>
        <div className="flex flex-row h-[600px]">
          <div className="w-[220px] border-r bg-canvas">
            <div className="flex items-center gap-2 px-5 py-4">
              <Settings className="w-5 h-5" />
              <Heading size="5">Settings</Heading>
            </div>
            <nav className="py-3 px-2 space-y-2">
              <button
                onClick={() => setActiveTab(SettingTabKey.GENERAL)}
                className={clsx("setting-tab-item", {
                  "setting-tab-item--active": activeTab === SettingTabKey.GENERAL,
                })}
              >
                <Cog className="w-4 h-4" />
                General
              </button>
              <button
                onClick={() => setActiveTab(SettingTabKey.APPEARANCE)}
                className={clsx("setting-tab-item", {
                  "setting-tab-item--active": activeTab === SettingTabKey.APPEARANCE,
                })}
              >
                <Palette className="w-4 h-4" />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab(SettingTabKey.PROXY)}
                className={clsx("setting-tab-item", {
                  "setting-tab-item--active": activeTab === SettingTabKey.PROXY,
                })}
              >
                <Database className="w-4 h-4" />
                Proxy
              </button>
              <button
                onClick={() => setActiveTab(SettingTabKey.SHORTCUTS)}
                className={clsx("setting-tab-item", {
                  "setting-tab-item--active": activeTab === SettingTabKey.SHORTCUTS,
                })}
              >
                <Keyboard className="w-4 h-4" />
                Shortcuts
              </button>
              <button
                onClick={() => setActiveTab(SettingTabKey.IMPORTANDEXPORT)}
                className={clsx("setting-tab-item", {
                  "setting-tab-item--active": activeTab === SettingTabKey.IMPORTANDEXPORT,
                })}
              >
                <Waypoints className="w-4 h-4" />
                Import & Export
              </button>
            </nav>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === SettingTabKey.GENERAL && <General />}
            {activeTab === SettingTabKey.APPEARANCE && <Appearance />}
            {activeTab === SettingTabKey.PROXY && <ProxySetting />}
            {activeTab === SettingTabKey.SHORTCUTS && <Shortcut />}
            {activeTab === SettingTabKey.IMPORTANDEXPORT && <ImportAndExport />}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
