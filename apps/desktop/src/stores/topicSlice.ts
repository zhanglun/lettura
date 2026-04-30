import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface TopicArticle {
  article_id: number;
  title: string;
  link: string;
  feed_title: string;
  pub_date: string;
  relevance_score: number;
  excerpt: string | null;
}

export interface TopicItem {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  status: string;
  article_count: number;
  source_count: number;
  first_seen_at: string;
  last_updated_at: string;
  is_following: boolean;
}

export interface SourceGroup {
  feed_title: string;
  feed_uuid: string;
  article_count: number;
  articles: TopicArticle[];
}

export interface TopicDetail {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  status: string;
  article_count: number;
  source_count: number;
  first_seen_at: string;
  last_updated_at: string;
  is_following: boolean;
  recent_changes: string | null;
  articles: TopicArticle[];
  topic_summary?: string;
  source_groups?: SourceGroup[];
}

export interface TopicSlice {
  topics: TopicItem[];
  selectedTopic: TopicDetail | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  sortMode: "relevance" | "recent" | "article_count";
  filterMode: "all" | "following";
  followingTopicIds: Set<number>;

  fetchTopics: (status?: string, sort?: string) => Promise<void>;
  fetchTopicDetail: (topicId: number) => Promise<void>;
  clearSelectedTopic: () => void;
  setSortMode: (mode: "relevance" | "recent" | "article_count") => void;
  setFilterMode: (mode: "all" | "following") => void;
  followTopic: (topicId: number) => Promise<void>;
  unfollowTopic: (topicId: number) => Promise<void>;
}

export const createTopicSlice: StateCreator<TopicSlice> = (set, get) => ({
  topics: [],
  selectedTopic: null,
  loading: false,
  detailLoading: false,
  error: null,
  sortMode: "relevance",
  filterMode: "all",
  followingTopicIds: new Set(),

  fetchTopics: async (status, sort) => {
    set({ loading: true, error: null });
    try {
      const topics: TopicItem[] = await invoke("get_topics", {
        status: status || "active",
        sort: sort || "last_updated",
        limit: 50,
      });
      set({
        topics,
        loading: false,
        followingTopicIds: new Set(topics.filter((t) => t.is_following).map((t) => t.id)),
      });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchTopicDetail: async (topicId) => {
    set({ detailLoading: true, error: null });
    try {
      const detail: TopicDetail = await invoke("get_topic_detail", { topicId: String(topicId) });
      set({ selectedTopic: detail, detailLoading: false });
    } catch (e) {
      set({ error: String(e), detailLoading: false });
    }
  },

  clearSelectedTopic: () => {
    set({ selectedTopic: null });
  },

  setSortMode: (mode) => {
    set({ sortMode: mode });
    const sortParam = mode === "recent" ? "last_updated" : mode === "article_count" ? "article_count" : "relevance";
    get().fetchTopics("active", sortParam);
  },

  setFilterMode: (mode) => {
    set({ filterMode: mode });
  },

  followTopic: async (topicId) => {
    try {
      await invoke("follow_topic", { topicId });
      const { topics, followingTopicIds, selectedTopic } = get();
      const newFollowing = new Set(followingTopicIds);
      newFollowing.add(topicId);
      set({
        followingTopicIds: newFollowing,
        topics: topics.map((t) => (t.id === topicId ? { ...t, is_following: true } : t)),
        selectedTopic:
          selectedTopic && selectedTopic.id === topicId
            ? { ...selectedTopic, is_following: true }
            : selectedTopic,
      });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  unfollowTopic: async (topicId) => {
    try {
      await invoke("unfollow_topic", { topicId });
      const { topics, followingTopicIds, selectedTopic } = get();
      const newFollowing = new Set(followingTopicIds);
      newFollowing.delete(topicId);
      set({
        followingTopicIds: newFollowing,
        topics: topics.map((t) => (t.id === topicId ? { ...t, is_following: false } : t)),
        selectedTopic:
          selectedTopic && selectedTopic.id === topicId
            ? { ...selectedTopic, is_following: false }
            : selectedTopic,
      });
    } catch (e) {
      set({ error: String(e) });
    }
  },
});
