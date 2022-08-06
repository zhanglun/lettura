import React from "react";
import { Notification } from "@douyinfe/semi-ui";
import { Icon } from "../Icon";
import styles from "./header.module.css";
import { requestFeed, getChannelFavicon } from "../../helpers/parseXML";
import * as dataAgent from "../../helpers/dataAgent";
import { useStore } from "../../hooks/useStore";

type MainHeaderProps = {
  channelId: string | null;
  feedUrl: string | null;
  title: string | null;
};

export const MainHeader = (props: MainHeaderProps) => {
  const { feedUrl } = props;
  const { channel: channelInStore } = useStore();

  console.log("channelInStore", channelInStore);

  const syncArticles = () => {
    feedUrl &&
    requestFeed(feedUrl).then((res) => {
      if (res.channel && res.items) {
        const { items } = res;

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <img className={styles.ico} src={feedUrl ? getChannelFavicon(feedUrl) : ""} alt="" />
          {channelInStore ? channelInStore.title : ""}
        </div>
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
