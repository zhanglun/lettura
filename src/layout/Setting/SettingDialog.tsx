import { useState } from "react";
import { ChevronLeft, ChevronLeftCircle, Cog, Database, Keyboard, Palette, Rss } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { General } from "./General";
import { Appearance } from "./Appearance";
import { Shortcut } from "./ShortCut";
import clsx from "clsx";
import { FeedManager } from "./Content";
import { ImportAndExport } from "./ImportAndExport";

export interface SettingDialogProps {
  children: React.ReactNode;
}

export function SettingDialog({ children }: SettingDialogProps) {
  const [value, setValue] = useState("General");

  const updateValue = (value: string) => {
    setValue(value);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-[80%] p-0">
        <div className="flex-1 h-[94vh] flex flex-row bg-canvas rounded-md">
          <div className="w-[220px] px-4">
            <div className="max-w-[640px] m-auto">
              <h2 className="flex items-center gap-3 text-xl tracking-tight py-10 lg:px-4 group cursor-pointer">
                Settings
              </h2>
              <nav className="flex flex-col space-y-1">
                <div
                  className={clsx("sidebar-item", { "sidebar-item--active": value === "General" })}
                  onClick={() => setValue("General")}
                >
                  <Cog size={16} className="mr-3" />
                  General
                </div>
                <div
                  className={clsx("sidebar-item", { "sidebar-item--active": value === "Appearance" })}
                  onClick={() => setValue("Appearance")}
                >
                  <Palette size={16} className="mr-3" />
                  Appearance
                </div>
                <div
                  className={clsx("sidebar-item", { "sidebar-item--active": value === "Shortcut" })}
                  onClick={() => setValue("Shortcut")}
                >
                  <Keyboard size={16} className="mr-3" />
                  Shortcut
                </div>
                <div
                  className={clsx("sidebar-item", { "sidebar-item--active": value === "Content" })}
                  onClick={() => setValue("Content")}
                >
                  <Database size={16} className="mr-3" />
                  Content
                </div>
                <div
                  className={clsx("sidebar-item", { "sidebar-item--active": value === "Import/Export" })}
                  onClick={() => setValue("Import/Export")}
                >
                  <Rss size={16} className="mr-3" />
                  Import/Export
                </div>
              </nav>
            </div>
          </div>
          <div className="flex-1 flex justify-center overflow-auto m-2 rounded-md bg-panel">
            <div className="w-full">
              <Tabs value={value} orientation="vertical" onValueChange={updateValue} className="w-full p-8">
                <TabsContent value="General">
                  <General />
                </TabsContent>
                <TabsContent value="Appearance">
                  <Appearance />
                </TabsContent>
                <TabsContent value="Shortcut">
                  <Shortcut />
                </TabsContent>
                <TabsContent value="Content">
                  <FeedManager />
                </TabsContent>
                <TabsContent value="Import/Export">
                  <ImportAndExport />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
