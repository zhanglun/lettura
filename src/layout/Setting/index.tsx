import { Outlet, useNavigate } from "react-router-dom";
import { Cog, Database, Keyboard, Palette, Rss } from "lucide-react";
import { RouteConfig } from "../../config";
import { Link } from "@/layout/Setting/Link";
import { Heading } from "@radix-ui/themes";

export function SettingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 max-h-full flex flex-row bg-canvas p-2 pl-0">
      <div className="bg-panel flex w-full h-full flex-1 overflow-hidden rounded-md border">
        <div className="w-[220px] px-5 border-r">
          <Heading size="6" className="flex items-center group cursor-pointer pt-5 pb-4 px-2">
            Settings
          </Heading>
          <div className="max-w-[640px] m-auto">
            <nav className="flex flex-col space-x-0 space-y-1">
              <Link to={RouteConfig.SETTINGS_GENERAL}>
                <Cog size={16} className="mr-3" />
                General
              </Link>
              <Link to={RouteConfig.SETTINGS_APPEARANCE}>
                <span className="flex items-center">
                  <Palette size={16} className="mr-3" />
                  Appearance
                </span>
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
                <span className="flex items-center">
                  <Rss size={16} className="mr-3" />
                  Import/Export
                </span>
              </Link>
            </nav>
          </div>
        </div>
        <div className="flex-1 pt-16 flex justify-center overflow-auto rounded-md px-5">
          <div className="max-w-[980px] w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
