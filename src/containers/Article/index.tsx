import React, { useCallback, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList } from "../../components/ArticleList";
import { ArticleView } from "../../components/ArticleView";
import { getChannelFavicon, requestFeed } from "../../helpers/parseXML";
import { Button, Dropdown, Notification } from "@douyinfe/semi-ui";
import { Icon } from "../../components/Icon";
import * as dataAgent from "../../helpers/dataAgent";
import { useStore } from "../../hooks/useStore";
import styles from "./index.module.scss";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const ArticleContainer = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useStore();
  const query = useQuery();
  const feedUrl = query.get("feedUrl")
  const channelId = query.get("channelId")
  const [current, setCurrent] = useState<any>(null);

  const handleArticleSelect = useCallback((article: any) => {
    setCurrent(article);
  }, []);

  const syncArticles = () => {
    feedUrl &&
    requestFeed(feedUrl).then((res) => {
      if (res.channel && res.items) {
        const { items } = res;

        console.log(items);

        dataAgent.bulkAddArticle(items)
          .then(() => {
            return dataAgent.updateCountWithChannel(feedUrl);
          })
          .then(() => {
            Notification.success(
              {
                duration: 2,
                position: "top",
                showClose: false,
                title: "Sync Success",
                content: "Sync the feed"
              }
            );
          });
      }
    });
  };

  const handleRefresh = () => {
    syncArticles();
  };

  const markAllRead = () => {
  };

  const changeFilter = (filter: any) => {
    store.setFilter(filter)
  }

  return (
    <div className={styles.article}>
      <div className={styles.list}>
        <div className={styles.header}>
          <div className={styles.title}>
            <img className={styles.ico} src={feedUrl ? getChannelFavicon(feedUrl) : ""} alt=""/>
            {store.channel ? store.channel.title : ""}
          </div>
          <div className={styles.menu}>
            <Dropdown trigger="click"
                      position="bottomLeft"
                      clickToHide={true}
                      render={
                        <Dropdown.Menu>
                          {store.filterList.map((item) => {
                            return <Dropdown.Item onClick={() => changeFilter(item)}
                                                  {...item.id === store.currentFilter.id ? { type: "primary" } : {}}>{item.title}</Dropdown.Item>;
                          })}
                        </Dropdown.Menu>
                      }
            >
              <Button>{store.currentFilter.title}</Button>
            </Dropdown>
            <Icon
              customClass={styles.menuIcon}
              name="checklist"
              onClick={markAllRead}
            />
            <Icon
              customClass={styles.menuIcon}
              name="refresh"
              onClick={handleRefresh}
            />
          </div>
        </div>
        <ArticleList
          title={params.name}
          channelId={query.get("channelId")}
          feedUrl={query.get("feedUrl")}
          onArticleSelect={handleArticleSelect}
        />
      </div>
      <div className={styles.mainView}>
        <div className={styles.viewHeader}></div>
        <ArticleView article={current} />
      </div>
    </div>
  );
};
