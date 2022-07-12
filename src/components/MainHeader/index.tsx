import React from "react";
import { Icon } from "../Icon";
import { requestFeed } from "../../helpers/parseXML";
import { Toast } from "../Toast";
import styles from "./header.module.css";
import * as dataAgent from "../../helpers/dataAgent";

type MainHeaderProps = {
  channelId: string | null;
  feedUrl: string | null;
  title: string | null;
};

export const MainHeader = (props: MainHeaderProps) => {
  const { feedUrl, title } = props;

  const syncArticles = () => {
    feedUrl &&
      requestFeed(feedUrl).then((res) => {
        if (res.channel && res.items) {
          const { items } = res;
          console.log(';=-====>2222', items)
          dataAgent.bulkAddArticle(items)
            .then(() => {
              return dataAgent.updateCountWithChannel(feedUrl)
            })
            .then(() => {
            Toast.show({
              title: "success",
              content: "Sync Success!",
            });
          })
        }
      });
  };

  const handleRefresh = () => {
    syncArticles();
  };

  const markAllRead = () => {};

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.menu}>
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
    </div>
  );
};
