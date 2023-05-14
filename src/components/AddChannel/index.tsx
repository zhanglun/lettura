import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useModal } from "../Modal/useModal";
import { Input, TextArea, Modal, Button, Toast } from "@douyinfe/semi-ui";
import * as dataAgent from "../../helpers/dataAgent";
import styles from "./index.module.css";
import { busChannel } from "../../helpers/busChannel";
export const AddFeedChannel = (props: any) => {
  const { showStatus, showModal, hideModal, toggleModal } = useModal();
  const [step, setStep] = useState(1);
  const [feedUrl, setFeedUrl] = useState("https://feeds.appinn.com/appinns/");
  const [feed, setFeed] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(props.Aref, () => {
    return {
      status: showStatus,
      showModal,
      hideModal,
      toggleModal,
    };
  });

  const handleLoad = async () => {
    setLoading(true);

    dataAgent
      .fetchFeed(feedUrl)
      .then((res) => {
        console.log("res from rust", res);
        if (!res) {
          Toast.error({
            content: "Cant find any feed, please check url",
            duration: 2,
            theme: "light",
          });

          return;
        }

        setFeed(res);
        setStep(2);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInputChange = (value: string) => {
    setFeedUrl(value);
  };

  const handleCancel = () => {
    setLoading(false);
    setConfirming(false);
    setStep(1);
    setFeedUrl("");
    setFeed({});
    toggleModal();
  };

  const handleSave = async () => {
    setConfirming(true);

    dataAgent
      .addChannel(feedUrl)
      .then((res) => {
        if (res[1] === "") {
          busChannel.emit("getChannels");
          handleCancel();
        }
      })
      .finally(() => {
        setConfirming(false);
      });
  };

  useEffect(() => {
    if (showStatus && inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showStatus]);

  return (
    <Modal
      visible={showStatus}
      title="添加订阅"
      footer={false}
      width={460}
      confirmLoading={confirming}
      onOk={handleSave}
      onCancel={handleCancel}
    >
      <div className="pb-8">
        {step === 1 && (
          <div>
            <div className="mb-3">
              <Input
                type="text"
                placeholder={""}
                ref={inputRef}
                disabled={loading}
                value={feedUrl}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Button
                block
                type={"primary"}
                loading={loading}
                onClick={handleLoad}
              >
                {loading ? "Loading" : "Load"}
              </Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className="border rounded p-3 mb-3">
              <div>
                <div>{feed.title}</div>
                <div>{feedUrl}</div>
              </div>
              <div>
                <div>{feed.description}</div>
              </div>
            </div>
            <div>
              <Button
                block
                type={"primary"}
                loading={loading}
                onClick={handleSave}
              >
                Subscribe
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
