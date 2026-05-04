import { StateCreator } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { t } from "i18next";

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
  is_muted: boolean;
}

export interface SourceGroup {
  feed_title: string;
  feed_uuid: string;
  article_count: number;
  articles: TopicArticle[];
}

export interface RecentChange {
  date: string;
  title: string;
  summary: string;
  article_count: number;
  source_count: number;
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
  is_muted: boolean;
  recent_changes: RecentChange[];
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
  filterMode: "all" | "following" | "muted";
  followingTopicIds: Set<number>;
  mutedTopicIds: Set<number>;

  fetchTopics: (status?: string, sort?: string) => Promise<void>;
  fetchTopicDetail: (topicId: number | string) => Promise<void>;
  clearSelectedTopic: () => void;
  setSortMode: (mode: "relevance" | "recent" | "article_count") => void;
  setFilterMode: (mode: "all" | "following" | "muted") => void;
  followTopic: (topicId: number) => Promise<void>;
  unfollowTopic: (topicId: number) => Promise<void>;
  muteTopic: (topicId: number) => Promise<void>;
  unmuteTopic: (topicId: number) => Promise<void>;
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
  mutedTopicIds: new Set(),

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
        mutedTopicIds: new Set(topics.filter((t) => t.is_muted).map((t) => t.id)),
      });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchTopicDetail: async (topicUuid) => {
    set({ detailLoading: true, error: null });
    try {
      const detail: TopicDetail = await invoke("get_topic_detail", { topicId: String(topicUuid) });
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
    const { topics, followingTopicIds, selectedTopic } = get();
    const prevFollowing = new Set(followingTopicIds);
    const prevTopics = topics;
    const prevSelected = selectedTopic;

    // Optimistic update
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

    try {
      await invoke("follow_topic", { topicId });
      toast.success(t("layout.topics.follow_toast"));
    } catch (e) {
      // Rollback
      set({
        followingTopicIds: prevFollowing,
        topics: prevTopics,
        selectedTopic: prevSelected,
        error: String(e),
      });
    }
  },

  unfollowTopic: async (topicId) => {
    const { topics, followingTopicIds, mutedTopicIds, selectedTopic } = get();
    const prevFollowing = new Set(followingTopicIds);
    const prevMuted = new Set(mutedTopicIds);
    const prevTopics = topics;
    const prevSelected = selectedTopic;

    // Optimistic update
    const newFollowing = new Set(followingTopicIds);
    const newMuted = new Set(mutedTopicIds);
    newFollowing.delete(topicId);
    newMuted.delete(topicId);
    set({
      followingTopicIds: newFollowing,
      mutedTopicIds: newMuted,
      topics: topics.map((t) => (t.id === topicId ? { ...t, is_following: false, is_muted: false } : t)),
      selectedTopic:
        selectedTopic && selectedTopic.id === topicId
          ? { ...selectedTopic, is_following: false, is_muted: false }
          : selectedTopic,
    });

    try {
      await invoke("unfollow_topic", { topicId });
      toast.success(t("layout.topics.unfollow_toast"));
    } catch (e) {
      // Rollback
      set({
        followingTopicIds: prevFollowing,
        mutedTopicIds: prevMuted,
        topics: prevTopics,
        selectedTopic: prevSelected,
        error: String(e),
      });
    }
  },

  muteTopic: async (topicId) => {
    const { topics, mutedTopicIds, followingTopicIds, selectedTopic } = get();
    const prevMuted = new Set(mutedTopicIds);
    const prevFollowing = new Set(followingTopicIds);
    const prevTopics = topics;
    const prevSelected = selectedTopic;

    // Optimistic update
    const newMuted = new Set(mutedTopicIds);
    const newFollowing = new Set(followingTopicIds);
    newMuted.add(topicId);
    newFollowing.delete(topicId);
    set({
      mutedTopicIds: newMuted,
      followingTopicIds: newFollowing,
      topics: topics.map((t) => (t.id === topicId ? { ...t, is_following: false, is_muted: true } : t)),
      selectedTopic:
        selectedTopic && selectedTopic.id === topicId
          ? { ...selectedTopic, is_following: false, is_muted: true }
          : selectedTopic,
    });

    try {
      await invoke("mute_topic", { topicId });
    } catch (e) {
      // Rollback
      set({
        mutedTopicIds: prevMuted,
        followingTopicIds: prevFollowing,
        topics: prevTopics,
        selectedTopic: prevSelected,
        error: String(e),
      });
    }
  },

  unmuteTopic: async (topicId) => {
    const { topics, mutedTopicIds, followingTopicIds, selectedTopic } = get();
    const prevMuted = new Set(mutedTopicIds);
    const prevFollowing = new Set(followingTopicIds);
    const prevTopics = topics;
    const prevSelected = selectedTopic;

    // Optimistic update
    const newMuted = new Set(mutedTopicIds);
    const newFollowing = new Set(followingTopicIds);
    newMuted.delete(topicId);
    newFollowing.add(topicId);
    set({
      mutedTopicIds: newMuted,
      followingTopicIds: newFollowing,
      topics: topics.map((t) => (t.id === topicId ? { ...t, is_following: true, is_muted: false } : t)),
      selectedTopic:
        selectedTopic && selectedTopic.id === topicId
          ? { ...selectedTopic, is_following: true, is_muted: false }
          : selectedTopic,
    });

    try {
      await invoke("unmute_topic", { topicId });
    } catch (e) {
      // Rollback
      set({
        mutedTopicIds: prevMuted,
        followingTopicIds: prevFollowing,
        topics: prevTopics,
        selectedTopic: prevSelected,
        error: String(e),
      });
    }
  },
});
