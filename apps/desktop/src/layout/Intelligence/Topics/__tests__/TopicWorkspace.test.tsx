import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { TopicWorkspace } from "../TopicWorkspace";

let routeUuid = "topic-a";

const store = {
	topics: [],
	selectedTopic: {
		id: 99,
		uuid: "stale-topic",
		title: "Stale topic",
		description: null,
		status: "active",
		article_count: 0,
		source_count: 0,
		first_seen_at: "2026-05-01T00:00:00Z",
		last_updated_at: "2026-05-01T00:00:00Z",
		is_following: false,
		is_muted: false,
		recent_changes: [],
		articles: [],
	},
	loading: false,
	detailLoading: false,
	error: null,
	fetchTopics: vi.fn(),
	selectTopic: vi.fn(),
	clearSelectedTopic: vi.fn(),
	sortMode: "relevance",
	filterMode: "all",
	pipelineStatus: "idle",
	pipelineError: null,
	pipelineStage: null,
	pipelineProgress: null,
	aiConfig: { has_api_key: true },
	triggerPipeline: vi.fn(),
	lastUpdated: null,
	updateSettingDialogStatus: vi.fn(),
	muteTopic: vi.fn(),
	unmuteTopic: vi.fn(),
	fetchTopicDetail: vi.fn(),
	followTopic: vi.fn(),
	unfollowTopic: vi.fn(),
	setFilterMode: vi.fn(),
	setSortMode: vi.fn(),
};

vi.mock("@/stores", () => ({
	useBearStore: (selector: (state: typeof store) => unknown) => selector(store),
}));

vi.mock("zustand/react/shallow", () => ({
	useShallow: (selector: unknown) => selector,
}));

vi.mock("react-router-dom", () => ({
	useParams: () => ({ uuid: routeUuid }),
	useNavigate: () => vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock("@tauri-apps/api/event", () => ({
	listen: vi.fn(() => Promise.resolve(vi.fn())),
}));

vi.mock("../TopicSidebar", () => ({
	TopicSidebar: () => <aside data-testid="topic-sidebar" />,
}));

vi.mock("../TopicMain", () => ({
	TopicMain: () => <main data-testid="topic-main" />,
}));

vi.mock("../TopicDetailPanel", () => ({
	TopicDetailPanel: () => <aside data-testid="topic-detail-panel" />,
}));

describe("TopicWorkspace", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		routeUuid = "topic-a";
	});

	it("clears stale selected topic before selecting a new route topic", () => {
		render(<TopicWorkspace />);

		expect(store.clearSelectedTopic).toHaveBeenCalled();
		expect(store.selectTopic).toHaveBeenCalled();
		expect(store.clearSelectedTopic.mock.invocationCallOrder[0]).toBeLessThan(
			store.selectTopic.mock.invocationCallOrder[0],
		);
		expect(store.selectTopic).toHaveBeenCalledWith("topic-a");
	});

	it("clears stale selected topic when moving back to the topic list", () => {
		const { rerender } = render(<TopicWorkspace />);

		routeUuid = undefined as unknown as string;
		rerender(<TopicWorkspace />);

		expect(store.clearSelectedTopic).toHaveBeenCalled();
	});
});
