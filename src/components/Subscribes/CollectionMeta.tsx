import React, { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useMatch, useNavigate } from "react-router-dom";
import {
  Coffee,
  Haze,
  FolderPlus,
  CheckCheck,
  Pencil,
  Trash2,
  Rss,
  Image,
  ExternalLink,
  BellOff,
  FileText,
  Link,
  Link2,
  Star,
} from "lucide-react";
import classNames from "classnames";
import { listen } from "@tauri-apps/api/event";
import { RouteConfig } from "@/config";
import { FeedResItem, FolderResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/stores";
import { AddFolder } from "../AddFolder";
import { ContextMenu } from "@radix-ui/themes";
import { DialogUnsubscribeFeed } from "@/layout/Setting/Content/DialogUnsubscribeFeed";
import { useModal } from "../Modal/useModal";
import { open } from "@tauri-apps/api/shell";
import { DialogEditFeed } from "@/layout/Setting/Content/DialogEditFeed";
import { useQuery } from "@/helpers/parseXML";
import { ListContainer } from "./ListContainer";
import { copyText } from "@/helpers/copyText";
import { toast } from "sonner";
import { DialogDeleteFolder } from "@/layout/Setting/Content/DialogDeleteFolder";
import { loadFeed } from "@/hooks/useLoadFeed";
import clsx from "clsx";
import { useScrollTop } from "@/hooks/useScrollTop";
import { useShallow } from "zustand/react/shallow";

type NavClass = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning: boolean;
};

const CollectionMeta = (): JSX.Element => {
  console.log("CollectionMeta rendered");
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      setFeed: state.setFeed,
      setViewMeta: state.setViewMeta,

      collectionMeta: state.collectionMeta,
      initCollectionMetas: state.initCollectionMetas,
    }))
  );

  useEffect(() => {
    store.initCollectionMetas();
  }, []);

  return (
    <>
      <h2 className="mb-2 mt-6 px-2 font-semibold tracking-tight">Collections</h2>
      <div>
        <div
          onClick={() => {
            store.setFeed(null);
            store.setViewMeta({
              title: "Today",
              isToday: true,
              isAll: false,
            });
          }}
        >
          <NavLink
            to={RouteConfig.LOCAL_TODAY}
            className={({ isActive }) => {
              return clsx("sidebar-item", isActive ? "sidebar-item--active" : "");
            }}
          >
            <Haze size={16} />
            <span className="shrink grow basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              Today
            </span>
            {store.collectionMeta.today.unread > 0 && (
              <span
                className={classNames(
                  "-mr-1 h-4 min-w-[1rem] px-1 flex items-center justify-center text-sm font-medium leading-4 rounded"
                )}
              >
                {store.collectionMeta.today.unread}
              </span>
            )}
          </NavLink>
        </div>
        <div
          onClick={() => {
            store.setFeed(null);
            store.setViewMeta({
              title: "All Items",
              isToday: false,
              isAll: true,
            });
          }}
        >
          <NavLink
            to={RouteConfig.LOCAL_ALL}
            className={({ isActive }) => {
              return clsx("sidebar-item", isActive ? "sidebar-item--active" : "");
            }}
          >
            <Coffee size={16} />
            <span className="shrink grow basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              All Items
            </span>
            {store.collectionMeta.total.unread > 0 && (
              <span
                className={classNames(
                  "-mr-1 h-4 min-w-[1rem] px-1 flex items-center justify-center text-sm font-medium leading-4 rounded"
                )}
              >
                {store.collectionMeta.total.unread}
              </span>
            )}
          </NavLink>
        </div>
        <div
          onClick={() => {
            store.setFeed(null);
            store.setViewMeta({
              title: "Starred",
              isToday: false,
              isAll: false,
              isStarred: true,
            });
            navigate(RouteConfig.LOCAL_STARRED);
          }}
        >
          <NavLink
            to={RouteConfig.LOCAL_STARRED}
            className={({ isActive }) => {
              return clsx("sidebar-item", isActive ? "sidebar-item--active" : "");
            }}
          >
            <Star size={16} />
            <span className="shrink grow basis-[0%] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              Starred
            </span>
          </NavLink>
        </div>
      </div>
    </>
  );
};

export { CollectionMeta };
