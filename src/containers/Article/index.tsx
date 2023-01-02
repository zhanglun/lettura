import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList, ArticleListRefType } from "../../components/ArticleList";
import { ArticleView } from "../../components/ArticleView";
import { Button, Dropdown, Toast, Tooltip } from "@douyinfe/semi-ui";
import * as dataAgent from "../../helpers/dataAgent";
import { useStore } from "../../hooks/useStore";
import styles from "./index.module.scss";
import {
	ArrowPathIcon,
	ArrowTopRightOnSquareIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	LinkIcon,
	PaintBrushIcon,
	WalletIcon,
} from "@heroicons/react/24/outline";
import { busChannel } from "../../helpers/busChannel";
import { Article } from "../../db";

function useQuery() {
	return new URLSearchParams(useLocation().search);
}

export const ArticleContainer = (): JSX.Element => {
	// @ts-ignore
	const params: { name: string } = useParams();
	const store = useStore();
	const query = useQuery();
	const feedUrl = query.get("feedUrl");
	const type = query.get("type");
	const channelUuid = query.get("channelUuid");
	const [syncing, setSyncing] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<HTMLDivElement>(null);
	const articleListRef = useRef<ArticleListRefType>(null);
	const { currentIdx, setCurrentIdx } = store;

	const handleViewScroll = () => {
		if (viewRef.current) {
			const scrollTop = viewRef.current.scrollTop;
			console.log("scrolling", scrollTop);

			if (scrollTop > 0) {
				viewRef.current?.parentElement?.classList.add("is-scroll");
			} else {
				viewRef.current?.parentElement?.classList.remove("is-scroll");
			}
		}
	};

	useEffect(() => {
		if (viewRef.current) {
			const $list = viewRef.current as HTMLDivElement;
			$list.addEventListener("scroll", handleViewScroll);
		}
	}, [store.articleList]);

	useEffect(() => {
		if (
			listRef.current &&
			articleListRef.current &&
			Object.keys(articleListRef.current.articlesRef).length > 0
		) {
			const $rootElem = listRef.current as HTMLDivElement;

			const options = {
				root: $rootElem,
				rootMargin: "50px",
				threshold: 1,
			};

			const callback = (
				entries: IntersectionObserverEntry[],
				observer: IntersectionObserver,
			) => {
				if (entries[0].intersectionRatio < 1) {
					listRef.current?.parentElement?.classList.add("is-scroll");
				} else {
					listRef.current?.parentElement?.classList.remove("is-scroll");
				}
			};

			const observer = new IntersectionObserver(callback, options);
			const $target = (
				Object.values(articleListRef.current.articlesRef as any)[0] as any
			).current;

			if ($target) {
				observer.observe($target);
			}
		}
	}, [articleListRef.current]);

	const getArticleList = () => {
		if (articleListRef.current) {
			articleListRef.current.getList();
		}
	};

	const syncArticles = () => {
		if (channelUuid) {
			setSyncing(true);

			dataAgent
				.syncArticlesWithChannelUuid(
					store.channel?.item_type as string,
					channelUuid as string,
				)
				.then((res: number) => {
					console.log("%c Line:77 🥛 res", "color:#ea7e5c", res);
					getArticleList();
					setSyncing(false);
					busChannel.emit("updateChannelUnreadCount", {
						uuid: channelUuid as string,
						action: "increase",
						count: res || 0,
					});
				});
		}
	};

	const handleCopyLink = () => {
		const { link } = store.article as Article;

		navigator.clipboard.writeText(link).then(
			function () {
				Toast.success({
					content: "Copied!",
					duration: 2,
					theme: "light",
					showClose: false,
				});
			},
			function (err) {
				console.error("Async: Could not copy text: ", err);
			},
		);
	};

	const handleRefresh = () => {
		syncArticles();
	};

	const markAllRead = () => {
		if (feedUrl && articleListRef.current) {
			console.log("🚀 ~ file: index.tsx:148 ~ markAllRead ~ feedUrl", feedUrl);
			articleListRef.current.markAllRead();
			// TODO
		}

		return Promise.resolve();
	};

	const changeFilter = (filter: any) => {
		store.setFilter(filter);
	};

	const resetScrollTop = () => {
		if (viewRef.current !== null) {
			viewRef.current.scroll(0, 0);
		}
	};

	const handleViewPrevious = () => {
		let cur = -1;

		if (currentIdx <= 0) {
			cur = 0;
		} else {
			cur = currentIdx - 1;
		}

		setCurrentIdx(cur);
		store.updateArticleAndIdx(store.articleList[cur] || null);
	};

	const handleViewNext = () => {
		let cur = -1;

		if (currentIdx < store.articleList.length - 1) {
			cur = currentIdx + 1;

			setCurrentIdx(cur);
			store.updateArticleAndIdx(store.articleList[cur] || null);
		}
	};

	useEffect(() => {
		resetScrollTop();
	}, [store.article]);

	useEffect(() => {
		resetScrollTop();
	}, []);

	useEffect(() => {
		const unsubscribeGoPrev = busChannel.on("goPreviousArticle", () => {
			handleViewPrevious();
		});
		const unsubscribeGoNext = busChannel.on("goNextArticle", () => {
			handleViewNext();
		});

		return () => {
			unsubscribeGoPrev();
			unsubscribeGoNext();
		};
	}, [currentIdx]);

	useEffect(() => {
		if (listRef.current !== null) {
			listRef.current.scroll(0, 0);
		}

		setCurrentIdx(-1);
	}, [channelUuid]);

	return (
		<div className={styles.article}>
			<div className={styles.list}>
				<div className={`sticky-header ${styles.header}`}>
					<div className={styles.title}>
						{store.channel ? store.channel.title : ""}
					</div>
					<div className={styles.menu}>
						<Dropdown
							trigger="click"
							position="bottomLeft"
							clickToHide={true}
							render={
								<Dropdown.Menu>
									{store.filterList.map((item) => {
										return (
											<Dropdown.Item
												key={item.id}
												onClick={() => changeFilter(item)}
												{...(item.id === store.currentFilter.id
													? { type: "primary" }
													: {})}
											>
												{item.title}
											</Dropdown.Item>
										);
									})}
								</Dropdown.Menu>
							}
						>
							<Button>{store.currentFilter.title}</Button>
						</Dropdown>

						<Tooltip content="Mark all read">
							<span className={styles.menuIcon} onClick={markAllRead}>
								<WalletIcon className={"h-4 w-4"} />
							</span>
						</Tooltip>
						<Tooltip content="Refresh">
							<span className={styles.menuIcon} onClick={handleRefresh}>
								<ArrowPathIcon
									className={`h-4 w-4 ${syncing ? "spinning" : ""}`}
								/>
							</span>
						</Tooltip>
					</div>
				</div>
				{syncing && <div className={styles.syncingBar}>同步中</div>}
				<div className={styles.scrollList} ref={listRef}>
					<ArticleList
						ref={articleListRef}
						title={params.name}
						type={type}
						feedUuid={channelUuid}
						feedUrl={feedUrl || ""}
					/>
				</div>
			</div>
			<div className={styles.mainView}>
				<div className={`sticky-header ${styles.viewHeader}`}>
					<div />
					<div className={styles.viewMenu}>
						<Tooltip content="Previous">
							<span
								className={`${styles.menuIcon} ${
									currentIdx < 0 && styles.menuIconDisabled
								}`}
								onClick={handleViewPrevious}
							>
								<ChevronUpIcon className={"h-4 w-4"} />
							</span>
						</Tooltip>
						<Tooltip content="Next">
							<span
								className={`${styles.menuIcon} ${
									currentIdx >= store.articleList.length - 1 &&
									styles.menuIconDisabled
								}`}
								onClick={handleViewNext}
							>
								<ChevronDownIcon className={"h-4 w-4"} />
							</span>
						</Tooltip>
						<Tooltip content="Beautify read">
							<span className={styles.menuIcon}>
								<PaintBrushIcon className={"h-4 w-4"} />
							</span>
						</Tooltip>
						<Tooltip content="Open in browser" position="top">
							<a
								className={styles.menuIcon}
								target="_blank"
								rel="noreferrer"
								href={(store.article?.link) as string}
							>
								<ArrowTopRightOnSquareIcon className={"h-4 w-4"} />
							</a>
						</Tooltip>
						<Tooltip content="Copy link" position="left">
							<span className={styles.menuIcon} onClick={handleCopyLink}>
								<LinkIcon className={"h-4 w-4"} />
							</span>
						</Tooltip>
					</div>
				</div>
				<div className={styles.scrollView} ref={viewRef}>
					<ArticleView article={store.article} />
				</div>
			</div>
		</div>
	);
};
