import { Outlet, useNavigate } from "react-router-dom";
import { Cog, Database, Keyboard, Palette, Rss, Waypoints } from "lucide-react";
import { RouteConfig } from "../../config";
import { Link } from "@/layout/Setting/Link";
import { Dialog, Heading, Kbd, Tabs, Text, Box, Tooltip } from "@radix-ui/themes";
import { useModal } from "@/components/Modal/useModal";
import { useHotkeys } from "react-hotkeys-hook";
import { General } from "./General";
import { Appearance } from "./Appearance";
import { Shortcut } from "./ShortCut";
import { ImportAndExport } from "./ImportAndExport";

interface SettingPageProps {
  children: React.ReactNode;
}

export function SettingPage({ children }: SettingPageProps) {
  const [showStatus, , showModal, , toggleModal] = useModal();

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

      <Dialog.Content className="max-w-[900px]">
        <div className="flex flex-row">
          <div className="w-[220px] px-5 border-r">
            <Heading size="6" className="flex items-center group cursor-pointer pt-5 pb-4 px-2">
              Settings
            </Heading>
            <Tabs.Root defaultValue="General" orientation="vertical">
              <Tabs.List>
                <Tabs.Trigger value="General">General</Tabs.Trigger>
                <Tabs.Trigger value="Appearance">Appearance</Tabs.Trigger>
                <Tabs.Trigger value="Proxy">Proxy</Tabs.Trigger>
                <Tabs.Trigger value="Shortcuts">Shortcuts</Tabs.Trigger>
                <Tabs.Trigger value="Import & Export">Import & Export</Tabs.Trigger>
              </Tabs.List>

              <Box pt="3">
                <Tabs.Content value="General">
                  <General />
                </Tabs.Content>

                <Tabs.Content value="Appearance">
                  <Appearance />
                </Tabs.Content>
                <Tabs.Content value="Proxy">
                  <Proxy />
                </Tabs.Content>
                <Tabs.Content value="Shortcuts">
                  <Shortcut />
                </Tabs.Content>

                <Tabs.Content value="Import & Export">
                  <ImportAndExport />
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </div>
          {/* <div className="flex-1 pt-16 flex justify-center overflow-auto rounded-md px-5">
            <div className="max-w-[980px] w-full"></div>
          </div> */}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
