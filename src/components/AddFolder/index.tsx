import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useModal } from "../Modal/useModal";
import { Input, Modal } from "@douyinfe/semi-ui";
import * as dataAgent from "../../helpers/dataAgent";
import styles from "./index.module.css";
import { busChannel } from "../../helpers/busChannel";

export const AddFolder = (props: any) => {
  const { showStatus, showModal, hideModal, toggleModal } = useModal();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(props.Aref, () => {
    return {
      status: showStatus,
      showModal,
      hideModal,
      toggleModal
    };
  });

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handleCancel = () => {
    setLoading(false);
    setConfirming(false);
    setName("");
    toggleModal();
  };

  const handleSave = async () => {
    setConfirming(true)

    dataAgent.createFolder(name).then((res) => {
      console.log('saveRes ===>', res)

      if (res > 0) {
        busChannel.emit('getChannels')
        handleCancel()
      }
    }).finally(() => {
      setConfirming(false)
    });
  };

  useEffect(() => {
    console.log(inputRef)

    if (showStatus && inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showStatus]);

  return (
    <Modal
      visible={showStatus}
      title="Create Folder"
      width="340"
      confirmLoading={confirming}
      onOk={handleSave}
      onCancel={handleCancel}
    >
      <div className={styles.box}>
        <div className={styles.item}>
          <div className={styles.label}>Name</div>
          <div className={styles.formItem}>
            <Input
              type="text"
              style={{ width: "300px" }}
              value={name}
              onChange={handleNameChange}
              ref={inputRef}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
