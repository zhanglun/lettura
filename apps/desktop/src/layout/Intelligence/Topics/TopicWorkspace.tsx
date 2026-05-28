import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import { Layers } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { TopicSidebar } from "./TopicSidebar";
import { TopicMain } from "./TopicMain";
import { TopicDetailPanel } from "./TopicDetailPanel";

export function TopicWorkspace() {
	const { uuid } = useParams<{ uuid?: string }>();
	const { t } = useTranslation();

	const store = useBearStore(
		useShallow((state) => ({
			topics: state.topics,
			selectedTopic: state.selectedTopic,
			loading: state.loading,
			detailLoading: state.detailLoading,
			error: state.error,
			fetchTopics: state.fetchTopics,
			selectTopic: state.selectTopic,
			clearSelectedTopic: state.clearSelectedTopic,
			sortMode: state.sortMode,
			filterMode: state.filterMode,
			pipelineStatus: state.pipelineStatus,
			pipelineError: state.pipelineError,
			pipelineStage: state.pipelineStage,
			pipelineProgress: state.pipelineProgress,
			aiConfig: state.aiConfig,
			triggerPipeline: state.triggerPipeline,
			lastUpdated: state.lastUpdated,
			updateSettingDialogStatus: state.updateSettingDialogStatus,
			muteTopic: state.muteTopic,
			unmuteTopic: state.unmuteTopic,
			fetchTopicDetail: state.fetchTopicDetail,
			followTopic: state.followTopic,
			unfollowTopic: state.unfollowTopic,
			setFilterMode: state.setFilterMode,
			setSortMode: state.setSortMode,
		})),
	);

	useEffect(() => {
		store.clearSelectedTopic();
		if (uuid) {
			store.selectTopic(uuid);
		}
	}, [uuid]);

	useEffect(() => {
		store.fetchTopics("active", store.sortMode || "last_updated");
	}, [store.sortMode]);

	useEffect(() => {
		let cancelled = false;
		const unsubs: (() => void)[] = [];

		listen("pipeline:completed", () => {
			if (!cancelled) {
				store.fetchTopics();
			}
		}).then((unlisten) => {
			if (!cancelled) {
				unsubs.push(unlisten);
			} else {
				unlisten();
			}
		});

		return () => {
			cancelled = true;
			unsubs.forEach((unsub) => unsub());
		};
	}, []);

	const hasSelection = !!store.selectedTopic;

	return (
		<div
			className="grid h-full"
			style={{
				gridTemplateColumns: "236px minmax(360px, 1fr) 420px",
				gridTemplateRows: "1fr",
			}}
		>
			{/* Left: Topic Sidebar */}
			<TopicSidebar
				topics={store.topics}
				filterMode={store.filterMode}
				setFilterMode={store.setFilterMode}
				sortMode={store.sortMode}
				setSortMode={store.setSortMode}
				selectedUuid={uuid}
				pipelineStatus={store.pipelineStatus}
				lastUpdated={store.lastUpdated}
				aiConfig={store.aiConfig}
			/>

			{/* Center: Topic Main (card list) */}
			<TopicMain
				topics={store.topics}
				loading={store.loading}
				error={store.error}
				selectedUuid={uuid}
				sortMode={store.sortMode}
				filterMode={store.filterMode}
				pipelineStatus={store.pipelineStatus}
				pipelineError={store.pipelineError}
				pipelineStage={store.pipelineStage}
				pipelineProgress={store.pipelineProgress}
				aiConfig={store.aiConfig}
				triggerPipeline={store.triggerPipeline}
				lastUpdated={store.lastUpdated}
				updateSettingDialogStatus={store.updateSettingDialogStatus}
				followTopic={store.followTopic}
				muteTopic={store.muteTopic}
				unmuteTopic={store.unmuteTopic}
				onFilterModeChange={store.setFilterMode}
				onSortModeChange={(mode) =>
					store.setSortMode(mode as "relevance" | "recent" | "article_count")
				}
			/>

			{/* Right: Detail Panel or Placeholder */}
			{hasSelection ? (
				<TopicDetailPanel
					topic={store.selectedTopic!}
					loading={store.detailLoading}
					followTopic={store.followTopic}
					unfollowTopic={store.unfollowTopic}
				/>
			) : (
				<aside className="flex flex-col items-center justify-center border-l border-[var(--gray-4)] bg-[var(--color-background)] overflow-hidden">
					<Layers size={48} className="mb-4 text-[var(--gray-8)]" />
					<Text size="2" className="text-[var(--gray-9)]">
						{t("layout.topics.detail.select_prompt")}
					</Text>
				</aside>
			)}
		</div>
	);
}
