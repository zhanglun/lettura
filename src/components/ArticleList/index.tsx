import React, {
  useEffect,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  ForwardedRef,
  createRef,
} from "react";
import { ArticleItem } from "../ArticleItem";
import { Loading } from "../Loading";
import { Article } from "../../db";
import { useStore } from "../../hooks/useStore";
import * as dataAgent from "../../helpers/dataAgent";
import styles from "./articlelist.module.css";
import { busChannel } from "../../helpers/busChannel";

export type ArticleListProps = {
  feedUuid: string | null;
  type: string | null;
  feedUrl: string | null;
  title: string | null;
};

export interface ArticleListRefType {
  getList: () => void;
  markAllRead: () => void;
  articlesRef: any;
}

export const ArticleList = forwardRef(
  (
    props: ArticleListProps,
    ref: ForwardedRef<ArticleListRefType>,
  ): JSX.Element => {
    const { feedUuid } = props;
    const store = useStore();
    const [articleList, setArticleList] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const innerRef = useRef<HTMLDivElement>(null);
    const [articlesRef, setArticlesRef] = useState([]);

    const resetScrollTop = () => {
      if (innerRef.current !== null) {
        innerRef.current.scroll(0, 0);
      }
    };

    const getList = (feedUuid: string) => {
      const filter: { read_status?: number; limit?: number } = {};

      filter.read_status = store.currentFilter.id;

      setLoading(true);

      dataAgent
        .getArticleList(feedUuid, filter)
        .then((res) => {
          const { list } = res as { list: Article[] };
          setArticleList(list);
        })
        .finally(() => {
          setLoading(false);
        })
        .catch((err) => {
          console.log("%c Line:71 🍎 err", "color:#ffdd4d", err);
        });
    };

    const markAllRead = () => {
      console.log("🚀 ~ file: index.tsx:71 ~ markAllRead ~ markAllRead");
      dataAgent.markAllRead(feedUuid as string).then((res) => {
        articleList.forEach((article) => {
          article.read_status = 2;
        });

        setArticleList([...articleList]);

        busChannel.emit("updateChannelUnreadCount", {
          uuid: feedUuid as string,
          action: "set",
          count: 0,
        });
      });
    };

    useImperativeHandle(ref, () => {
      return {
        getList() {
          getList(feedUuid || "");
        },
        markAllRead() {
          markAllRead();
        },
        articlesRef,
      };
    });

    useEffect(() => {
      getList(feedUuid || "");
    }, [feedUuid, store.currentFilter]);

    const renderList = (): JSX.Element[] => {
      return articleList.map((article: any, idx: number) => {
        return (
          <ArticleItem
            ref={articlesRef[article.uuid]}
            article={article}
            highlight={store.article?.id === article.id}
            key={article.id}
          />
        );
      });
    };

    useEffect(() => {
      resetScrollTop();
    }, []);

    useEffect(() => {
      resetScrollTop();
    }, [feedUuid, articleList]);

    useEffect(() => {
      store.setArticleList(articleList);
      const refs = articleList.reduce((acc: any, cur) => {
        acc[cur.uuid] = createRef();

        return acc;
      }, {});

      setArticlesRef(refs);
    }, [articleList]);

    return (
      <div className={styles.container}>
        <div className={styles.inner} ref={innerRef}>
          {loading ? (
            <Loading />
          ) : (
            <ul className={styles.list}>{renderList()}</ul>
          )}
        </div>
      </div>
    );
  },
);
