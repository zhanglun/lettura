import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Coffee, Haze, Star } from "lucide-react";
import classNames from "classnames";
import { RouteConfig } from "@/config";
import { useBearStore } from "@/stores";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";

type NavClass = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning: boolean;
};

const CollectionMeta = (): JSX.Element => {
  const { t } = useTranslation();
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
      <h2 className="mb-2 mt-6 px-2 font-semibold tracking-tight">{t("Collections")}</h2>
      <div>
        <div
          onClick={() => {
            store.setFeed(null);
            store.setViewMeta({
              title: t("Today"),
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
              {t("Today")}
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
              title: t("All Items"),
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
              {t("All Items")}
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
              title: t("Starred"),
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
              {t("Starred")}
            </span>
          </NavLink>
        </div>
      </div>
    </>
  );
};

export { CollectionMeta };
