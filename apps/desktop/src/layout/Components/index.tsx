import { ReactNode } from "react";
import { Badge, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { MainPanel } from "@/components/MainPanel";
import { SignalCard } from "@/layout/Intelligence/SignalCard";
import { TopicCard } from "@/layout/Intelligence/Topics/TopicCard";
import { ArticleItem } from "@/components/ArticleItem";
import { SearchResultCard, HighlightText } from "@/layout/Search/utils";
import type { Signal } from "@/typing/today";
import type { TopicItem } from "@/stores/topicSlice";
import type { ArticleResItem } from "@/db";

/**
 * 组件展示页（开发态）。
 * 用真实业务组件 + mock 数据渲染示例，对应 mockup 的「组件库」页，
 * 作为 mockup ↔ 代码 的对照入口，方便审查组件的可复用边界。
 */

const mockSignal: Signal = {
  id: 1,
  title: "OpenAI 开源 Agent 框架，直接挑战 LangChain 和 CrewAI 生态",
  summary:
    "OpenAI 发布了新的开源 Agent SDK，提供链式推理、工具调用和多 Agent 协作能力。这直接与 LangChain、CrewAI 等现有框架竞争。",
  why_it_matters:
    "OpenAI 入局 Agent 框架意味着该领域将从碎片化走向标准化。现有框架需要在差异化上有更清晰的定位。",
  relevance_score: 0.85,
  source_count: 3,
  sources: [
    {
      article_id: 1,
      article_uuid: "demo-src-1",
      title: "OpenAI releases open-source Agent SDK",
      link: "https://example.com/openai-agent-sdk",
      feed_title: "TechCrunch",
      feed_uuid: "demo-feed-1",
      pub_date: "2026-05-30T08:00:00Z",
      excerpt: "OpenAI ships a new open-source SDK for building agents.",
    },
    {
      article_id: 2,
      article_uuid: "demo-src-2",
      title: "社区热议 Agent 框架对比",
      link: "https://example.com/hn-agent",
      feed_title: "Hacker News",
      feed_uuid: "demo-feed-2",
      pub_date: "2026-05-30T07:00:00Z",
      excerpt: null,
    },
  ],
  topic_id: 1,
  topic_title: "AI Agent 工具链",
  topic_uuid: "demo-topic-1",
  created_at: "2026-05-30T08:00:00Z",
};

const mockTopic: TopicItem = {
  id: 1,
  uuid: "demo-topic-1",
  title: "AI Agent 工具链",
  description: "围绕 Agent SDK、工具调用、工作流编排、调试观测与多 Agent 协作的持续变化。",
  status: "active",
  article_count: 18,
  source_count: 9,
  first_seen_at: "2026-05-01T00:00:00Z",
  last_updated_at: "2026-05-30T00:00:00Z",
  is_following: true,
  is_muted: false,
  new_count: 3,
  confidence: 0.82,
};

const mockArticle: ArticleResItem = {
  id: 1,
  author: "user123",
  uuid: "demo-article-1",
  feed_uuid: "demo-feed-2",
  feed_title: "Hacker News",
  feed_logo: "",
  feed_url: "https://news.ycombinator.com",
  title: "Show HN: 自托管 RSS 阅读器，带 AI 信号检测",
  link: "https://example.com/show-hn",
  image: "",
  description:
    "一个用 Rust + React 写的自托管 RSS 阅读器，把每天的高信号聚合成 Today，并支持按主题追踪与 agent 相关讨论。",
  content: "",
  pub_date: "2026-05-30T06:00:00Z",
  create_date: "2026-05-30T06:00:00Z",
  read_status: 1,
  starred: 0,
  media_object: "",
};

function Demo(props: { label: string; source: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--gray-9)]">
          {props.label}
        </span>
        <code className="text-[10px] text-[var(--accent-11)]">{props.source}</code>
      </div>
      {props.children}
    </div>
  );
}

function Section(props: { title: string; desc: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <Heading size="3" mb="1">
        {props.title}
      </Heading>
      <Text size="2" color="gray" className="mb-4 block">
        {props.desc}
      </Text>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{props.children}</div>
    </section>
  );
}

export function ComponentsGallery() {
  const noop = () => {};

  return (
    <MainPanel>
      <div className="h-full overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[1040px]">
          <Heading size="6" mb="1">
            组件库
          </Heading>
          <Text size="2" color="gray" className="mb-8 block">
            用真实业务组件 + mock 数据渲染示例，每个都标注对应源文件，作为 mockup ↔ 代码 的对照入口。
          </Text>

          <Section
            title="基础组件 Primitives"
            desc="基于 Radix Themes 的原子组件，跨页面通用。"
          >
            <Demo label="Badge" source="@radix-ui/themes">
              <Flex gap="2" wrap="wrap">
                <Badge color="indigo">AI Agent</Badge>
                <Badge color="green">Rust</Badge>
                <Badge color="amber">待验证</Badge>
                <Badge color="blue">Apple</Badge>
              </Flex>
            </Demo>
            <Demo label="Button" source="@radix-ui/themes">
              <Flex gap="2" wrap="wrap" align="center">
                <Button>主操作</Button>
                <Button variant="soft">次操作</Button>
                <Button variant="outline">描边</Button>
                <Button variant="ghost">幽灵</Button>
              </Flex>
            </Demo>
            <Demo label="HighlightText" source="layout/Search/utils.tsx">
              <Text size="2">
                <HighlightText
                  text="HN 用户集中讨论 agent SDK 的模型绑定与调试体验。"
                  query="agent"
                />
              </Text>
            </Demo>
          </Section>

          <Section
            title="业务组件 Business Components"
            desc="承载业务语义的组合组件，已在多个页面复用，可整体抽成独立组件并配测试。"
          >
            <Demo label="SignalCard" source="layout/Intelligence/SignalCard.tsx">
              <SignalCard signal={mockSignal} />
            </Demo>
            <Demo
              label="TopicCard"
              source="layout/Intelligence/Topics/TopicCard.tsx"
            >
              <TopicCard topic={mockTopic} onClick={noop} />
            </Demo>
            <Demo label="ArticleItem" source="components/ArticleItem/index.tsx">
              <div className="rounded-md border border-[var(--gray-4)]">
                <ArticleItem article={mockArticle} />
              </div>
            </Demo>
            <Demo
              label="SearchResultCard"
              source="layout/Search/utils.tsx"
            >
              <SearchResultCard
                article={mockArticle}
                query="agent"
                onOpen={noop}
              />
            </Demo>
          </Section>
        </div>
      </div>
    </MainPanel>
  );
}

export default ComponentsGallery;
