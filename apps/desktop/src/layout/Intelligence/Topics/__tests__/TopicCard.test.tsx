import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TopicCard } from "../TopicCard";
import type { TopicItem } from "@/stores/topicSlice";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

const topic: TopicItem = {
	id: 1,
	uuid: "topic-1",
	title: "AI Agent",
	description: "Agent tooling changes",
	status: "active",
	article_count: 18,
	source_count: 9,
	first_seen_at: "2026-05-01T00:00:00Z",
	last_updated_at: "2026-05-28T00:00:00Z",
	is_following: true,
	is_muted: false,
	new_count: 4,
	confidence: 0.86,
};

describe("TopicCard", () => {
	it("uses the mockup topic card structure and action row", () => {
		render(
			<TopicCard topic={topic} selected onClick={vi.fn()} onMute={vi.fn()} />,
		);

		expect(
			screen.getByText("AI Agent").closest(".topic-card"),
		).toBeInTheDocument();
		expect(screen.getByText("AI Agent").className).toContain("topic-title");
		expect(screen.getByText("Agent tooling changes").className).toContain(
			"topic-definition",
		);
		expect(
			screen.getByText("layout.topics.following").closest("span")?.className,
		).toContain("topic-status-tag");
		expect(
			screen.getByText("layout.topics.mute").closest("button")?.className,
		).toContain("topic-action-button");
		expect(
			screen.getByText("layout.topics.detail.view_evidence").closest("button")
				?.className,
		).toContain("topic-action-button");
	});

	it("keeps action clicks from opening the topic", () => {
		const onClick = vi.fn();
		const onMute = vi.fn();
		render(<TopicCard topic={topic} onClick={onClick} onMute={onMute} />);

		fireEvent.click(screen.getByText("layout.topics.mute"));

		expect(onMute).toHaveBeenCalledWith(topic.id);
		expect(onClick).not.toHaveBeenCalled();
	});

	it("lets discovered topics be followed or muted from the card", () => {
		const onClick = vi.fn();
		const onFollow = vi.fn();
		const onMute = vi.fn();
		render(
			<TopicCard
				topic={{ ...topic, is_following: false, new_count: 0 }}
				onClick={onClick}
				onFollow={onFollow}
				onMute={onMute}
			/>,
		);

		fireEvent.click(screen.getByText("layout.topics.follow"));
		fireEvent.click(screen.getByText("layout.topics.mute"));

		expect(onFollow).toHaveBeenCalledWith(topic.id);
		expect(onMute).toHaveBeenCalledWith(topic.id);
		expect(onClick).not.toHaveBeenCalled();
	});

	it("defines stable topic card border and hover styles", () => {
		const css = readFileSync(
			join(process.cwd(), "src/styles/custom-components.css"),
			"utf8",
		);

		expect(css).toContain(".topic-card");
		expect(css).toContain("border: 1px solid #e4e7ed;");
		expect(css).toContain(".topic-card:hover");
		expect(css).toContain("border-color: #cdd2dc;");
		expect(css).toContain(".topic-card--active:hover");
		expect(css).toContain("border-color: #6366f1;");
		expect(css).not.toContain(
			".topic-card--active {\n    border-color: #6366f1;\n    border-width: 2px;",
		);
		expect(css).toContain("inset 0 0 0 1px #6366f1");
	});
});
