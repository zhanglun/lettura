import React from "react";
import { Outlet } from "react-router-dom";
import { Cog, Database, Keyboard, Palette, Rss } from "lucide-react";
import { RouteConfig } from "../../config";
import { Link } from "@/components/SettingPanel/Link";
import { Separator } from "@/components/ui/separator";

function SettingPanel() {
  return (
    <div className="flex-1 hidden space-y-6 px-10 pt-14 md:block overflow-auto">
      <div className="space-y-0.5">
        <h2 className="flex items-center font-semibold text-2xl tracking-tight">
          Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 pb-16">
        <aside className="-mx-4 lg:w-1/6">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            <Link to={RouteConfig.SETTINGS_GENERAL}>
              <Cog size={16} className="mr-3" />
              General
            </Link>
            <Link to={RouteConfig.SETTINGS_APPEARANCE}>
              <Palette size={16} className="mr-3" />
              Appearance
            </Link>
            <Link to={RouteConfig.SETTINGS_SHORTCUT}>
              <Keyboard size={16} className="mr-3" />
              Shortcut
            </Link>
            <Link to={RouteConfig.SETTINGS_FEED_MANAGER}>
              <Database size={16} className="mr-3" />
              Content
            </Link>
            <Link to={RouteConfig.SETTINGS_IMPORT}>
              <Rss size={16} className="mr-3" />
              Import/Export
            </Link>
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-4xl w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export { SettingPanel };
