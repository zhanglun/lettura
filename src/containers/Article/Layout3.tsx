import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList, ArticleListRefType } from "@/components/ArticleList";
import { ArticleView } from "@/components/ArticleView";
import * as dataAgent from "../../helpers/dataAgent";
import { useBearStore } from "@/hooks/useBearStore";
import styles from "./index.module.scss";
import {
  Filter,
  CheckCheck,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Paintbrush,
  Link,
  Ghost, Share, Layout, LayoutGrid, LayoutList, LayoutPanelLeft
} from "lucide-react";
import { busChannel } from "@/helpers/busChannel";
import { Article } from "@/db";
import { CustomizeStyle } from "@/components/SettingPanel/CustomizeStyle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import classNames from "classnames";

import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Icon } from "@/components/Icon";

import { open } from "@tauri-apps/api/shell";
import { Separator } from "@/components/ui/separator";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const Layout3 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useBearStore((state) => ({
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
    updateArticleAndIdx: state.updateArticleAndIdx,
    channel: state.channel,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    currentIdx: state.currentIdx,
    setCurrentIdx: state.setCurrentIdx,
    userConfig: state.userConfig
  }));

  const query = useQuery();

  return (
    <>
      TODO Layout3.tsx
    </>
  );
};
