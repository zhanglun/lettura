import React, { useEffect } from "react";
import clsx from "clsx";
import { Icon } from "@/components/Icon";
import { ExternalLink, Ghost, Link, Paintbrush, Share } from "lucide-react";
import { useBearStore } from "@/stores";
import { Article } from "@/db";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CustomizeStyle } from "@/components/SettingPanel/CustomizeStyle";
import { open } from "@tauri-apps/api/shell";
import * as dataAgent from "@/helpers/dataAgent";
import { useToast } from "@/components/ui/use-toast";
import { TooltipBox } from "@/components/TooltipBox";

export interface NavigatorProps {
  listRef?: any;
}

export const ReadingOptions = (props: NavigatorProps) => {
  const { toast } = useToast();
  const store = useBearStore((state) => ({
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
    updateArticleAndIdx: state.updateArticleAndIdx,
    feed: state.feed,

    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    userConfig: state.userConfig,
    viewOrigin: state.viewOrigin,
    updateViewOrigin: state.updateViewOrigin,
    viewOriginLoading: state.viewOriginLoading,
    updateViewOriginLoading: state.updateViewOriginLoading,
  }));

  const handleViewSourcePage = () => {
    if (!store.article) {
      return;
    }

    const { link } = store.article as Article;

    if (store.viewOrigin) {
      store.updateViewOrigin(false);

      return;
    }

    store.updateViewOrigin(true);
    store.updateViewOriginLoading(true);

    dataAgent
      .getPageSources(link)
      .then((res) => {
        console.log(res);
      })
      .finally(() => {
        store.updateViewOriginLoading(false);
      });
    // .catch((err) => {
    //   store.updateViewOrigin(false);
    // });
    // TODO: parse web content
  };

  const openInBrowser = () => {
    store.article && open(store.article?.link);
  };

  const handleCopyLink = () => {
    const { link } = store.article as Article;

    navigator.clipboard.writeText(link).then(
      function () {
        toast({
          description: "Copied",
        });
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  };

  return (
    <>
      <Popover>
        <PopoverTrigger>
          <TooltipBox content="Customize style">
            <Icon>
              <Paintbrush size={16} />
            </Icon>
          </TooltipBox>
        </PopoverTrigger>
        <PopoverContent className="w-[340px]">
          <CustomizeStyle styleConfig={store.userConfig.customize_style} />
        </PopoverContent>
      </Popover>
      {/* <TooltipBox content="View full page">
        <Icon
          onClick={handleViewSourcePage}
          disable={!store.article}
          active={store.viewOrigin}
        >
          <Ghost
            size={16}
            className={clsx({ "animate-bounce": store.viewOrigin })}
          />
        </Icon>
      </TooltipBox> */}
      <TooltipBox content="Open in browser">
        <Icon onClick={() => openInBrowser()}>
          <ExternalLink size={16} />
        </Icon>
      </TooltipBox>
      <TooltipBox content="Copy link">
        <Icon onClick={handleCopyLink}>
          <Link size={16} />
        </Icon>
      </TooltipBox>
    </>
  );
};
