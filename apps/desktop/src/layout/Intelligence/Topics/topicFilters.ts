import type { TopicFilterMode, TopicItem } from "@/stores/topicSlice";

const UPDATED_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getUpdatedTopics(
	topics: TopicItem[],
	now: Date = new Date(),
): TopicItem[] {
	const nowMs = now.getTime();
	if (!Number.isFinite(nowMs)) {
		return [];
	}

	return topics.filter((topic) => {
		const updatedAt = new Date(topic.last_updated_at).getTime();
		return Number.isFinite(updatedAt) && nowMs - updatedAt < UPDATED_WINDOW_MS;
	});
}

export function filterTopics(
	topics: TopicItem[],
	mode: TopicFilterMode,
	now: Date = new Date(),
): TopicItem[] {
	switch (mode) {
		case "following":
			return topics.filter((topic) => topic.is_following);
		case "discovered":
			return topics.filter((topic) => !topic.is_following && !topic.is_muted);
		case "updated":
			return getUpdatedTopics(topics, now);
		case "muted":
			return topics.filter((topic) => topic.is_muted);
		case "all":
		default:
			return topics;
	}
}
