import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TopicDetailPanel } from "../TopicDetailPanel";
import type { TopicDetail } from "@/stores/topicSlice";

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
	useNavigate: () => navigate,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

const topic: TopicDetail = {
	id: 1,
	uuid: "topic-1",
	title: "AI Agent",
	description: "Agent tooling changes",
	status: "active",
	article_count: 2,
	source_count: 1,
	first_seen_at: "2026-05-01T00:00:00Z",
	last_updated_at: "2026-05-28T00:00:00Z",
	is_following: true,
	is_muted: false,
	topic_summary: "Agent frameworks are becoming production tooling.",
	recent_changes: [
		{
			date: "2026-05-28T00:00:00Z",
			title: "OpenAI ships new SDK",
			summary: "SDK release changes framework competition.",
			article_count: 1,
			source_count: 1,
		},
	],
	articles: [
		{
			article_id: 42,
			title: "OpenAI releases Agent SDK",
			link: "https://example.com/article",
			feed_title: "TechCrunch",
			pub_date: "2026-05-28T00:00:00Z",
			relevance_score: 0.98,
			excerpt: "Agent SDK release",
		},
	],
	source_groups: [
		{
			feed_title: "TechCrunch",
			feed_uuid: "feed-1",
			article_count: 1,
			articles: [
				{
					article_id: 42,
					title: "OpenAI releases Agent SDK",
					link: "https://example.com/article",
					feed_title: "TechCrunch",
					pub_date: "2026-05-28T00:00:00Z",
					relevance_score: 0.98,
					excerpt: "Agent SDK release",
				},
			],
		},
	],
};

describe("TopicDetailPanel", () => {
	it("uses the mockup detail panel sections", () => {
		render(
			<TopicDetailPanel
				topic={topic}
				loading={false}
				followTopic={vi.fn()}
				unfollowTopic={vi.fn()}
			/>,
		);

		expect(
			screen.getByText("AI Agent").closest(".topic-detail-panel"),
		).toBeInTheDocument();
		expect(
			screen
				.getByText("layout.topics.detail.recent_changes")
				.closest(".topic-detail-card"),
		).toBeInTheDocument();
		expect(
			screen
				.getByText("layout.topics.detail.source_groups")
				.closest(".topic-detail-card"),
		).toBeInTheDocument();
		expect(
			screen
				.getByText("layout.topics.detail.start_here")
				.closest(".topic-detail-card"),
		).toBeInTheDocument();
	});

	it("opens the recommended article from Start Here", () => {
		render(
			<TopicDetailPanel
				topic={topic}
				loading={false}
				followTopic={vi.fn()}
				unfollowTopic={vi.fn()}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: /OpenAI releases Agent SDK/ }),
		);

		expect(navigate).toHaveBeenCalledWith("/local/feeds/feed-1/articles/42");
	});

	it("opens evidence directly from a recent change when an article can be resolved", () => {
		render(
			<TopicDetailPanel
				topic={topic}
				loading={false}
				followTopic={vi.fn()}
				unfollowTopic={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByText("layout.topics.detail.view_evidence"));

		expect(navigate).toHaveBeenCalledWith("/local/feeds/feed-1/articles/42");
	});

	it("uses a separated right-panel background with white detail cards", () => {
		const css = readFileSync(
			join(process.cwd(), "src/styles/custom-components.css"),
			"utf8",
		);

		expect(css).toContain(".topic-detail-panel");
		expect(css).toContain("background: var(--workbench-sidebar);");
		expect(css).toContain(".topic-detail-card");
		expect(css).toContain("background: var(--color-background);");
	});
});
