import { TooltipBox } from "@/components/TooltipBox";
import { RouteConfig } from "@/config";
import Icon from "@/logo.svg";
import clsx from "clsx";
import { Gauge, HelpCircle, Rss, Search, Settings } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import freshrssSVG from './freshrss.svg';
console.log("%c Line:8 🍔 freshrssSVG", "color:#3f7cff", freshrssSVG);

type NavClass = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning: boolean;
};

export const SideNav = () => {
  function createActiveNavClass({ isActive }: NavClass) {
    return clsx(
      "flex items-center justify-center hover:bg-accent rounded-lg mx-2 p-1",
      {
        "hover:bg-primary bg-primary text-primary-foreground": isActive,
      }
    );
  }

  return (
    <div className="shrink-0 w-14 h-full border-r flex flex-col justify-between">
      <div className="p-2">
        <img className="w-10 h-10" src={Icon} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center">
          <Gauge strokeWidth={1} />
        </div>
        <div className="flex items-center justify-center">
          <TooltipBox content="Local feeds" side="right">
            <NavLink to={RouteConfig.LOCAL} className={createActiveNavClass}>
              <Rss strokeWidth={1} />
            </NavLink>
          </TooltipBox>
        </div>
        {/* <div className="flex items-center justify-center">
          <TooltipBox content="FreshRSS" side="right">
            <NavLink to={RouteConfig.SERVICE_FRESHRSS} className={createActiveNavClass}>
              <img src={freshrssSVG} className="w-10"/>
            </NavLink>
          </TooltipBox>
        </div> */}
        <div className="flex items-center justify-center">
          <TooltipBox content="Search content" side="right">
            <NavLink to={RouteConfig.SEARCH} className={createActiveNavClass}>
              <Search strokeWidth={1} />
            </NavLink>
          </TooltipBox>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-3 py-3">
        <div className="flex items-center justify-center">
          <HelpCircle size={20} strokeWidth={1} />
        </div>
        <div className="flex items-center justify-center">
          <TooltipBox content="Go to settings" side="right">
            <NavLink
              to={RouteConfig.SETTINGS_GENERAL}
              className={createActiveNavClass}
            >
              <Settings size={20} strokeWidth={1} />
            </NavLink>
          </TooltipBox>
        </div>
      </div>
    </div>
  );
};
