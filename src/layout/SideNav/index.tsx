import { RouteConfig } from "@/config";
import Icon from "@/logo.svg";
import { Gauge, HardDrive, HelpCircle, Search, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export const SideNav = () => {
  return (
    <div className="shrink-0 w-14 h-full border-r flex flex-col justify-between">
      <div className="p-2">
        <img className="w-10 h-10" src={Icon} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center hover:bg-accent rounded-lg mx-2 p-2">
          <Gauge />
        </div>
        <div className="flex items-center justify-center hover:bg-accent rounded-lg mx-2 p-2">
          <Link to={RouteConfig.LOCAL}>
            <HardDrive />
          </Link>
        </div>
        <div className="flex items-center justify-center hover:bg-accent rounded-lg mx-2 p-2">
          <Link to={RouteConfig.SEARCH}>
            <Search />
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-center">
          <HelpCircle size={20} />
        </div>
        <div className="flex items-center justify-center">
          <Link to={RouteConfig.SETTINGS}>
            <Settings size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
};
