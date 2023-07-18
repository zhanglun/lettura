import React, { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { ExternalLink, Ghost, Link, Paintbrush, Share } from "lucide-react";
import { useBearStore } from "@/hooks/useBearStore";
import { Article } from "@/db";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CustomizeStyle } from "@/components/SettingPanel/CustomizeStyle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { open } from "@tauri-apps/api/shell";
import * as dataAgent from "@/helpers/dataAgent";
import { useToast } from "@/components/ui/use-toast";

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
    channel: state.channel,

    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    userConfig: state.userConfig,
  }));

  const handleViewSourcePage = () => {
    const { link } = store.article as Article;

    dataAgent.getPageSources(link).then((res) => {
      console.log(res);
    });
    // TODO: parse web content
  };

  const openInBrowser = () => {
    store.article && open(store.article?.link);
  }

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
          <Icon>
            <Paintbrush size={16} />
          </Icon>
        </PopoverTrigger>
        <PopoverContent className="w-[340px]">
          <CustomizeStyle styleConfig={store.userConfig.customize_style} />
        </PopoverContent>
      </Popover>
      <Icon onClick={handleViewSourcePage}>
        <Ghost size={16} />
      </Icon>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Icon>
            <Share size={16} />
          </Icon>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => openInBrowser()}>
            <ExternalLink size={16} className="mr-2" />
            Open in browser
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            <Link size={16} className="mr-2" />
            Copy link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
