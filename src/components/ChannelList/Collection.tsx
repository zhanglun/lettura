import React, { useEffect } from "react";
import classNames from "classnames";
import { Coffee, Haze } from "lucide-react";
import { useMatch, useNavigate } from "react-router-dom";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/hooks/useBearStore";
import * as dataAgent from "@/helpers/dataAgent";

export const Collection = () => {
  const isToday = useMatch(RouteConfig.TODAY);
  const isAll = useMatch(RouteConfig.ALL);
  const navigate = useNavigate();
  const store = useBearStore((state) => ({
    setChannel: state.setChannel,
  }));

  useEffect(() => {
    dataAgent.getCollectionMetas().then((res) => {
      console.log("%c Line:19 🍅 res", "color:#ed9ec7", res);
    });
  }, []);

  return (
    <div className="mt-[var(--app-toolbar-height)] pl-3">
      <div
        className={classNames(
          "w-full h-8 px-2 flex items-center rounded-md cursor-pointer mt-[2px] group",
          {
            "bg-primary text-primary-foreground": isToday,
          }
        )}
        onClick={() => {
          store.setChannel(null);
          navigate(RouteConfig.TODAY);
        }}
      >
        <span className="h-4 w-4 rounded mr-2">
          <Haze size={16} />
        </span>
        <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
          Today
        </span>
      </div>
      <div
        className={classNames(
          "w-full h-8 px-2 flex items-center rounded-md cursor-pointer mt-[2px] group",
          {
            "bg-primary text-primary-foreground": isAll,
          }
        )}
        onClick={() => {
          store.setChannel(null);
          navigate(RouteConfig.ALL);
        }}
      >
        <span className="h-4 w-4 rounded mr-2">
          <Coffee size={16} />
        </span>
        <span className="grow shrink basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
          All Items
        </span>
      </div>
    </div>
  );
};
