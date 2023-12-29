import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList } from "@/components/ArticleList";
import { useBearStore } from "@/stores";
import { useQuery } from "@/helpers/parseXML";

import {
  Filter,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Icon } from "@/components/Icon";
import { Separator } from "@/components/ui/separator";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { ToolbarItemNavigator } from "@/layout/Article/ToolBar";
import { ReadingOptions } from "@/layout/Article/ReadingOptions";
import { open } from "@tauri-apps/api/shell";
import { TooltipBox } from "@/components/TooltipBox";
import { useMatch } from "react-router-dom";
import { RouteConfig } from "@/config";
import { useArticle } from "./useArticle";
import { loadFeed } from "@/hooks/useLoadFeed";

export const Layout1 = React.memo(() => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useBearStore((state) => ({
    viewMeta: state.viewMeta,
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
    updateArticleAndIdx: state.updateArticleAndIdx,
    feed: state.feed,
    syncArticles: state.syncArticles,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    currentIdx: state.currentIdx,
    setCurrentIdx: state.setCurrentIdx,
    userConfig: state.userConfig,
  }));

  const [feedUrl, type, feedUuid] = useQuery();
  // const { setSize } = useArticle({ feedUuid });

  const handleRefresh = () => {
    if (store.feed && store.feed.uuid) {
      loadFeed(store.feed, store.syncArticles, () => {
        // setSize(1);
      });
    }
  };

  const markAllRead = () => {};

  const changeFilter = (id: any) => {
    if (store.filterList.some((_) => _.id === parseInt(id, 10))) {
      store.setFilter({
        ...store.filterList.filter((_) => _.id === parseInt(id, 10))[0],
      });
    }
  };

  return (
    <div className="grid border-r">
      <div className="h-[var(--app-toolbar-height)] grid grid-cols-[1fr_1fr] items-center justify-between border-b">
        <div
          className="
            flex
            items-center
            px-3
            text-base
            font-bold
            w-full
            text-ellipsis
            overflow-hidden
            whitespace-nowrap
            text-article-headline
          "
        >
         {store.viewMeta ? store.viewMeta.title : ""}
        </div>
        <div className={"flex items-center justify-end px-2 space-x-0.5"}>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <TooltipBox content="Filter">
                <Icon>
                  <Filter size={16} />
                </Icon>
              </TooltipBox>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={`${store.currentFilter.id}`}
                onValueChange={changeFilter}
              >
                {store.filterList.map((item) => {
                  return (
                    <DropdownMenuRadioItem
                      key={`${item.id}`}
                      value={`${item.id}`}
                    >
                      {item.title}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipBox content="Mark all as read">
            <Icon onClick={markAllRead}>
              <CheckCheck size={16} />
            </Icon>
          </TooltipBox>
          <TooltipBox content="Reload feed">
            <Icon onClick={handleRefresh}>
              <RefreshCw
                size={16}
                // className={`${syncing ? "spinning" : ""}`}
              />
            </Icon>
          </TooltipBox>
        </div>
      </div>
      <div className="relative h-full">
        <ArticleList
          title={params.name}
          type={type}
          feedUuid={feedUuid}
          feedUrl={feedUrl || ""}
        />
      </div>
    </div>
  );
});
