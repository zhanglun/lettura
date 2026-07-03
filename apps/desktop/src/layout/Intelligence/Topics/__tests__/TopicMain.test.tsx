import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TopicMain } from "../TopicMain";
import type { TopicItem } from "@/stores/topicSlice";

vi.mock("react-router-dom", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock("../PipelineIndicator", () => ({
	PipelineIndicator: () => <div data-testid="pipeline-indicator" />,
}));

const baseTopic: TopicItem = {
	id: 1,
	uuid: "topic-1",
	title: "AI Agent",
	description: "Agent tooling changes",
	status: "active",
	article_count: 8,
	source_count: 3,
	first_seen_at: "2026-05-01T00:00:00Z",
	last_updated_at: new Date().toISOString(),
	is_following: false,
	is_muted: false,
	new_count: 2,
	confidence: 0.85,
};

function makeTopicMainProps(
	overrides: Partial<React.ComponentProps<typeof TopicMain>> = {},
) {
	const props: React.ComponentProps<typeof TopicMain> = {
		topics: [baseTopic],
		loading: false,
		error: null,
		selectedUuid: undefined,
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
		followTopic: vi.fn(),
		muteTopic: vi.fn(),
		unmuteTopic: vi.fn(),
		onFilterModeChange: vi.fn(),
		onSortModeChange: vi.fn(),
		...overrides,
	};

	return props;
}

function renderTopicMain(
	overrides: Partial<React.ComponentProps<typeof TopicMain>> = {},
) {
	const props = makeTopicMainProps(overrides);

	render(<TopicMain {...props} />);
	return props;
}

describe("TopicMain", () => {
	it("exposes the full topic filter set from the mockup", () => {
		const props = renderTopicMain();

		fireEvent.click(
			screen.getByRole("button", { name: "layout.topics.filter.discovered" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "layout.topics.filter.updated" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "layout.topics.filter.muted" }),
		);

		expect(props.onFilterModeChange).toHaveBeenCalledWith("discovered");
		expect(props.onFilterModeChange).toHaveBeenCalledWith("updated");
		expect(props.onFilterModeChange).toHaveBeenCalledWith("muted");
	});

	it("uses the topic tracking surface structure", () => {
		renderTopicMain();

		expect(
			screen.getByText("layout.topics.title").closest(".topic-main"),
		).toBeInTheDocument();
		expect(
			screen.getByText("layout.topics.hero_note").closest(".topic-hero-note"),
		).toBeInTheDocument();
		expect(
			screen.getByText("AI Agent").closest(".topic-card"),
		).toBeInTheDocument();
	});

	it("uses the topic card language for the no topic state", () => {
		renderTopicMain({ topics: [] });

		expect(
			screen.getByText("layout.topics.title").closest(".topic-empty-card"),
		).toBeInTheDocument();
	});

	it("uses the topic card language for loading and error states", () => {
		const { rerender } = render(
			<TopicMain {...makeTopicMainProps({ loading: true })} />,
		);

		expect(
			screen.getByText("layout.topics.loading").closest(".topic-empty-card"),
		).toBeInTheDocument();

		rerender(
			<TopicMain
				{...makeTopicMainProps({
					loading: false,
					error: "load failed",
				})}
			/>,
		);

		expect(
			screen.getByText("load failed").closest(".topic-empty-card"),
		).toBeInTheDocument();
	});
});
