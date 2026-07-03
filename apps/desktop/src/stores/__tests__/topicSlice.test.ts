import { beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { createTopicSlice } from "../topicSlice";
import type { TopicDetail, TopicSlice } from "../topicSlice";

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

function topicDetail(id: number, uuid: string): TopicDetail {
	return {
		id,
		uuid,
		title: uuid,
		description: null,
		status: "active",
		article_count: 0,
		source_count: 0,
		first_seen_at: "2026-05-01T00:00:00Z",
		last_updated_at: "2026-05-28T00:00:00Z",
		is_following: false,
		is_muted: false,
		recent_changes: [],
		articles: [],
	};
}

describe("createTopicSlice", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("只允许最后一次 topic 详情请求写入选中详情", async () => {
		const first = deferred<TopicDetail>();
		const second = deferred<TopicDetail>();
		(invoke as ReturnType<typeof vi.fn>)
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);

		const store = create<TopicSlice>(createTopicSlice);
		const firstRequest = store.getState().fetchTopicDetail("topic-a");
		const secondRequest = store.getState().fetchTopicDetail("topic-b");

		second.resolve(topicDetail(2, "topic-b"));
		await secondRequest;
		expect(store.getState().selectedTopic?.uuid).toBe("topic-b");

		first.resolve(topicDetail(1, "topic-a"));
		await firstRequest;
		expect(store.getState().selectedTopic?.uuid).toBe("topic-b");
	});
});
