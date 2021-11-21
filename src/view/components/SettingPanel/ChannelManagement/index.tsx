/* eslint-disable react/display-name */
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Table, Avatar, Row, Col } from '@douyinfe/semi-ui';
import Dayjs from 'dayjs';
import { Icon } from '../../Icon';
import { useDataProxy } from '../../../hooks/useDataProxy';
import { useEventPub } from '../../../hooks/useEventPub';
import { ChannelEntity } from '../../../../entity/channel';
import styles from './index.module.css';
import { openBrowser } from '../../../../infra/utils';
import { Toast } from '../../Toast';

export const ChannelManagement = () => {
  const dataProxy = useDataProxy();
  const { eventPubEmit } = useEventPub();
  const [formAPI, setFormAPI] = useState<any>();
  const [list, setList] = useState([]);
  const [editModalStatus, setEditModalStatus] = useState(false);
  const [record, setRecord] = useState<Partial<ChannelEntity>>({});

  const initial = () => {
    dataProxy
      .PROXY_GET_CHANNEL_LIST()
      .then((result) => {
        setList(result);
        return result;
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  const handleConfirmEdit = useCallback(() => {
    const values = formAPI.getValues();

    setEditModalStatus(false);
    dataProxy
      .PROXY_UPDATE_CHANNEL_INFO({
        channelId: record.id,
        body: { ...values, favicon: values.favicon[0] },
      })
      .then((res) => {
        console.log(res);
        initial();
        return res;
      })
      .catch((err) => {
        console.log(err);
      });
    // setRecord({});
  }, [record, formAPI]);

  const handleCancelEdit = () => {
    setEditModalStatus(false);
    setRecord({});
  };

  const showEditModal = (row: ChannelEntity) => {
    setRecord(row);
    setEditModalStatus(true);
  };

  const handleBeforeUpload = useCallback(
    ({ file }) => {
      const reader = new FileReader();
      reader.readAsDataURL(file.fileInstance);
      reader.onload = function () {
        formAPI.setValue('favicon', [reader.result]);
        setRecord({ ...record, favicon: reader.result as string });
      };
      reader.onerror = function (error) {
        console.log('Error: ', error);
      };
      return false;
    },
    [formAPI, record]
  );

  const onLinkClick = (e: any, link: string) => {
    openBrowser(link);
    e.preventDefault();
  };

  const syncChannel = (channelId: string) => {
    Toast.show({
      type: 'info',
      title: '开始同步',
    });

    eventPubEmit.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID({ channelId });
  };

  const cancelSubscribe = (channel: ChannelEntity) => {
    Modal.confirm({
      title: '取消订阅',
      content: (
        <div>
          确定要取消订阅
          <span
            onClick={(e) => onLinkClick(e, channel.link)}
            role="presentation"
            style={{ margin: '0 6px' }}
          >
            <img
              src={channel.favicon}
              alt=""
              className={styles.favicon}
              style={{ verticalAlign: 'bottom' }}
            />
            <a href={channel.link}>{channel.title}</a>
          </span>
          吗？
        </div>
      ),
      onOk() {
        dataProxy
          .PROXY_CANCEL_SUBSCRIBE({ channelId: channel.id })
          .then((res) => {
            console.log(res);

            if (res.status === 'success') {
              initial();
            }

            return res;
          })
          .catch(() => {});
      },
      onCancel() {
        alert(2);
      },
    });
  };

  const columns = [
    {
      title: '频道名称',
      dataIndex: 'title',
      render: (text: string, row: ChannelEntity) => (
        <span
          className={styles.tableNameText}
          onClick={(e) => onLinkClick(e, row.link)}
          role="presentation"
        >
          <img src={row.favicon} alt="" className={styles.favicon} />
          <a href={row.link}>{text}</a>
        </span>
      ),
    },
    {
      title: 'RSS',
      dataIndex: 'feedUrl',
      render: (text: string) => (
        <span
          className={styles.tableNameText}
          onClick={(e) => onLinkClick(e, text)}
          role="presentation"
        >
          <a href={text}>{text}</a>
        </span>
      ),
    },
    {
      title: '最后同步时间',
      dataIndex: 'lastSyncDate',
      width: 160,
      render: (text: string) => {
        return <span>{Dayjs(text).format('YYYY-MM-DD HH:mm')}</span>;
      },
    },
    {
      title: '操作',
      dataIndex: 'feedUrl',
      width: 120,
      render: (_text: any, row: ChannelEntity) => {
        return (
          <div>
            <Icon
              customClass={styles.tableIcon}
              name="edit"
              onClick={() => showEditModal(row)}
            />
            <Icon
              customClass={styles.tableIcon}
              name="refresh"
              onClick={() => syncChannel(row.id)}
            />
            <Icon
              customClass={styles.tableIcon}
              name="delete"
              onClick={() => cancelSubscribe(row)}
            />
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    initial();
  }, []);

  return (
    <>
      <Table
        size="small"
        columns={columns}
        dataSource={list}
        pagination={false}
      />
      <Modal
        header={null}
        visible={editModalStatus}
        onOk={handleConfirmEdit}
        onCancel={handleCancelEdit}
        width={648}
      >
        <h3 style={{ textAlign: 'center', fontSize: 24, margin: 40 }}>
          {record.title}
        </h3>
        <Form getFormApi={(api) => setFormAPI(api)}>
          <Row>
            <Col span={14}>
              <Form.Input label="标题" field="title" initValue={record.title} />
              <Form.Input
                label="网站地址"
                field="link"
                initValue={record.link}
              />
              <Form.Input
                label="RSS 地址"
                field="feedUrl"
                initValue={record.feedUrl}
              />
            </Col>
            <Col span={8} offset={2}>
              <Form.Upload
                field="favicon"
                label="图标"
                initValue={[record.favicon]}
                action="/"
                beforeUpload={handleBeforeUpload}
                accept={'image/*'}
                showUploadList={false}
                onError={() => Toast.show({ type: 'error', title: '上传失败' })}
              >
                <Avatar
                  size="extra-large"
                  src={record.favicon}
                  style={{ margin: 4, border: '1px solid #dedede' }}
                  hoverMask={
                    <div
                      style={{
                        backgroundColor: 'rgba(0,0,0,.4)',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                      }}
                    >
                      <Icon name="backup" />
                    </div>
                  }
                />
              </Form.Upload>
            </Col>
          </Row>
          <Form.TextArea
            label="简介"
            field="description"
            initValue={record.description}
          />
        </Form>
      </Modal>
    </>
  );
};
