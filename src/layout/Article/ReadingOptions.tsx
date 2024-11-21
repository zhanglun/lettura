import React, { useEffect } from "react";
import { ExternalLink, Ghost, Link, Paintbrush, Share } from "lucide-react";
import { useBearStore } from "@/stores";
import { Article } from "@/db";
import { CustomizeStyle } from "@/layout/Setting/CustomizeStyle";
import { open } from "@tauri-apps/api/shell";
import * as dataAgent from "@/helpers/dataAgent";
import { toast } from "sonner";
import { IconButton, Popover, Tooltip } from "@radix-ui/themes";

export interface NavigatorProps {
  listRef?: any;
}

export const ReadingOptions = (props: NavigatorProps) => {
  const store = useBearStore((state) => ({
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
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
        toast("Copied");
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  };

  return (
    <>
      {/* <Popover.Root>
        <Tooltip content="Customize style">
          <Popover.Trigger>
            <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]">
              <Paintbrush size={16} />
            </IconButton>
          </Popover.Trigger>
        </Tooltip>
        <Popover.Content className="w-[340px]">
          <CustomizeStyle styleConfig={store.userConfig.customize_style} />
        </Popover.Content>
      </Popover.Root> */}
      {/* <Tooltip content="View full page">
        <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]"
          onClick={handleViewSourcePage}
          disable={!store.article}
          active={store.viewOrigin}
        >
          <Ghost
            size={16}
            className={clsx({ "animate-bounce": store.viewOrigin })}
          />
        </IconButton>
      </Tooltip> */}
      <Tooltip content="Open in browser">
        <IconButton
          size="2"
          variant="ghost"
          color="gray"
          className="text-[var(--gray-12)]"
          onClick={() => openInBrowser()}
        >
          <ExternalLink size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip content="Copy link">
        <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]" onClick={handleCopyLink}>
          <Link size={16} />
        </IconButton>
      </Tooltip>
    </>
  );
};
