import React, { useImperativeHandle, useState } from "react";
import { useModal } from "../Modal/useModal";
import { Input, Modal, Button, Toast } from "@douyinfe/semi-ui";
import { db, Channel as ChannelModel, Article as ArticleModel, Article, Channel } from "../../db";
import { requestFeed } from "../../helpers/parseXML";
import * as dataAgent from "../../helpers/dataAgent";
import styles from "./index.module.css";
import { invoke } from '@tauri-apps/api/tauri';

export const AddFeedChannel = (props: any) => {
  const { showStatus, showModal, hideModal, toggleModal } = useModal();
  const [feedUrl, setFeedUrl] = useState("");
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState({} as ChannelModel);
  const [articles, setArticles] = useState([] as ArticleModel[]);
  const [loading, setLoading] = useState(false);

  useImperativeHandle(props.Aref, () => {
    return {
      status: showStatus,
      showModal,
      hideModal,
      toggleModal
    };
  });

  const handleLoad = async () => {
    setLoading(true);
    const res: Channel & { items: Article[] } = await invoke('fetch_feed', { url: feedUrl })

    console.log("res from rust", res);

    requestFeed(feedUrl).then((res) => {
      console.log("res", res);

      if (res.status && res.status !== 200) {
        Toast.error({
          content: `Request Error: ${res.status}`,
          duration: 2,
          theme: "light"
        });
        return;
      }

      const { items, channel } = res;

      items.forEach((item: Article) => item.unread = 1);

      setTitle(channel.title);
      setChannel(channel);
      setArticles(items);
    }).finally(() => {
      setLoading(false)
    })
  };

  const handleTitleChange = (e: any) => {
    setTitle(e.target.value);
  };

  const handleInputChange = (value: string) => {
    setFeedUrl(value);
  };

  const handleCancel = () => {
    setLoading(false);
    setTitle("");
    setFeedUrl("");
    toggleModal();
  };

  const handleSave = async () => {
    const saveRes = await invoke('add_channel', { url: feedUrl})
    console.log(saveRes)
    db.transaction("rw", db.channels, db.articles, async () => {
      await dataAgent.upsertChannel({ ...channel, unread: 0 });
      await dataAgent.bulkAddArticle(articles);
      await dataAgent.updateCountWithChannel(channel.feedUrl);
    }).then(() => {
      handleCancel();
    });
  };

  return (
    <Modal
      visible={showStatus}
      title="添加 RSS 订阅"
      size="medium"
      onOk={handleSave}
      onCancel={handleCancel}
    >
      <div className={styles.box}>
        <div className={styles.item}>
          <div className={styles.label}>Feed URL</div>
          <div className={styles.formItem}>
            <Input type="text" style={{ width: "300px" }} disabled={loading} value={feedUrl}
                   onChange={handleInputChange}/>
          </div>
          <div className={styles.action}>
            <Button type={"primary"} loading={loading} onClick={handleLoad}>Load</Button>
          </div>
        </div>

        <div className={styles.item}>
          <div className={styles.label}>Title</div>
          <div className={styles.formItem}>
            <Input type="text" style={{ width: "300px" }} value={title} onChange={handleTitleChange}/>
          </div>
        </div>
      </div>
    </Modal>
  );
};
