import { TooltipBox } from "@/components/TooltipBox";
import { RouteConfig } from "@/config";
import Icon from "@/logo.svg";
import clsx from "clsx";
import { Gauge, HardDrive, HelpCircle, Search, Settings } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

type NavClass = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning: boolean;
};

export const SideNav = () => {
  function createActiveNavClass({ isActive }: NavClass) {
    return clsx(
      "flex items-center justify-center hover:bg-accent rounded-lg mx-2 p-2",
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
          <Gauge />
        </div>
        <div className="flex items-center justify-center">
          <NavLink to={RouteConfig.LOCAL} className={createActiveNavClass}>
            <HardDrive />
          </NavLink>
        </div>
        <div className="">
          <NavLink to={RouteConfig.SEARCH} className={createActiveNavClass}>
            <Search />
          </NavLink>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-center">
          <HelpCircle size={20} />
        </div>
        <div className="flex items-center justify-center">
          <TooltipBox content="Go to settings">
            <NavLink to={RouteConfig.SETTINGS} className={createActiveNavClass}>
              <Settings size={20} />
            </NavLink>
          </TooltipBox>
        </div>
      </div>
    </div>
  );
};
