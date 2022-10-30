import React, { useImperativeHandle, useState } from "react";
import { useModal } from "../Modal/useModal";
import { Input, TextArea, Modal, Button, Toast } from "@douyinfe/semi-ui";
import * as dataAgent from "../../helpers/dataAgent";
import styles from "./index.module.css";
import { busChannel } from "../../helpers/busChannel";

export const AddFeedChannel = (props: any) => {
  const { showStatus, showModal, hideModal, toggleModal } = useModal();
  const [feedUrl, setFeedUrl] = useState("https://feeds.appinn.com/appinns/");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

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

    dataAgent.fetchFeed(feedUrl).then((res) => {
      console.log("res from rust", res);

      if (!res) {
        Toast.error({
          content: 'Cant find any feed, please check url',
          duration: 2,
          theme: "light"
        });

        return;
      }

      const { title, description } = res as any;

      setTitle(title);
      setDescription(description);

    }).finally(() => {
      setLoading(false);
    });
  };

  const handleTitleChange = (e: any) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };

  const handleInputChange = (value: string) => {
    setFeedUrl(value);
  };

  const handleCancel = () => {
    setLoading(false);
    setConfirming(false);
    setTitle("");
    setDescription("");
    setFeedUrl("");
    toggleModal();
  };

  const handleSave = async () => {
    dataAgent.addChannel(feedUrl).then((res) => {
      console.log('saveRes ===>', res)

      if (res > 0) {
        busChannel.emit('getChannels')
        handleCancel()
      }
    }).finally(() => {
      setConfirming(false)
    });
  };

  return (
    <Modal
      visible={showStatus}
      title="添加 RSS 订阅"
      size="medium"
      confirmLoading={confirming}
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
        <div className={styles.item}>
          <div className={styles.label}>Title</div>
          <div className={styles.formItem}>
            <TextArea style={{ width: "300px" }} value={description} onChange={handleDescriptionChange}/>
          </div>
        </div>
      </div>
    </Modal>
  );
};
