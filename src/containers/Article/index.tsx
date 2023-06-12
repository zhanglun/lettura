import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArticleListRefType } from "@/components/ArticleList";
import * as dataAgent from "../../helpers/dataAgent";
import { useBearStore } from "@/hooks/useBearStore";
import styles from "./index.module.scss";
import {
  Filter,
  CheckCheck,
  RefreshCw,
  Layout, LayoutGrid, LayoutList
} from "lucide-react";
import { busChannel } from "@/helpers/busChannel";
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
import { Separator } from "@/components/ui/separator";
import { Layout1 } from "@/containers/Article/Layout1";
import { Layout2 } from "@/containers/Article/Layout2";
import { Layout3 } from "@/containers/Article/Layout3";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { ToolbarItemNavigator } from "@/containers/Article/ToolBar";
import { ReadingOptions } from "@/containers/Article/ReadingOptions";
import { useQuery } from "@/helpers/parseXML";

export const ArticleContainer = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
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

    currentIdx: state.currentIdx,
    setCurrentIdx: state.setCurrentIdx,
    userConfig: state.userConfig
  }));

  const { toast } = useToast();
  const [ layoutType, setLayoutType ] = useState(1);
  const [ feedUrl ] = useQuery();
  const [ syncing, setSyncing ] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const articleListRef = useRef<ArticleListRefType>(null);
  const { currentIdx, setCurrentIdx } = store;

  const handleViewScroll = () => {
    if (viewRef.current) {
      const scrollTop = viewRef.current.scrollTop;
      console.log("scrolling", scrollTop);

      if (scrollTop > 0) {
        viewRef.current?.parentElement?.classList.add("is-scroll");
      } else {
        viewRef.current?.parentElement?.classList.remove("is-scroll");
      }
    }
  };

  useEffect(() => {
    if (viewRef.current) {
      const $list = viewRef.current as HTMLDivElement;
      $list.addEventListener("scroll", handleViewScroll);
    }
  }, [ store.articleList ]);

  useEffect(() => {
    if (
      listRef.current &&
      articleListRef.current &&
      Object.keys(articleListRef.current.articlesRef).length > 0
    ) {
      const $rootElem = listRef.current as HTMLDivElement;

      const options = {
        root: $rootElem,
        rootMargin: "0px",
        threshold: 1
      };

      const callback = (
        entries: IntersectionObserverEntry[],
        observer: IntersectionObserver
      ) => {
        if (entries[0].intersectionRatio < 1) {
          listRef.current?.parentElement?.classList.add("is-scroll");
        } else {
          listRef.current?.parentElement?.classList.remove("is-scroll");
        }
      };

      const observer = new IntersectionObserver(callback, options);
      const $target = (
        Object.values(articleListRef.current.articlesRef as any)[0] as any
      ).current;

      if ($target) {
        observer.observe($target);
      }
    }
  }, [ articleListRef.current ]);

  const getArticleList = () => {
    if (articleListRef.current) {
      articleListRef.current.getList();
    }
  };

  const syncArticles = () => {
    if (store.channel?.uuid) {
      setSyncing(true);

      dataAgent
        .syncArticlesWithChannelUuid(
          store.channel?.item_type as string,
          store.channel?.uuid as string
        )
        .then((res) => {
          const [ num, uuid, message ] = res[0];

          console.log("%c Line:77 🥛 res", "color:#ea7e5c", res);

          if (message) {
            toast({
              title: "Something wrong!",
              description: message,
              action: (
                <ToastAction altText="Goto schedule to undo">Close</ToastAction>
              )
            });
          } else {
            getArticleList();
            busChannel.emit("updateChannelUnreadCount", {
              uuid: store.channel?.uuid as string,
              action: "increase",
              count: num || 0
            });
          }
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  };

  const handleRefresh = () => {
    syncArticles();
  };

  const handleSetLayout = (type: number) => {
    setLayoutType(type);
  };

  const markAllRead = () => {
    if (feedUrl && articleListRef.current) {
      console.log("🚀 ~ file: index.tsx:148 ~ markAllRead ~ feedUrl", feedUrl);
      articleListRef.current.markAllRead();
      // TODO
    }

    return Promise.resolve();
  };

  const changeFilter = (id: any) => {
    if (store.filterList.some((_) => _.id === parseInt(id, 10))) {
      store.setFilter({
        ...store.filterList.filter((_) => _.id === parseInt(id, 10))[0]
      });
    }
  };

  const resetScrollTop = () => {
    if (viewRef.current !== null) {
      viewRef.current.scroll(0, 0);
    }
  };

  useEffect(() => {
    resetScrollTop();
  }, [ store.article ]);

  useEffect(() => {
    resetScrollTop();
  }, []);

  useEffect(() => {
  console.log("%c Line:211 🥤 store.channel?.uuid", "color:#fca650", store.channel?.uuid);

    if (listRef.current !== null) {
      listRef.current.scroll(0, 0);
    }

    setCurrentIdx(-1);
  }, [ store.channel?.uuid ]);



  return (
    <div className={ styles.article }>
      <div className={ `sticky-header ${ styles.header }` }>
        <div
          className="
            flex
            items-center
            px-3
            text-sm
            font-bold
            w-full
            text-ellipsis
            overflow-hidden
            whitespace-nowrap
            text-article-headline
          "
        >
          { store.channel ? store.channel.title : "" }
        </div>
        <div className={ "flex items-center justify-end px-2 space-x-0.5" }>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Icon>
                <Filter size={ 16 }></Filter>
              </Icon>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={ store.currentFilter.id + "" }
                onValueChange={ changeFilter }
              >
                { store.filterList.map((item) => {
                  return (
                    <DropdownMenuRadioItem
                      key={ item.id + "" }
                      value={ item.id + "" }
                    >
                      { item.title }
                    </DropdownMenuRadioItem>
                  );
                }) }
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Icon onClick={ markAllRead }>
            <CheckCheck size={ 16 }/>
          </Icon>
          <Icon onClick={ handleRefresh }>
            <RefreshCw size={ 16 } className={ `${ syncing ? "spinning" : "" }` }/>
          </Icon>
          <span>
            <Separator orientation="vertical" className="h-4 mx-2"/>
          </span>
          <Icon onClick={ () => handleSetLayout(1) } active={ layoutType === 1 }>
            <Layout size={ 16 }/>
          </Icon>
          <Icon onClick={ () => handleSetLayout(2) } active={ layoutType === 2 }>
            <LayoutGrid size={ 16 }/>
          </Icon>
          <Icon onClick={ () => handleSetLayout(3) } active={ layoutType === 3 }>
            <LayoutList size={ 16 }/>
          </Icon>
          <span>
            <Separator orientation="vertical" className="h-4 mx-2"/>
          </span>
          <ToolbarItemNavigator listRef={listRef} />
          <span>
            <Separator orientation="vertical" className="h-4 mx-2"/>
          </span>
          <ReadingOptions />
        </div>
      </div>
      <div>
        { layoutType === 1 && <Layout1/> }
        { layoutType === 2 && <Layout2/> }
        { layoutType === 3 && <Layout3/> }
      </div>
      <ArticleDialogView
        article={ store.article }
        userConfig={ store.userConfig }
        dialogStatus={ store.articleDialogViewStatus }
        setDialogStatus={ store.setArticleDialogViewStatus }
        afterConfirm={ () => {
        } }
        afterCancel={ () => {
          store.setArticle(null);
          console.log('store.article', store.article)
        } }
      />
    </div>
  );
};
