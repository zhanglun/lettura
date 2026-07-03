import { describe, expect, it } from "vitest";
import { filterTopics, getUpdatedTopics } from "../topicFilters";
import type { TopicItem } from "@/stores/topicSlice";

const now = new Date("2026-05-28T12:00:00Z");

const topics: TopicItem[] = [
	{
		id: 1,
		uuid: "following",
		title: "Following",
		description: null,
		status: "active",
		article_count: 1,
		source_count: 1,
		first_seen_at: "2026-05-01T00:00:00Z",
		last_updated_at: "2026-05-28T08:00:00Z",
		is_following: true,
		is_muted: false,
		new_count: 1,
		confidence: 0.8,
	},
	{
		id: 2,
		uuid: "discovered",
		title: "Discovered",
		description: null,
		status: "active",
		article_count: 1,
		source_count: 1,
		first_seen_at: "2026-05-01T00:00:00Z",
		last_updated_at: "2026-05-20T08:00:00Z",
		is_following: false,
		is_muted: false,
		new_count: 0,
		confidence: 0.8,
	},
	{
		id: 3,
		uuid: "muted",
		title: "Muted",
		description: null,
		status: "active",
		article_count: 1,
		source_count: 1,
		first_seen_at: "2026-05-01T00:00:00Z",
		last_updated_at: "bad-date",
		is_following: false,
		is_muted: true,
		new_count: 0,
		confidence: 0.8,
	},
];

describe("topicFilters", () => {
	it("returns consistent filtered topic groups", () => {
		expect(filterTopics(topics, "all", now)).toHaveLength(3);
		expect(filterTopics(topics, "following", now).map((t) => t.uuid)).toEqual([
			"following",
		]);
		expect(filterTopics(topics, "discovered", now).map((t) => t.uuid)).toEqual([
			"discovered",
		]);
		expect(filterTopics(topics, "muted", now).map((t) => t.uuid)).toEqual([
			"muted",
		]);
		expect(getUpdatedTopics(topics, now).map((t) => t.uuid)).toEqual([
			"following",
		]);
	});
});
