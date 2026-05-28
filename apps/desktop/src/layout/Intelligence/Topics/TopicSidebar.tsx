import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Text } from "@radix-ui/themes";
import { cn } from "@/helpers/cn";
import type { TopicFilterMode, TopicItem } from "@/stores/topicSlice";
import type { PipelineStatus } from "@/stores/createTodaySlice";
import { RouteConfig } from "@/config";
import { filterTopics } from "./topicFilters";

interface TopicSidebarProps {
	topics: TopicItem[];
	filterMode: TopicFilterMode;
	setFilterMode: (mode: TopicFilterMode) => void;
	sortMode: string;
	setSortMode: (mode: "relevance" | "recent" | "article_count") => void;
	selectedUuid?: string;
	pipelineStatus: PipelineStatus;
	lastUpdated: string | null;
	aiConfig: { has_api_key: boolean } | null;
}

export function TopicSidebar({
	topics,
	filterMode,
	setFilterMode,
	selectedUuid,
	pipelineStatus,
	lastUpdated,
}: TopicSidebarProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const tracked = filterTopics(topics, "following");
	const discovered = filterTopics(topics, "discovered");
	const muted = filterTopics(topics, "muted");
	const updated = filterTopics(topics, "updated");

	const filters: Array<{ key: TopicFilterMode; label: string; count: number }> =
		[
			{
				key: "all",
				label: t("layout.topics.sidebar.filter_all"),
				count: topics.length,
			},
			{
				key: "following",
				label: t("layout.topics.sidebar.filter_tracked"),
				count: tracked.length,
			},
			{
				key: "discovered",
				label: t("layout.topics.sidebar.filter_discovered"),
				count: discovered.length,
			},
			{
				key: "updated",
				label: t("layout.topics.sidebar.filter_updated"),
				count: updated.length,
			},
			{
				key: "muted",
				label: t("layout.topics.sidebar.filter_muted"),
				count: muted.length,
			},
		];

	const trackedForPick = tracked.slice(0, 5);

	return (
		<aside className="flex flex-col h-full min-h-0 border-r border-[var(--gray-4)] bg-[var(--gray-2)]">
			<div className="px-4 pt-5 pb-3">
				<Text size="4" weight="bold" className="text-[var(--gray-12)] block">
					{t("layout.topics.title")}
				</Text>
				<Text
					size="1"
					className="text-[var(--gray-9)] mt-1 block leading-relaxed"
				>
					{t("layout.topics.sidebar.desc")}
				</Text>
			</div>

			<div className="px-3 py-2">
				<Text
					size="1"
					weight="medium"
					className="text-[var(--gray-9)] uppercase tracking-wide px-1 block mb-1.5"
				>
					{t("layout.topics.sidebar.status")}
				</Text>
				<div className="flex flex-col gap-0.5">
					{filters.map((f) => (
						<button
							key={f.key}
							className={cn(
								"flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors w-full text-left",
								filterMode === f.key
									? "bg-[var(--accent-a3)] text-[var(--accent-11)]"
									: "text-[var(--gray-11)] hover:bg-[var(--gray-3)]",
							)}
							onClick={() => setFilterMode(f.key)}
						>
							<span>{f.label}</span>
							<span
								className={cn(
									"text-[10px] tabular-nums",
									filterMode === f.key
										? "text-[var(--accent-9)]"
										: "text-[var(--gray-8)]",
								)}
							>
								{f.count}
							</span>
						</button>
					))}
				</div>
			</div>

			{trackedForPick.length > 0 && (
				<div className="px-3 py-2 flex-1 overflow-auto">
					<Text
						size="1"
						weight="medium"
						className="text-[var(--gray-9)] uppercase tracking-wide px-1 block mb-1.5"
					>
						{t("layout.topics.sidebar.tracked_topics")}
					</Text>
					<div className="flex flex-col gap-0.5">
						{trackedForPick.map((topic) => (
							<button
								key={topic.id}
								className={cn(
									"flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors w-full text-left",
									selectedUuid === topic.uuid
										? "bg-[var(--accent-a3)] text-[var(--accent-11)]"
										: "text-[var(--gray-11)] hover:bg-[var(--gray-3)]",
								)}
								onClick={() =>
									navigate(`${RouteConfig.LOCAL_TOPICS}/${topic.uuid}`)
								}
							>
								<span className="truncate">
									{topic.title}
									{topic.new_count > 0 && (
										<small className="block text-[var(--gray-8)] font-normal text-[10px]">
											{topic.new_count} {t("layout.topics.new_changes")}
										</small>
									)}
								</span>
							</button>
						))}
					</div>
				</div>
			)}

			<div className="px-4 py-3 border-t border-[var(--gray-4)] text-[10px] text-[var(--gray-8)]">
				{lastUpdated && (
					<span>
						{t("layout.topics.sidebar.last_analysis", { time: lastUpdated })} ·{" "}
						{t("layout.topics.sidebar.covering", {
							count: topics.reduce((sum, t) => sum + t.article_count, 0),
						})}
					</span>
				)}
			</div>
		</aside>
	);
}
