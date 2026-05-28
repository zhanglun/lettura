import { useTranslation } from "react-i18next";
import type { TopicItem } from "@/stores/topicSlice";
import { cn } from "@/helpers/cn";
import { formatRelativeTime } from "@/helpers/formatRelativeTime";

interface TopicCardProps {
	topic: TopicItem;
	onClick: (uuid: string) => void;
	onFollow?: (topicId: number) => void;
	onMute?: (topicId: number) => void;
	onUnmute?: (topicId: number) => void;
	selected?: boolean;
}

export function TopicCard({
	topic,
	onClick,
	onFollow,
	onMute,
	onUnmute,
	selected,
}: TopicCardProps) {
	const { t } = useTranslation();

	return (
		<div
			className={cn(
				"topic-card",
				selected && "topic-card--active",
				topic.is_muted && "topic-card--muted",
			)}
			onClick={() => onClick(topic.uuid)}
		>
			<div className="topic-card-head">
				<div className="min-w-0 flex items-center gap-2">
					{topic.is_following && !topic.is_muted && (
						<span className="topic-status-tag topic-status-tag--following">
							{t("layout.topics.following")}
						</span>
					)}
					{!topic.is_following && !topic.is_muted && (
						<span className="topic-status-tag topic-status-tag--discovered">
							{t("layout.topics.discovered")}
						</span>
					)}
					{topic.is_muted && (
						<span className="topic-status-tag topic-status-tag--muted">
							{t("layout.topics.muted")}
						</span>
					)}
					<span className="topic-title">{topic.title}</span>
				</div>
				<span className="topic-updated-at">
					{formatRelativeTime(topic.last_updated_at)}
				</span>
			</div>

			{topic.description && (
				<p className="topic-definition">{topic.description}</p>
			)}

			<div className="topic-meta">
				{topic.new_count > 0 && (
					<span>
						{topic.new_count} {t("layout.topics.new_changes")}
					</span>
				)}
				<span>
					{topic.source_count} {t("layout.topics.detail.sources")}
				</span>
				<span>
					{topic.article_count} {t("layout.topics.detail.articles")}
				</span>
				<span>
					{t("layout.topics.confidence", {
						confidence: Math.round(topic.confidence * 100),
					})}
				</span>
			</div>

			<div className="topic-actions">
				{topic.is_muted && onUnmute && (
					<button
						type="button"
						className="topic-action-button"
						onClick={(e) => {
							e.stopPropagation();
							onUnmute(topic.id);
						}}
					>
						{t("layout.topics.unmute")}
					</button>
				)}
				{!topic.is_following && !topic.is_muted && onFollow && (
					<button
						type="button"
						className="topic-action-button topic-action-button--primary"
						onClick={(e) => {
							e.stopPropagation();
							onFollow(topic.id);
						}}
					>
						{t("layout.topics.follow")}
					</button>
				)}
				{!topic.is_muted && onMute && (
					<button
						type="button"
						className="topic-action-button"
						onClick={(e) => {
							e.stopPropagation();
							onMute(topic.id);
						}}
					>
						{t("layout.topics.mute")}
					</button>
				)}
				{topic.new_count > 0 && (
					<button
						type="button"
						className="topic-action-button"
						onClick={(e) => {
							e.stopPropagation();
							onClick(topic.uuid);
						}}
					>
						{t("layout.topics.detail.view_evidence")}
					</button>
				)}
			</div>
		</div>
	);
}
