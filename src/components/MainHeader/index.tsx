import React, { useState } from "react";
import { Button, Dropdown, Notification } from "@douyinfe/semi-ui";
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
  const store = useStore();

  console.log(store)

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

  // const markAllRead = () => {
  // };

  const changeFilter = (filter : any) => {
    store.setFilter(filter)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <img className={styles.ico} src={feedUrl ? getChannelFavicon(feedUrl) : ""} alt="" />
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
          {/*<Icon*/}
          {/*  customClass={styles.menuIcon}*/}
          {/*  name="checklist"*/}
          {/*  onClick={markAllRead}*/}
          {/*/>*/}
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
