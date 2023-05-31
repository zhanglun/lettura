import React, {
  useEffect,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  ForwardedRef,
  createRef
} from "react";
import { ArticleItem } from "../ArticleItem";
import { useBearStore } from "@/hooks/useBearStore";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { ArticleListRefType, ArticleListProps} from "@/components/ArticleList/index";
import { ArticleLineItem } from "@/components/ArticleItem/Line";

export const ArticleLineList = forwardRef(
  (
    props: ArticleListProps,
    ref: ForwardedRef<ArticleListRefType>
  ): JSX.Element => {
    const { feedUuid } = props;
    const store = useBearStore(state => ({
      currentFilter: state.currentFilter,
      setArticleList: state.setArticleList,
      articleList: state.articleList,
      getArticleList: state.getArticleList
    }));
    const { articleList, setArticleList } = store;
    const [ loading, setLoading ] = useState(false);
    const innerRef = useRef<HTMLDivElement>(null);
    const [ articlesRef, setArticlesRef ] = useState([]);

    const resetScrollTop = () => {
      if (innerRef.current !== null) {
        innerRef.current.scroll(0, 0);
      }
    };

    const getList = (feedUuid: string) => {
      const filter: { read_status?: number; limit?: number } = {};

      filter.read_status = store.currentFilter.id;

      setLoading(true);

      store.getArticleList(feedUuid, filter)
        .then((res: any) => {
          console.log("%c Line:66 🍺 list", "color:#e41a6a", res);
        })
        .finally(() => {
          setLoading(false);
        })
        .catch((err: any) => {
          console.log("%c Line:71 🍎 err", "color:#ffdd4d", err);
        });
    };

    useImperativeHandle(ref, () => {
      return {
        getList() {
          getList(feedUuid || "");
        },
        markAllRead() {
        },
        articlesRef,
        innerRef
      };
    });

    useEffect(() => {
      getList(feedUuid || "");
    }, [ feedUuid, store.currentFilter ]);

    const renderList = (): JSX.Element[] => {
      return (articleList || []).map((article: any, idx: number) => {
        return (
          <ArticleLineItem
            ref={ articlesRef[article.uuid] }
            article={ article }
            key={ article.id }
          />
        );
      });
    };

    useEffect(() => {
      resetScrollTop();
    }, []);

    useEffect(() => {
      resetScrollTop();
    }, [ feedUuid, articleList ]);

    useEffect(() => {
      const refs = articleList.reduce((acc: any, cur) => {
        acc[cur.uuid] = createRef();

        return acc;
      }, {});

      setArticlesRef(refs);
    }, [ articleList ]);

    return (
      <div className="grid grid-cols-1 pl-2 grid-rows-[calc(100% - var(--app-toolbar-height))]">
        <div ref={ innerRef }>
          <ul className="m-0 pb-2 grid">{ renderList() }</ul>
        </div>
      </div>
    );
  }
);
