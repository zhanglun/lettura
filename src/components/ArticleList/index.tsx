/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, {
  useEffect,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  ForwardedRef,
} from "react";
import { ArticleItem } from "../ArticleItem";
import { Loading } from "../Loading";
import { Article } from "../../db";
import { useStore } from "../../hooks/useStore";
import * as dataAgent from "../../helpers/dataAgent";
import styles from "./articlelist.module.css";
import { busChannel } from "../../helpers/busChannel";

export type ArticleListProps = {
  channelUuid: string | null;
  feedUrl: string | null;
  title: string | null;
};

export interface ArticleListRefType {
  getList: () => void;
  markAllRead: () => void;
}

export const ArticleList = forwardRef(
  (
    props: ArticleListProps,
    ref: ForwardedRef<ArticleListRefType>
  ): JSX.Element => {
    const { channelUuid } = props;
    const store = useStore();
    const [highlightItem, setHighlightItem] = useState<Article>();
    const [articleList, setArticleList] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const articleListRef = useRef<HTMLDivElement>(null);

    const resetScrollTop = () => {
      if (articleListRef.current !== null) {
        articleListRef.current.scroll(0, 0);
      }
    };

    const handleArticleSelect = (article: any) => {
      setHighlightItem(article);
    };

    const getList = (channelUuid: string) => {
      const filter: { read_status?: number, limit?: number } = {};

      filter.read_status = store.currentFilter.id;


      setLoading(true)

      dataAgent
        .getArticleList(channelUuid, filter)
        .then((res) => {
          const { list } = res as { list: Article[] };
          setArticleList(list);
        })
        .finally(() => {
          setLoading(false)
        })
        .catch((err) => {
          console.log("%c Line:71 🍎 err", "color:#ffdd4d", err);
        });
    };

    const markAllRead = () => {
      dataAgent.markAllRead(channelUuid as string)
        .then((res) => {
          articleList.forEach((article) => {
            article.read_status = 2
          })

          setArticleList([...articleList])

          busChannel.emit('updateChannelUnreadCount', {
            uuid: channelUuid as string,
            action: 'set',
            count: 0,
          })
        })
    }

    useImperativeHandle(ref, () => {
      return {
        getList() {
          getList(channelUuid || "");
        },
        markAllRead() {
          markAllRead();
        }
      };
    });

    useEffect(() => {
      getList(channelUuid || "");
    }, [channelUuid, store.currentFilter]);

    const renderList = (): JSX.Element[] => {
      console.log("%c Line:102 🍓 articleList", "color:#42b983", articleList);

      return articleList.map((article: any, idx: number) => {
        return (
          <ArticleItem
            article={article}
            highlight={highlightItem?.id === article.id}
            key={article.id}
            onSelect={handleArticleSelect}
          />
        );
      });
    };

    useEffect(() => {
      resetScrollTop();
    }, []);

    useEffect(() => {
      resetScrollTop();
    }, [channelUuid, articleList]);

    return (
      <div className={styles.container}>
        <div className={styles.inner} ref={articleListRef}>
          {loading ? (
            <Loading/>
          ) : (
            <ul className={styles.list}>{renderList()}</ul>
          )}
        </div>
      </div>
    );
  }
);
