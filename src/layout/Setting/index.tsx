import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronLeftCircle,
  Cog,
  Database,
  Keyboard,
  Palette,
  Rss,
} from "lucide-react";
import { RouteConfig } from "../../config";
import { Link } from "@/layout/Setting/Link";
import { Icon } from "@/components/Icon";

export function SettingPage() {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex-1 max-h-full flex lg:flex-row flex-col bg-">
      <div className="lg:w-[220px] w-full px-6">
        <div className="max-w-[640px] m-auto">
          <h2 className="flex items-center gap-3 text-xl tracking-tight py-10 lg:px-4 group cursor-pointer">
            <Icon onClick={goBack} className="text-muted-foreground group-hover:text-foreground">
              <ChevronLeft />
            </Icon>
            Settings
          </h2>
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
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
      <div className="flex-1 pt-16 flex justify-center overflow-auto h-[calc(100vh-theme(margin.4))] m-2 rounded-md bg-white">
        <div className="max-w-[640px] w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
