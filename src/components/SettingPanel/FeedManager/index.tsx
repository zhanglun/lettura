import React, { useEffect, useState } from "react";
import { Modal, Table, Input, Select, Tabs, TabPane } from "@douyinfe/semi-ui";
import { FolderIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Channel, Folder } from "../../../db";
import * as dataAgent from "../../../helpers/dataAgent";
import { busChannel } from "../../../helpers/busChannel";
import styles from "../setting.module.scss";

export const FeedManager = () => {
	const [list, setList] = useState<(Channel & { parent_uuid: String })[]>([]);
	const [renderList, setRenderList] = useState<
		(Channel & { parent_uuid: String })[]
	>([]);
	const [folderList, setFolderList] = useState<Folder[]>([]);
	const [filterParams, setFilterParams] = useState<{
		searchText?: string;
		folderUuid?: string;
	}>({});
	const okText = "Sounds great!";
	const cancelText = "No, thanks.";

	const handleDeleteFeed = (channel: Channel) => {
		if (channel?.uuid) {
			Modal.confirm({
				title: "Do you want to unfollow this feed？",
				content: channel.title,
				okText,
				cancelText,
				onOk: async () => {
					await dataAgent.deleteChannel(channel.uuid);
					busChannel.emit("getChannels");
					getList();
				},
			});
		}
	};

	const handleEditFolder = (folder: Folder) => {
		if (folder?.uuid) {
		}
	};

	const handleDeleteFolder = (folder: Folder) => {
		if (folder?.uuid) {
			Modal.confirm({
				title: "Are you sure you want to delete this folder?？",
				content: folder.name,
				okText,
				cancelText,
				onOk: async () => {
					await dataAgent.deleteFolder(folder.uuid);
					await getFolderList();
					busChannel.emit("getChannels");
				},
			});
		}
	};

	const columns = [
		{
			title: "name",
			dataIndex: "title",
			render(text: string, record: Channel) {
				return (
					<div>
						<div>{text}</div>
						<div>
							<a href={record.link} target={"_blank"} rel="noreferrer">
								{record.link}
							</a>
						</div>
					</div>
				);
			},
		},
		{
			title: "Feed url",
			dataIndex: "feed_url",
			render(text: string, record: Channel): JSX.Element {
				return (
					<div>
						<a href={text} target={"_blank"} rel="noreferrer">
							{text}
						</a>
					</div>
				);
			},
		},
		{
			title: "Action",
			dataIndex: "opt",
			width: 100,
			render(text: string, record: Channel): JSX.Element {
				return (
					<div>
						<span
							className={styles.actionBtn}
							onClick={() => handleDeleteFeed(record)}
						>
							<TrashIcon className={"h-4 w-4"} />
						</span>
					</div>
				);
			},
		},
	];

	const folderColumns = [
		{
			title: "name",
			dataIndex: "name",
			render(text: string, record: Channel) {
				return (
					<div className={styles.nameCol}>
						<FolderIcon className={"h-4 w-4"} />
						<span>{text}</span>
					</div>
				);
			},
		},
		{
			title: "Action",
			dataIndex: "opt",
			width: 100,
			render(text: string, record: Folder): JSX.Element {
				return (
					<div className={styles.actionCol}>
						<span
							className={styles.actionBtn}
							onClick={() => handleEditFolder(record)}
						>
							<PencilIcon className={"h-4 w-4"} />
						</span>
						<span
							className={styles.actionBtn}
							onClick={() => handleDeleteFolder(record)}
						>
							<TrashIcon className={"h-4 w-4"} />
						</span>
					</div>
				);
			},
		},
	];

	const handleSearch = (v: string) => {
		setFilterParams({
			...filterParams,
			searchText: v,
		});
	};

	const handleFolderChange = (v: string) => {
		setFilterParams({
			...filterParams,
			folderUuid: v,
		});
	};

	const getList = async (params = {}) => {
		dataAgent.getChannels(params).then((res) => {
			setList(res.list || []);
			setRenderList(res.list || []);
		});
	};

	const getFolderList = () => {
		dataAgent.getFolders().then((res) => {
			setFolderList(res || []);
		});
	};
	const handleTabChange = (key: string) => {
		if (parseInt(key, 10) === 1) {
			getList();
		}

		if (parseInt(key, 10) === 2) {
			getFolderList();
		}
	};

	useEffect(() => {
		const { searchText = "", folderUuid = "" } = filterParams;
		const result = list.filter((item) => {
			return (
				(item.title.indexOf(searchText) > -1 ||
					item.feed_url.indexOf(searchText) > -1) &&
				item.parent_uuid === folderUuid
			);
		});

		setRenderList(result);
	}, [filterParams]);

	useEffect(() => {
		getList();
		getFolderList();

		const unsubscribeGetChannels = busChannel.on("getChannels", () => {
			getList();
		});

		return () => {
			unsubscribeGetChannels();
		};
	}, []);

	return (
		<div className={styles.panel}>
			<h1 className={styles.panelTitle}>Feed Manager</h1>
			<Tabs type="line" onChange={handleTabChange}>
				<TabPane tab="Feeds" itemKey={"1"}>
					<div className={styles.panelBody}>
						<div className={styles.feedManagerFields}>
							<Input
								placeholder="Search Feed"
								showClear={true}
								value={filterParams.searchText}
								onChange={handleSearch}
							/>
							<Select
								value={filterParams.folderUuid}
								showClear={true}
								placeholder="All Folder"
								onFocus={getFolderList}
								onChange={(v) => handleFolderChange(v as string)}
							>
								{folderList.map((folder) => {
									return (
										<Select.Option key={folder.uuid} value={folder.uuid}>
											{folder.name}
										</Select.Option>
									);
								})}
							</Select>
						</div>
						<Table
							columns={columns}
							dataSource={renderList}
							pagination={false}
							size="small"
						/>
					</div>
				</TabPane>
				<TabPane tab="Folders" itemKey={"2"}>
					<div className={styles.panelBody}>
						<Table
							// @ts-ignore
							columns={folderColumns}
							dataSource={folderList}
							pagination={false}
							size="small"
						/>
					</div>
				</TabPane>
			</Tabs>
		</div>
	);
};
