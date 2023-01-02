import React from "react";
import { Article, Channel } from "./db";

interface PContext {
	channel: Channel | null;
	setChannel: (channel: Channel) => void;

	article: Article | null;
	setArticle: (article: Article) => void;
	articleList: Article[];
	setArticleList: (list: Article[]) => void;

	updateArticleAndIdx: (article: Article, idx?: number) => void;

	currentIdx: number;
	setCurrentIdx: (idx: number) => void;

	currentFilter: { id: number; title: string };
	filterList: { id: number; title: string }[];
	setFilter: any;
}

export const StoreContext = React.createContext({
	channel: null,
	article: null,
	articleList: [] as Article[],
	filterList: [
		{
			id: 0,
			title: "All",
		},
		{
			id: 1,
			title: "Unread",
		},
		{
			id: 2,
			title: "Read",
		},
	],
	currentFilter: {
		id: 1,
		title: "Unread",
	},
} as PContext);
