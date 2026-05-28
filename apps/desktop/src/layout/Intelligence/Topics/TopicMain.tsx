import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import { cn } from "@/helpers/cn";
import { RouteConfig } from "@/config";
import { TopicCard } from "./TopicCard";
import { PipelineIndicator } from "../PipelineIndicator";
import { filterTopics } from "./topicFilters";
import type { TopicFilterMode, TopicItem } from "@/stores/topicSlice";
import type { PipelineStatus } from "@/stores/createTodaySlice";

interface TopicMainProps {
	topics: TopicItem[];
	loading: boolean;
	error: string | null;
	selectedUuid?: string;
	sortMode: string;
	filterMode: TopicFilterMode;
	pipelineStatus: PipelineStatus;
	pipelineError: string | null;
	pipelineStage: string | null;
	pipelineProgress: number | null;
	aiConfig: { has_api_key: boolean } | null;
	triggerPipeline: () => void;
	lastUpdated: string | null;
	updateSettingDialogStatus: (open: boolean) => void;
	followTopic: (id: number) => void;
	muteTopic: (id: number) => void;
	unmuteTopic: (id: number) => void;
	onFilterModeChange: (mode: TopicFilterMode) => void;
	onSortModeChange: (mode: string) => void;
}

function TopicEmptyCard({
	title,
	description,
	action,
	pulsing,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
	pulsing?: boolean;
}) {
	return (
		<div className="topic-empty-surface">
			<div className="topic-empty-card">
				<Layers
					size={32}
					className={cn("topic-empty-icon", pulsing && "animate-pulse")}
				/>
				<h2 className="topic-empty-title">{title}</h2>
				{description && <p className="topic-empty-description">{description}</p>}
				{action && <div className="topic-empty-action">{action}</div>}
			</div>
		</div>
	);
}

export function TopicMain({
	topics,
	loading,
	error,
	selectedUuid,
	sortMode,
	filterMode,
	pipelineStatus,
	pipelineError,
	pipelineStage,
	pipelineProgress,
	aiConfig,
	triggerPipeline,
	lastUpdated,
	updateSettingDialogStatus,
	followTopic,
	muteTopic,
	unmuteTopic,
	onFilterModeChange,
	onSortModeChange,
}: TopicMainProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const hasApiKey = aiConfig?.has_api_key ?? false;

	const trackedTopics = useMemo(
		() => filterTopics(topics, "following"),
		[topics],
	);
	const discoveredTopics = useMemo(
		() => filterTopics(topics, "discovered"),
		[topics],
	);

	if (loading) {
		return (
			<TopicEmptyCard title={t("layout.topics.loading")} pulsing />
		);
	}

	if (error) {
		return <TopicEmptyCard title={error} />;
	}

	if (topics.length === 0) {
		return (
			<div className="h-full flex flex-col">
				<PipelineIndicator
					status={pipelineStatus}
					stage={pipelineStage}
					progress={pipelineProgress ?? undefined}
					error={pipelineError}
					onTrigger={triggerPipeline}
					onRetry={triggerPipeline}
					lastUpdated={lastUpdated}
					compact
				/>
				<TopicEmptyCard
					title={t("layout.topics.title")}
					description={
						!hasApiKey
							? t("layout.topics.empty.no_api_key_desc")
							: t("layout.topics.empty.trigger_analysis_desc")
					}
					action={
						!hasApiKey ? (
							<button
								onClick={() => updateSettingDialogStatus(true)}
								className="topic-empty-primary-button"
							>
								{t("layout.topics.empty.go_to_settings")}
							</button>
						) : (
							<button
								onClick={() => triggerPipeline()}
								className="topic-empty-primary-button"
							>
								{t("layout.topics.empty.trigger_analysis")}
							</button>
						)
					}
				/>
			</div>
		);
	}

	const filteredTopics =
		filterMode === "all" ? null : filterTopics(topics, filterMode);

	const filterModes: TopicFilterMode[] = [
		"all",
		"following",
		"discovered",
		"updated",
		"muted",
	];

	return (
		<div className="topic-main">
			{/* Header */}
			<div className="topic-page-header">
				<div className="topic-page-title-row">
					<div>
						<h1 className="topic-page-title">{t("layout.topics.title")}</h1>
						<p className="topic-page-subtitle">{t("layout.topics.subtitle")}</p>
					</div>
					<PipelineIndicator
						status={pipelineStatus}
						stage={pipelineStage}
						progress={pipelineProgress ?? undefined}
						error={pipelineError}
						onTrigger={triggerPipeline}
						onRetry={triggerPipeline}
						lastUpdated={lastUpdated}
						compact
					/>
				</div>

				{/* Hero Note */}
				<div className="topic-hero-note">
					<p>{t("layout.topics.hero_note")}</p>
				</div>

				{/* Toolbar */}
				<div className="topic-toolbar">
					{filterModes.map((mode) => (
						<button
							key={mode}
							className={cn(
								"topic-filter-button",
								filterMode === mode && "topic-filter-button--active",
							)}
							onClick={() => onFilterModeChange(mode)}
						>
							{t(`layout.topics.filter.${mode}`)}
						</button>
					))}
					<select
						value={sortMode}
						onChange={(e) => onSortModeChange(e.target.value)}
						className="topic-sort-select"
					>
						<option value="relevance">
							{t("layout.topics.sort.relevance")}
						</option>
						<option value="recent">{t("layout.topics.sort.recent")}</option>
						<option value="article_count">
							{t("layout.topics.sort.article_count")}
						</option>
					</select>
				</div>
			</div>

			{/* Topic Cards */}
			{filterMode !== "all" && filteredTopics ? (
				<div className="topic-list">
					<div className="flex flex-col">
						{filteredTopics.map((topic) => (
							<TopicCard
								key={topic.id}
								topic={topic}
								selected={selectedUuid === topic.uuid}
								onClick={(uuid) =>
									navigate(`${RouteConfig.LOCAL_TOPICS}/${uuid}`)
								}
								onFollow={(id) => followTopic(id)}
								onMute={(id) => muteTopic(id)}
								onUnmute={(id) => unmuteTopic(id)}
							/>
						))}
					</div>
				</div>
			) : (
				<>
					{trackedTopics.length > 0 && (
						<div className="topic-list-section">
							<h2 className="topic-section-title">
								{t("layout.topics.filter.tracked")}
							</h2>
							<div className="flex flex-col">
								{trackedTopics.map((topic) => (
									<TopicCard
										key={topic.id}
										topic={topic}
										selected={selectedUuid === topic.uuid}
										onClick={(uuid) =>
											navigate(`${RouteConfig.LOCAL_TOPICS}/${uuid}`)
										}
										onMute={(id) => muteTopic(id)}
									/>
								))}
							</div>
						</div>
					)}
					{discoveredTopics.length > 0 && (
						<div className="topic-list-section">
							<h2 className="topic-section-title">
								{t("layout.topics.filter.discovered")}
							</h2>
							<div className="flex flex-col">
								{discoveredTopics.map((topic) => (
									<TopicCard
										key={topic.id}
										topic={topic}
										selected={selectedUuid === topic.uuid}
										onClick={(uuid) =>
											navigate(`${RouteConfig.LOCAL_TOPICS}/${uuid}`)
										}
										onFollow={(id) => followTopic(id)}
										onMute={(id) => muteTopic(id)}
									/>
								))}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
