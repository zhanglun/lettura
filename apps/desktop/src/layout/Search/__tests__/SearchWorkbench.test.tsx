import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchFilters } from "../SearchFilters";
import { SearchInsightPanel } from "../SearchInsightPanel";
import { SearchResults } from "../SearchResults";
import type { ArticleResItem, FeedResItem } from "@/db";
import type { SignalSearchResult, TopicSearchResult } from "../types";
import type { TopicItem } from "@/stores/topicSlice";

const navigateToToday = vi.fn();
const navigateToTopic = vi.fn();
const openArticle = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, params?: Record<string, unknown>) =>
			params ? `${key}:${JSON.stringify(params)}` : key,
	}),
}));

vi.mock("@radix-ui/themes", async () => {
	const React = await import("react");
	return {
		Button: ({ children, ...props }: React.ComponentProps<"button">) => (
			<button {...props}>{children}</button>
		),
		IconButton: ({ children, ...props }: React.ComponentProps<"button">) => (
			<button {...props}>{children}</button>
		),
		TextField: {
			Root: ({
				children,
				value,
				onChange,
				onKeyDown,
				placeholder,
				...props
			}: React.ComponentProps<"input"> & { children?: React.ReactNode }) => (
				<div>
					<input
						{...props}
						value={value}
						onChange={onChange}
						onKeyDown={onKeyDown}
						placeholder={placeholder}
					/>
					{children}
				</div>
			),
			Slot: ({ children }: { children: React.ReactNode }) => <>{children}</>,
		},
		Avatar: ({ fallback }: { fallback: string }) => <span>{fallback}</span>,
	};
});

vi.mock("@/helpers/parseXML", () => ({
	getFeedLogo: vi.fn(() => ""),
}));

vi.mock("date-fns", () => ({
	formatDistanceToNow: vi.fn(() => "2 hours ago"),
	parseISO: vi.fn((value: string) => new Date(value)),
}));

const article: ArticleResItem = {
	id: 42,
	author: "",
	uuid: "article-1",
	feed_uuid: "feed-1",
	feed_title: "TechCrunch",
	feed_url: "https://example.com/rss",
	title: "OpenAI releases Agent SDK",
	link: "https://example.com/article",
	image: "",
	description: "OpenAI released an Agent SDK with tracing and tools.",
	create_date: "2026-05-28T00:00:00Z",
	read_status: 0,
	starred: 1,
	media_object: "",
};

const feed: FeedResItem = {
	item_type: "feed",
	children: [],
	uuid: "feed-1",
	title: "TechCrunch",
	link: "https://example.com",
	feed_url: "https://example.com/rss",
	description: "",
	health_status: 1,
	failure_reason: "",
	unread: 1,
};

const signal: SignalSearchResult = {
	signal_title: "Agent SDK changes toolchains",
	summary: "Signals about SDK adoption and debugging traces.",
	confidence: 0.86,
	source_count: 4,
	article_count: 7,
	topic_title: "AI Agent",
	topic_uuid: "topic-1",
};

const topic: TopicSearchResult = {
	uuid: "topic-1",
	title: "AI Agent",
	description: "Agent tooling competition",
	article_count: 18,
	source_count: 9,
	is_following: 1,
};

const relatedTopic: TopicItem = {
	id: 1,
	uuid: "topic-1",
	title: "AI Agent",
	description: "Agent tooling competition",
	status: "active",
	article_count: 18,
	source_count: 9,
	first_seen_at: "2026-05-01T00:00:00Z",
	last_updated_at: "2026-05-28T00:00:00Z",
	is_following: true,
	is_muted: false,
	new_count: 3,
	confidence: 0.88,
};

describe("Search 工作台", () => {
	it("头部筛选区使用工作台结构和可本地化标题", () => {
		render(
			<SearchFilters
				query="agent sdk"
				onQueryChange={vi.fn()}
				onSearch={vi.fn()}
				onSaveSearch={vi.fn()}
				isStarred={false}
				highSignal={false}
				onResetFilters={vi.fn()}
				onToggleStarred={vi.fn()}
				onToggleHighSignal={vi.fn()}
				startDate=""
				endDate=""
				feedUuid=""
				feeds={[feed]}
				onStartDateChange={vi.fn()}
				onEndDateChange={vi.fn()}
				onFeedChange={vi.fn()}
				hasActiveFilters={false}
				currentArticle={null}
				onCloseArticle={vi.fn()}
				onClearQuery={vi.fn()}
			/>,
		);

		expect(screen.getByText("search.title").closest(".search-header")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("search.placeholder")).toBeInTheDocument();
		expect(screen.getByText("search.filter.articles")).toBeInTheDocument();
		expect(screen.getByText("search.filter.signals")).toBeInTheDocument();
		expect(screen.getByText("search.filter.topics")).toBeInTheDocument();
	});

	it("结果区把 signal、topic 和 article 统一成工作台卡片", () => {
		render(
			<SearchResults
				resultList={[article]}
				signalResults={[signal]}
				topicResults={[topic]}
				isFetching={false}
				hasMore={false}
				query="agent"
				selectedFeed={feed}
				onLoadMore={vi.fn()}
				onOpenArticle={openArticle}
				onNavigateToToday={navigateToToday}
				onNavigateToTopic={navigateToTopic}
			/>,
		);

		expect(screen.getAllByText(/search.result_type/).length).toBeGreaterThan(1);
		expect(screen.getByText("Agent SDK changes toolchains").closest(".search-result-card")).toBeInTheDocument();
		expect(
			screen
				.getAllByText("AI Agent")
				.some((node) =>
					node.closest(".search-result-card--topic")?.className.includes("search-result-card"),
				),
		).toBe(true);
		expect(screen.getByText("OpenAI releases Agent SDK").closest(".search-result-card")).toBeInTheDocument();

		fireEvent.click(screen.getByText("OpenAI releases Agent SDK"));
		expect(openArticle).toHaveBeenCalledWith(article);
	});

	it("右侧洞察面板使用可点击相关 Topic", () => {
		render(
			<SearchInsightPanel
				searchInsight={{
					summary: "找到 3 个结果",
					details: ["集中在工具链变化"],
				}}
				relatedTopics={[relatedTopic]}
				isStarred={false}
				hasActiveFilters={false}
				onToggleStarred={vi.fn()}
				onSetDateRange={vi.fn()}
				onClearFilters={vi.fn()}
				onNavigateToTopic={navigateToTopic}
			/>,
		);

		expect(screen.getByText("search.insight.title").closest(".search-insight-panel")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /AI Agent/ }));
		expect(navigateToTopic).toHaveBeenCalledWith("topic-1");
	});
});
