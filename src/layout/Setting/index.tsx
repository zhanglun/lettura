import { Cog, Database, Keyboard, Palette, Rss, Settings, Waypoints } from "lucide-react";
import { Dialog, Heading, IconButton, Kbd, Tooltip } from "@radix-ui/themes";
import { useModal } from "@/components/Modal/useModal";
import { useHotkeys } from "react-hotkeys-hook";
import { General } from "./General";
import { Appearance } from "./Appearance";
import { Shortcut } from "./ShortCut";
import { ProxySetting } from "./Proxy";
import { ImportAndExport } from "./ImportAndExport";
import { useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";

interface SettingPageProps {
  children: React.ReactNode;
}

export function SettingPage({ children }: SettingPageProps) {
  const [showStatus, , showModal, , toggleModal] = useModal();
  const [activeTab, setActiveTab] = useState("general");

  useHotkeys("s", () => {
    showModal();
  });

  return (
    <Dialog.Root open={showStatus} onOpenChange={toggleModal}>
      <Dialog.Trigger asChild>
        <Tooltip
          content={
            <>
              Go to settings <Kbd className="ml-3">s</Kbd>
            </>
          }
          side="right"
        >
          {children}
        </Tooltip>
      </Dialog.Trigger>

      <Dialog.Content className="max-w-[900px] p-0">
        <Dialog.Close asChild>
          <IconButton className="absolute right-5 top-5" variant="ghost">
            <Cross2Icon />
          </IconButton>
        </Dialog.Close>
        <div className="flex flex-row h-[600px]">
          <div className="w-[220px] border-r border-[#e5e7eb] dark:border-[#2d2d2d]">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e5e7eb] dark:border-[#2d2d2d]">
              <Settings className="w-5 h-5" />
              <Heading size="4">Settings</Heading>
            </div>
            <nav className="py-4">
              <button
                onClick={() => setActiveTab("general")}
                className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                  activeTab === "general"
                    ? "bg-[#f3f4f6] dark:bg-[#2d2d2d] text-[#0f172a] dark:text-white"
                    : "text-[#6b7280] hover:bg-[#f9fafb] dark:hover:bg-[#1d1d1d]"
                }`}
              >
                <Cog className="w-4 h-4" />
                General
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                  activeTab === "appearance"
                    ? "bg-[#f3f4f6] dark:bg-[#2d2d2d] text-[#0f172a] dark:text-white"
                    : "text-[#6b7280] hover:bg-[#f9fafb] dark:hover:bg-[#1d1d1d]"
                }`}
              >
                <Palette className="w-4 h-4" />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab("proxy")}
                className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                  activeTab === "proxy"
                    ? "bg-[#f3f4f6] dark:bg-[#2d2d2d] text-[#0f172a] dark:text-white"
                    : "text-[#6b7280] hover:bg-[#f9fafb] dark:hover:bg-[#1d1d1d]"
                }`}
              >
                <Database className="w-4 h-4" />
                Proxy
              </button>
              <button
                onClick={() => setActiveTab("shortcuts")}
                className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                  activeTab === "shortcuts"
                    ? "bg-[#f3f4f6] dark:bg-[#2d2d2d] text-[#0f172a] dark:text-white"
                    : "text-[#6b7280] hover:bg-[#f9fafb] dark:hover:bg-[#1d1d1d]"
                }`}
              >
                <Keyboard className="w-4 h-4" />
                Shortcuts
              </button>
              <button
                onClick={() => setActiveTab("import-export")}
                className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                  activeTab === "import-export"
                    ? "bg-[#f3f4f6] dark:bg-[#2d2d2d] text-[#0f172a] dark:text-white"
                    : "text-[#6b7280] hover:bg-[#f9fafb] dark:hover:bg-[#1d1d1d]"
                }`}
              >
                <Waypoints className="w-4 h-4" />
                Import & Export
              </button>
            </nav>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === "general" && <General />}
            {activeTab === "appearance" && <Appearance />}
            {activeTab === "proxy" && <ProxySetting />}
            {activeTab === "shortcuts" && <Shortcut />}
            {activeTab === "import-export" && <ImportAndExport />}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
