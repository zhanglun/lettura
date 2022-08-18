import React, { useImperativeHandle, useState } from "react";
import { useModal } from "../Modal/useModal";
import { Input, Modal, Button } from "@douyinfe/semi-ui";
import { db, Channel as ChannelModel, Article as ArticleModel, Article } from "../../db";
import { requestFeed } from "../../helpers/parseXML";
import * as dataAgent from "../../helpers/dataAgent";
import styles from "./index.module.css";

export const AddFeedChannel = (props: any) => {
  const { showStatus, showModal, hideModal, toggleModal } = useModal();
  const [feedUrl, setFeedUrl] = useState("https://nodejs.org/en/feed/blog.xml");
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState({} as ChannelModel);
  const [articles, setArticles] = useState([] as ArticleModel[]);

  useImperativeHandle(props.Aref, () => {
    return {
      status: showStatus,
      showModal,
      hideModal,
      toggleModal
    };
  });

  const handleLoad = () => {
    requestFeed(feedUrl).then((res) => {
      if (res.channel && res.items) {
        const { channel, items } = res;

        items.forEach((item: Article) => item.unread = 1);

        setTitle(channel.title);
        setChannel(channel);
        setArticles(items);
      }
    });
  };

  const handleTitleChange = (e: any) => {
    setTitle(e.target.value);
  };

  const handleInputChange = (value: string) => {
    setFeedUrl(value);
  };

  const handleCancel = () => {
    toggleModal();
  };

  const handleSave = () => {
    db.transaction("rw", db.channels, db.articles, async () => {
      await dataAgent.upsertChannel({ ...channel, unread: 0 });
      // await dataAgent.bulkAddArticle(articles)
    }).then(() => {
      toggleModal();
    });
  };

  return (
    <Modal
      visible={showStatus}
      title="添加 RSS 订阅"
      onOk={handleSave}
      onCancel={handleCancel}
    >
      <div className={styles.box}>
        <div className={styles.item}>
          <div className={styles.label}>Feed URL</div>
          <div className={styles.formItem}>
            <Input type="text" value={feedUrl} onChange={handleInputChange} />
          </div>
          <div className={styles.action}>
            <Button type={"primary"} onClick={handleLoad}>Load</Button>
          </div>
        </div>

        <div className={styles.item}>
          <div className={styles.label}>Title</div>
          <div className={styles.formItem}>
            <Input type="text" value={title} onChange={handleTitleChange} />
          </div>
        </div>
      </div>
    </Modal>
  );
};
