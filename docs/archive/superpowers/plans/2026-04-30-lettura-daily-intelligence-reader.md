# Lettura Daily Intelligence Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Lettura from a traditional RSS reader into a Daily Intelligence Reader with a three-panel Today page (signal cards + right panel + inline reading), context-aware sidebar per page, enhanced Topics pages with right panels, and Calm Intelligence visual direction.

**Architecture:** The right panel is managed within each page component (TodayPage, TopicDetailPage), NOT at the AppLayout level. AppLayout stays as `Rail + Sidebar + Outlet`. TodayPage internally renders as `MainContent + RightPanel`. The sidebar receives a `context` prop that changes content per page. All new state lives in the existing Zustand store slices (`createTodaySlice`, `topicSlice`). New components follow the existing pattern: Radix UI primitives, Tailwind CSS classes, i18n via `useTranslation`, `@/` path alias.

**Tech Stack:** React 18, TypeScript, Zustand, Radix UI Themes, Tailwind CSS, React Router v6, i18next, Vitest + React Testing Library, Tauri v2 IPC (`invoke`).

---

## File Structure

### New Files to Create

| File | Responsibility |
|------|---------------|
| `apps/desktop/src/layout/Intelligence/RightPanel.tsx` | Right panel shell with collapsed (280px) and expanded (480px) width states |
| `apps/desktop/src/layout/Intelligence/EvidencePanel.tsx` | Shows source evidence for the selected/highlighted signal in right panel |
| `apps/desktop/src/layout/Intelligence/DailyStatus.tsx` | Shows today's sync/analysis status in right panel |
| `apps/desktop/src/layout/Intelligence/NextSteps.tsx` | Shows next-step suggestions in right panel |
| `apps/desktop/src/layout/Intelligence/InlineReader.tsx` | Article reading view embedded in expanded right panel |
| `apps/desktop/src/components/layout/SidebarToday.tsx` | Sidebar content for Today page context |
| `apps/desktop/src/components/layout/SidebarTopics.tsx` | Sidebar content for Topics page context |
| `apps/desktop/src/components/layout/SidebarFeeds.tsx` | Sidebar content for Feeds page context |
| `apps/desktop/src/layout/Intelligence/Topics/TopicRightPanel.tsx` | Right panel for Topic detail page (source distribution) |
| `apps/desktop/src/stores/__tests__/createTodaySlice.inlineReading.test.ts` | Tests for inline reading state |
| `apps/desktop/src/layout/Intelligence/__tests__/RightPanel.test.tsx` | Tests for RightPanel component |
| `apps/desktop/src/layout/Intelligence/__tests__/InlineReader.test.tsx` | Tests for InlineReader component |
| `apps/desktop/src/layout/Intelligence/__tests__/EvidencePanel.test.tsx` | Tests for EvidencePanel |
| `apps/desktop/src/layout/Intelligence/__tests__/DailyStatus.test.tsx` | Tests for DailyStatus |
| `apps/desktop/src/layout/Intelligence/__tests__/NextSteps.test.tsx` | Tests for NextSteps |
| `apps/desktop/src/components/layout/__tests__/Sidebar.context.test.tsx` | Tests for sidebar context switching |

### Files to Modify

| File | Change |
|------|--------|
| `apps/desktop/src/stores/createTodaySlice.ts` | Add inline reading state fields and actions |
| `apps/desktop/src/stores/index.ts` | No change needed (already includes TodaySlice) |
| `apps/desktop/src/layout/Intelligence/TodayPage.tsx` | Refactor to three-panel layout: MainContent + RightPanel |
| `apps/desktop/src/layout/Intelligence/SignalCard.tsx` | Add signal level indicator, confidence bar, active signal highlighting, dimming |
| `apps/desktop/src/layout/Intelligence/SignalList.tsx` | Pass `activeReadingSignalId` for dimming inactive signals |
| `apps/desktop/src/layout/Intelligence/SignalSourceItem.tsx` | Add `onInlineRead` callback prop for Today inline reading |
| `apps/desktop/src/layout/Intelligence/SignalSourceList.tsx` | Pass `onInlineRead` through to items |
| `apps/desktop/src/components/layout/Sidebar.tsx` | Accept `context` prop, render context-specific sidebar content |
| `apps/desktop/src/components/layout/AppLayout.tsx` | Pass current route context to Sidebar via `useLocation` |
| `apps/desktop/src/layout/Intelligence/Topics/TopicListPage.tsx` | Wrap in MainPanel, no other functional change |
| `apps/desktop/src/layout/Intelligence/Topics/TopicDetailPage.tsx` | Add right panel with source distribution, change article navigation |
| `apps/desktop/src/layout/Intelligence/Topics/TopicArticleItem.tsx` | Change from `window.open` to accepting an `onClick` callback |
| `apps/desktop/src/locales/en.json` | Add i18n keys for new components |
| `apps/desktop/src/locales/zh.json` | Add i18n keys for new components (Chinese) |
| `apps/desktop/src/styles/custom-theme.css` | Add Calm Intelligence CSS custom properties |
| `apps/desktop/src/styles/custom-components.css` | Add right-panel transition component classes |

---

### Task 1: TodaySlice Store Extension — Inline Reading State

**Files:**
- Create: `apps/desktop/src/stores/__tests__/createTodaySlice.inlineReading.test.ts`
- Modify: `apps/desktop/src/stores/createTodaySlice.ts:59-96` (TodaySlice interface)
- Modify: `apps/desktop/src/stores/createTodaySlice.ts:98-230` (implementation)

- [ ] **Step 1: Write the failing tests**

Create `apps/desktop/src/stores/__tests__/createTodaySlice.inlineReading.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { create } from "zustand";
import { createTodaySlice } from "../createTodaySlice";
import type { TodaySlice } from "../createTodaySlice";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("createTodaySlice — inline reading state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T-IR-01: initial state has no active reading", () => {
    const store = create<TodaySlice>(createTodaySlice);
    const state = store.getState();

    expect(state.activeReadingSignalId).toBeNull();
    expect(state.activeReadingSourceIndex).toBe(0);
    expect(state.isInlineReading).toBe(false);
    expect(state.rightPanelExpanded).toBe(false);
  });

  it("T-IR-02: startInlineReading sets signalId, sourceIndex, isInlineReading, rightPanelExpanded", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42, 1);

    const state = store.getState();
    expect(state.activeReadingSignalId).toBe(42);
    expect(state.activeReadingSourceIndex).toBe(1);
    expect(state.isInlineReading).toBe(true);
    expect(state.rightPanelExpanded).toBe(true);
  });

  it("T-IR-03: startInlineReading defaults sourceIndex to 0 when omitted", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42);

    expect(store.getState().activeReadingSourceIndex).toBe(0);
  });

  it("T-IR-04: closeInlineReading resets all reading state", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42, 2);
    store.getState().closeInlineReading();

    const state = store.getState();
    expect(state.activeReadingSignalId).toBeNull();
    expect(state.activeReadingSourceIndex).toBe(0);
    expect(state.isInlineReading).toBe(false);
    expect(state.rightPanelExpanded).toBe(false);
  });

  it("T-IR-05: navigateReadingSource changes sourceIndex", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42, 0);
    store.getState().navigateReadingSource(2);

    expect(store.getState().activeReadingSourceIndex).toBe(2);
  });

  it("T-IR-06: navigateReadingSource does nothing when not inline reading", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().navigateReadingSource(5);

    expect(store.getState().activeReadingSourceIndex).toBe(0);
  });

  it("T-IR-07: startInlineReading for a new signal resets sourceIndex to 0", () => {
    const store = create<TodaySlice>(createTodaySlice);

    store.getState().startInlineReading(42, 3);
    store.getState().startInlineReading(99);

    expect(store.getState().activeReadingSignalId).toBe(99);
    expect(store.getState().activeReadingSourceIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- apps/desktop/src/stores/__tests__/createTodaySlice.inlineReading.test.ts --reporter verbose`
Expected: FAIL — `activeReadingSignalId` does not exist on type `TodaySlice`

- [ ] **Step 3: Extend the TodaySlice interface and implementation**

In `apps/desktop/src/stores/createTodaySlice.ts`, add the new fields to the `TodaySlice` interface (after line 83, the `scrollPositionMap` field):

```typescript
  // Inline reading state
  activeReadingSignalId: number | null;
  activeReadingSourceIndex: number;
  isInlineReading: boolean;
  rightPanelExpanded: boolean;

  startInlineReading: (signalId: number, sourceIndex?: number) => void;
  closeInlineReading: () => void;
  navigateReadingSource: (index: number) => void;
```

In the same file, add the initial values and implementations to the `createTodaySlice` function. After line 121 (`scrollPositionMap: {},`), add:

```typescript
  activeReadingSignalId: null,
  activeReadingSourceIndex: 0,
  isInlineReading: false,
  rightPanelExpanded: false,

  startInlineReading: (signalId, sourceIndex = 0) => {
    set((state) => {
      const isNewSignal = state.activeReadingSignalId !== signalId;
      return {
        activeReadingSignalId: signalId,
        activeReadingSourceIndex: isNewSignal ? 0 : sourceIndex,
        isInlineReading: true,
        rightPanelExpanded: true,
      };
    });
  },

  closeInlineReading: () => {
    set({
      activeReadingSignalId: null,
      activeReadingSourceIndex: 0,
      isInlineReading: false,
      rightPanelExpanded: false,
    });
  },

  navigateReadingSource: (index) => {
    const { isInlineReading } = get();
    if (!isInlineReading) return;
    set({ activeReadingSourceIndex: index });
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- apps/desktop/src/stores/__tests__/createTodaySlice.inlineReading.test.ts --reporter verbose`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/stores/createTodaySlice.ts apps/desktop/src/stores/__tests__/createTodaySlice.inlineReading.test.ts
git commit -m "feat(today): add inline reading state to TodaySlice"
```

---

### Task 2: RightPanel Component

**Files:**
- Create: `apps/desktop/src/layout/Intelligence/RightPanel.tsx`
- Create: `apps/desktop/src/layout/Intelligence/__tests__/RightPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/desktop/src/layout/Intelligence/__tests__/RightPanel.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RightPanel } from "../RightPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe("RightPanel", () => {
  it("should render collapsed content when not expanded", () => {
    render(
      <RightPanel expanded={false}>
        <div data-testid="collapsed-content">Collapsed</div>
      </RightPanel>,
    );

    expect(screen.getByTestId("collapsed-content")).toBeInTheDocument();
    // Collapsed width is 280px
    const panel = screen.getByTestId("right-panel");
    expect(panel.style.width).toBe("280px");
  });

  it("should render expanded content when expanded", () => {
    render(
      <RightPanel expanded={true}>
        <div data-testid="expanded-content">Expanded</div>
      </RightPanel>,
    );

    expect(screen.getByTestId("expanded-content")).toBeInTheDocument();
    // Expanded width is 480px
    const panel = screen.getByTestId("right-panel");
    expect(panel.style.width).toBe("480px");
  });

  it("should apply transition class for smooth width change", () => {
    render(
      <RightPanel expanded={false}>
        <div>Content</div>
      </RightPanel>,
    );

    const panel = screen.getByTestId("right-panel");
    expect(panel.className).toContain("transition-all");
  });

  it("should have correct base styling", () => {
    render(
      <RightPanel expanded={false}>
        <div>Content</div>
      </RightPanel>,
    );

    const panel = screen.getByTestId("right-panel");
    expect(panel.className).toContain("border-l");
    expect(panel.className).toContain("overflow-hidden");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- apps/desktop/src/layout/Intelligence/__tests__/RightPanel.test.tsx --reporter verbose`
Expected: FAIL — Cannot find module `../RightPanel`

- [ ] **Step 3: Create the RightPanel component**

Create `apps/desktop/src/layout/Intelligence/RightPanel.tsx`:

```typescript
import { ReactNode } from "react";

interface RightPanelProps {
  expanded: boolean;
  children: ReactNode;
}

export function RightPanel({ expanded, children }: RightPanelProps) {
  return (
    <div
      data-testid="right-panel"
      className="h-full border-l border-[var(--gray-4)] bg-[var(--gray-1)] overflow-hidden transition-all duration-300 ease-in-out shrink-0 flex flex-col"
      style={{ width: expanded ? "480px" : "280px" }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- apps/desktop/src/layout/Intelligence/__tests__/RightPanel.test.tsx --reporter verbose`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/layout/Intelligence/RightPanel.tsx apps/desktop/src/layout/Intelligence/__tests__/RightPanel.test.tsx
git commit -m "feat(today): add RightPanel component with collapsed/expanded states"
```

---

### Task 3: EvidencePanel + DailyStatus + NextSteps Components

**Files:**
- Create: `apps/desktop/src/layout/Intelligence/EvidencePanel.tsx`
- Create: `apps/desktop/src/layout/Intelligence/DailyStatus.tsx`
- Create: `apps/desktop/src/layout/Intelligence/NextSteps.tsx`
- Create: `apps/desktop/src/layout/Intelligence/__tests__/EvidencePanel.test.tsx`
- Create: `apps/desktop/src/layout/Intelligence/__tests__/DailyStatus.test.tsx`
- Create: `apps/desktop/src/layout/Intelligence/__tests__/NextSteps.test.tsx`

- [ ] **Step 1: Write the failing tests for EvidencePanel**

Create `apps/desktop/src/layout/Intelligence/__tests__/EvidencePanel.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidencePanel } from "../EvidencePanel";
import type { Signal } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const baseSignal: Signal = {
  id: 1,
  title: "Test Signal",
  summary: "Summary",
  why_it_matters: "WIM",
  relevance_score: 0.85,
  source_count: 3,
  sources: [
    { article_id: 1, article_uuid: "u1", title: "Source 1", link: "https://a.com/1", feed_title: "Feed A", feed_uuid: "fa", pub_date: "2026-04-30T10:00:00Z", excerpt: null },
    { article_id: 2, article_uuid: "u2", title: "Source 2", link: "https://b.com/2", feed_title: "Feed B", feed_uuid: "fb", pub_date: "2026-04-30T11:00:00Z", excerpt: "Excerpt" },
    { article_id: 3, article_uuid: "u3", title: "Source 3", link: "https://c.com/3", feed_title: "Feed C", feed_uuid: "fc", pub_date: "2026-04-30T12:00:00Z", excerpt: null },
  ],
  topic_id: null,
  topic_title: null,
  created_at: "2026-04-30T09:00:00Z",
};

describe("EvidencePanel", () => {
  it("should render null when no signal provided", () => {
    const { container } = render(<EvidencePanel signal={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("should render signal title and source count", () => {
    render(<EvidencePanel signal={baseSignal} />);

    expect(screen.getByText("today.right_panel.evidence_title")).toBeInTheDocument();
    expect(screen.getByText("3 today.signal_card.sources")).toBeInTheDocument();
  });

  it("should render source titles", () => {
    render(<EvidencePanel signal={baseSignal} />);

    expect(screen.getByText("Source 1")).toBeInTheDocument();
    expect(screen.getByText("Source 2")).toBeInTheDocument();
    expect(screen.getByText("Source 3")).toBeInTheDocument();
  });

  it("should show feed titles as labels", () => {
    render(<EvidencePanel signal={baseSignal} />);

    expect(screen.getByText("Feed A")).toBeInTheDocument();
    expect(screen.getByText("Feed B")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write the failing tests for DailyStatus**

Create `apps/desktop/src/layout/Intelligence/__tests__/DailyStatus.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyStatus } from "../DailyStatus";
import type { TodayOverview } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe("DailyStatus", () => {
  it("should render loading state", () => {
    render(<DailyStatus overview={null} loading={true} />);

    expect(screen.getByText("today.right_panel.daily_status.title")).toBeInTheDocument();
  });

  it("should render overview stats when available", () => {
    const overview: TodayOverview = {
      summary: "3 signals found",
      signal_count: 3,
      article_count: 12,
      generated_at: "2026-04-30T10:00:00Z",
      is_stale: false,
    };

    render(<DailyStatus overview={overview} loading={false} />);

    expect(screen.getByText("3")).toBeInTheDocument(); // signal_count
    expect(screen.getByText("12")).toBeInTheDocument(); // article_count
  });

  it("should render empty state when no overview and not loading", () => {
    render(<DailyStatus overview={null} loading={false} />);

    expect(screen.getByText("today.right_panel.daily_status.no_data")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- apps/desktop/src/layout/Intelligence/__tests__/EvidencePanel.test.tsx apps/desktop/src/layout/Intelligence/__tests__/DailyStatus.test.tsx --reporter verbose`
Expected: FAIL — Cannot find modules

- [ ] **Step 4: Create EvidencePanel**

Create `apps/desktop/src/layout/Intelligence/EvidencePanel.tsx`:

```typescript
import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { FileText, ShieldCheck } from "lucide-react";
import type { Signal } from "@/stores/createTodaySlice";

interface EvidencePanelProps {
  signal: Signal | null;
}

export function EvidencePanel({ signal }: EvidencePanelProps) {
  const { t } = useTranslation();

  if (!signal) return null;

  const uniqueFeeds = new Set(signal.sources.map((s) => s.feed_uuid)).size;

  return (
    <div className="p-4">
      <Flex align="center" gap="2" mb="3">
        <ShieldCheck size={16} className="text-[var(--accent-9)]" />
        <Text size="2" weight="medium" className="text-[var(--gray-12)]">
          {t("today.right_panel.evidence_title")}
        </Text>
      </Flex>

      <Flex align="center" gap="2" mb="3">
        <Text size="2" className="text-[var(--gray-11)]">
          {signal.source_count} {t("today.signal_card.sources")}
        </Text>
        <Text size="1" className="text-[var(--gray-8)]">
          · {uniqueFeeds} {t("today.signal_card.articles")}
        </Text>
      </Flex>

      <div className="flex flex-col gap-1.5">
        {signal.sources.slice(0, 5).map((source) => (
          <div
            key={source.article_id}
            className="rounded-md px-2.5 py-2 bg-[var(--gray-2)] border border-[var(--gray-4)]"
          >
            <Flex align="center" gap="1" mb="1">
              <Text size="1" className="text-[var(--gray-9)]">
                {source.feed_title}
              </Text>
            </Flex>
            <Flex align="start" gap="1.5">
              <FileText size={13} className="text-[var(--gray-8)] mt-0.5 shrink-0" />
              <Text size="1" className="text-[var(--gray-11)] leading-snug line-clamp-2">
                {source.title}
              </Text>
            </Flex>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create DailyStatus**

Create `apps/desktop/src/layout/Intelligence/DailyStatus.tsx`:

```typescript
import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Activity, Loader2 } from "lucide-react";
import type { TodayOverview } from "@/stores/createTodaySlice";

interface DailyStatusProps {
  overview: TodayOverview | null;
  loading: boolean;
}

export function DailyStatus({ overview, loading }: DailyStatusProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 border-t border-[var(--gray-4)]">
      <Flex align="center" gap="2" mb="3">
        <Activity size={16} className="text-[var(--gray-9)]" />
        <Text size="2" weight="medium" className="text-[var(--gray-12)]">
          {t("today.right_panel.daily_status.title")}
        </Text>
      </Flex>

      {loading && (
        <Flex align="center" gap="2">
          <Loader2 size={14} className="animate-spin text-[var(--gray-9)]" />
          <Text size="1" className="text-[var(--gray-9)]">
            {t("today.right_panel.daily_status.loading")}
          </Text>
        </Flex>
      )}

      {!loading && overview && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center flex-1 rounded-md bg-[var(--gray-2)] px-2 py-2">
            <Text size="4" weight="bold" className="text-[var(--accent-9)]">
              {overview.signal_count}
            </Text>
            <Text size="1" className="text-[var(--gray-9)]">
              {t("today.right_panel.daily_status.signals")}
            </Text>
          </div>
          <div className="flex flex-col items-center flex-1 rounded-md bg-[var(--gray-2)] px-2 py-2">
            <Text size="4" weight="bold" className="text-[var(--accent-9)]">
              {overview.article_count}
            </Text>
            <Text size="1" className="text-[var(--gray-9)]">
              {t("today.right_panel.daily_status.articles")}
            </Text>
          </div>
        </div>
      )}

      {!loading && !overview && (
        <Text size="1" className="text-[var(--gray-9)]">
          {t("today.right_panel.daily_status.no_data")}
        </Text>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create NextSteps**

Create `apps/desktop/src/layout/Intelligence/NextSteps.tsx`:

```typescript
import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "@/config";
import { Compass, ArrowRight, Settings } from "lucide-react";

interface NextStepsProps {
  hasSignals: boolean;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export function NextSteps({ hasSignals, hasApiKey, onOpenSettings }: NextStepsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="p-4 border-t border-[var(--gray-4)]">
      <Flex align="center" gap="2" mb="3">
        <Compass size={16} className="text-[var(--gray-9)]" />
        <Text size="2" weight="medium" className="text-[var(--gray-12)]">
          {t("today.right_panel.next_steps.title")}
        </Text>
      </Flex>

      <div className="flex flex-col gap-2">
        {hasSignals && (
          <button
            onClick={() => navigate(RouteConfig.LOCAL_TOPICS)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)] transition-colors"
          >
            <ArrowRight size={14} className="shrink-0" />
            <span>{t("today.right_panel.next_steps.explore_topics")}</span>
          </button>
        )}

        <button
          onClick={() => navigate(RouteConfig.LOCAL_ALL)}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--gray-12)] transition-colors"
        >
          <ArrowRight size={14} className="shrink-0" />
          <span>{t("today.right_panel.next_steps.manage_feeds")}</span>
        </button>

        {!hasApiKey && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--accent-9)] hover:bg-[var(--accent-2)] transition-colors"
          >
            <Settings size={14} className="shrink-0" />
            <span>{t("today.right_panel.next_steps.configure_ai")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Write the failing tests for NextSteps**

Create `apps/desktop/src/layout/Intelligence/__tests__/NextSteps.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextSteps } from "../NextSteps";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe("NextSteps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render title and manage feeds button always", () => {
    const onOpenSettings = vi.fn();
    render(<NextSteps hasSignals={false} hasApiKey={true} onOpenSettings={onOpenSettings} />);

    expect(screen.getByText("today.right_panel.next_steps.title")).toBeInTheDocument();
    expect(screen.getByText("today.right_panel.next_steps.manage_feeds")).toBeInTheDocument();
  });

  it("should show explore topics button when hasSignals is true", () => {
    render(<NextSteps hasSignals={true} hasApiKey={true} onOpenSettings={vi.fn()} />);

    expect(screen.getByText("today.right_panel.next_steps.explore_topics")).toBeInTheDocument();
  });

  it("should not show explore topics button when hasSignals is false", () => {
    render(<NextSteps hasSignals={false} hasApiKey={true} onOpenSettings={vi.fn()} />);

    expect(screen.queryByText("today.right_panel.next_steps.explore_topics")).not.toBeInTheDocument();
  });

  it("should show configure AI button when hasApiKey is false", () => {
    const onOpenSettings = vi.fn();
    render(<NextSteps hasSignals={false} hasApiKey={false} onOpenSettings={onOpenSettings} />);

    expect(screen.getByText("today.right_panel.next_steps.configure_ai")).toBeInTheDocument();
    fireEvent.click(screen.getByText("today.right_panel.next_steps.configure_ai"));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("should navigate to topics when explore clicked", () => {
    render(<NextSteps hasSignals={true} hasApiKey={true} onOpenSettings={vi.fn()} />);

    fireEvent.click(screen.getByText("today.right_panel.next_steps.explore_topics"));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("should navigate to feeds when manage feeds clicked", () => {
    render(<NextSteps hasSignals={false} hasApiKey={true} onOpenSettings={vi.fn()} />);

    fireEvent.click(screen.getByText("today.right_panel.next_steps.manage_feeds"));
    expect(mockNavigate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm test -- apps/desktop/src/layout/Intelligence/__tests__/EvidencePanel.test.tsx apps/desktop/src/layout/Intelligence/__tests__/DailyStatus.test.tsx apps/desktop/src/layout/Intelligence/__tests__/NextSteps.test.tsx --reporter verbose`
Expected: All tests PASS

- [ ] **Step 9: Commit**

```bash
git add apps/desktop/src/layout/Intelligence/EvidencePanel.tsx apps/desktop/src/layout/Intelligence/DailyStatus.tsx apps/desktop/src/layout/Intelligence/NextSteps.tsx apps/desktop/src/layout/Intelligence/__tests__/EvidencePanel.test.tsx apps/desktop/src/layout/Intelligence/__tests__/DailyStatus.test.tsx apps/desktop/src/layout/Intelligence/__tests__/NextSteps.test.tsx
git commit -m "feat(today): add EvidencePanel, DailyStatus, NextSteps right panel components"
```

---

### Task 4: InlineReader Component

**Files:**
- Create: `apps/desktop/src/layout/Intelligence/InlineReader.tsx`
- Create: `apps/desktop/src/layout/Intelligence/__tests__/InlineReader.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/desktop/src/layout/Intelligence/__tests__/InlineReader.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineReader } from "../InlineReader";
import type { SignalSource } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

const mockSource: SignalSource = {
  article_id: 1,
  article_uuid: "uuid-1",
  title: "Test Article Title",
  link: "https://example.com/article",
  feed_title: "Test Feed",
  feed_uuid: "feed-uuid",
  pub_date: "2026-04-30T10:00:00Z",
  excerpt: "Short excerpt of the article",
};

const mockSources: SignalSource[] = [
  mockSource,
  {
    article_id: 2,
    article_uuid: "uuid-2",
    title: "Second Article",
    link: "https://example.com/article2",
    feed_title: "Feed B",
    feed_uuid: "feed-b",
    pub_date: "2026-04-30T11:00:00Z",
    excerpt: null,
  },
  {
    article_id: 3,
    article_uuid: "uuid-3",
    title: "Third Article",
    link: "https://example.com/article3",
    feed_title: "Feed C",
    feed_uuid: "feed-c",
    pub_date: "2026-04-30T12:00:00Z",
    excerpt: null,
  },
];

describe("InlineReader", () => {
  it("should render back button", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("today.inline_reader.back")).toBeInTheDocument();
  });

  it("should render article title and feed name", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("Test Article Title")).toBeInTheDocument();
    expect(screen.getByText("Test Feed")).toBeInTheDocument();
  });

  it("should call onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={onBack}
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("should call onNavigate with next index when next button clicked", () => {
    const onNavigate = vi.fn();
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.next"));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("should call onNavigate with previous index when prev button clicked", () => {
    const onNavigate = vi.fn();
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={1}
        onBack={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.prev"));
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("should disable prev button at first source", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    const prevButton = screen.getByText("today.inline_reader.prev").closest("button")!;
    expect(prevButton.disabled).toBe(true);
  });

  it("should disable next button at last source", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={2}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    const nextButton = screen.getByText("today.inline_reader.next").closest("button")!;
    expect(nextButton.disabled).toBe(true);
  });

  it("should show source position indicator", () => {
    render(
      <InlineReader
        source={mockSource}
        sources={mockSources}
        currentIndex={1}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- apps/desktop/src/layout/Intelligence/__tests__/InlineReader.test.tsx --reporter verbose`
Expected: FAIL — Cannot find module `../InlineReader`

- [ ] **Step 3: Create the InlineReader component**

Create `apps/desktop/src/layout/Intelligence/InlineReader.tsx`:

```typescript
import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { SignalSource } from "@/stores/createTodaySlice";

interface InlineReaderProps {
  source: SignalSource;
  sources: SignalSource[];
  currentIndex: number;
  onBack: () => void;
  onNavigate: (index: number) => void;
}

export function InlineReader({
  source,
  sources,
  currentIndex,
  onBack,
  onNavigate,
}: InlineReaderProps) {
  const { t } = useTranslation();

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < sources.length - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--gray-4)] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--gray-9)] hover:text-[var(--gray-12)] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{t("today.inline_reader.back")}</span>
        </button>

        <Flex align="center" gap="2">
          <button
            onClick={() => canGoPrev && onNavigate(currentIndex - 1)}
            disabled={!canGoPrev}
            className="p-1 rounded text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-3)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <Text size="1" className="text-[var(--gray-9)] tabular-nums">
            {currentIndex + 1} / {sources.length}
          </Text>
          <button
            onClick={() => canGoNext && onNavigate(currentIndex + 1)}
            disabled={!canGoNext}
            className="p-1 rounded text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-3)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </Flex>

        <a
          href={source.link}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded text-[var(--gray-9)] hover:text-[var(--gray-12)] hover:bg-[var(--gray-3)] transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Article metadata */}
      <div className="px-4 py-3 border-b border-[var(--gray-4)] shrink-0">
        <Text size="1" className="text-[var(--gray-9)]">
          {source.feed_title}
        </Text>
        <Text size="4" weight="medium" className="text-[var(--gray-12)] leading-snug block mt-1">
          {source.title}
        </Text>
        {source.excerpt && (
          <Text size="2" className="text-[var(--gray-11)] mt-2 block leading-relaxed">
            {source.excerpt}
          </Text>
        )}
      </div>

      {/* Article content area */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="text-center py-12 text-[var(--gray-8)]">
          <Text size="2">
            {t("today.inline_reader.content_placeholder")}
          </Text>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- apps/desktop/src/layout/Intelligence/__tests__/InlineReader.test.tsx --reporter verbose`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/layout/Intelligence/InlineReader.tsx apps/desktop/src/layout/Intelligence/__tests__/InlineReader.test.tsx
git commit -m "feat(today): add InlineReader component for right panel reading"
```

---

### Task 5: TodayPage Three-Panel Layout

**Files:**
- Modify: `apps/desktop/src/layout/Intelligence/TodayPage.tsx`
- Modify: `apps/desktop/src/layout/Intelligence/SignalSourceItem.tsx`
- Modify: `apps/desktop/src/layout/Intelligence/SignalSourceList.tsx`

- [ ] **Step 1: Update SignalSourceItem to support inline reading**

The `SignalSourceItem` currently takes an `onClick` callback that navigates away. We need to add an optional `onInlineRead` callback for Today's inline reading mode.

Modify `apps/desktop/src/layout/Intelligence/SignalSourceItem.tsx`. Change the `SignalSourceItemProps` interface (lines 7-11) to:

```typescript
interface SignalSourceItemProps {
  source: SignalSource;
  onClick: (articleUuid: string, feedUuid: string, articleId: number) => void;
  onReadOriginal?: (articleUuid: string, feedUuid: string, articleId: number) => void;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}
```

Change the component function signature (line 13) to:

```typescript
export function SignalSourceItem({ source, onClick, onReadOriginal, onInlineRead }: SignalSourceItemProps) {
```

Add a new handler after the `handleReadOriginal` function (after line 26):

```typescript
  const handleInlineRead = () => {
    if (onInlineRead) {
      onInlineRead(source.article_uuid, source.feed_uuid, source.article_id);
    } else {
      onClick(source.article_uuid, source.feed_uuid, source.article_id);
    }
  };
```

Change the main button `onClick` (line 31) from:

```typescript
      onClick={() => onClick(source.article_uuid, source.feed_uuid, source.article_id)}
```

to:

```typescript
      onClick={handleInlineRead}
```

- [ ] **Step 2: Update SignalSourceList to pass through onInlineRead**

Modify `apps/desktop/src/layout/Intelligence/SignalSourceList.tsx`. Change the interface (lines 9-14) to:

```typescript
interface SignalSourceListProps {
  sources: SignalSource[];
  onSourceClick: (articleUuid: string, feedUuid: string, articleId: number) => void;
  onLoadAll?: () => void;
  loading?: boolean;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}
```

Change the component function signature (line 16) to:

```typescript
export function SignalSourceList({
  sources,
  onSourceClick,
  onLoadAll,
  loading,
  onInlineRead,
}: SignalSourceListProps) {
```

Change the `SignalSourceItem` rendering (around line 38) from:

```typescript
            <SignalSourceItem
              key={source.article_id}
              source={source}
              onClick={onSourceClick}
            />
```

to:

```typescript
            <SignalSourceItem
              key={source.article_id}
              source={source}
              onClick={onSourceClick}
              onInlineRead={onInlineRead}
            />
```

- [ ] **Step 3: Refactor TodayPage to three-panel layout**

> ⚠️ **This is a full-file replacement of a 177-line file.** Before replacing, carefully diff the new version against the original to ensure the following critical logic is preserved:
> - **Pipeline event listeners** (`pipeline:started`, `pipeline:progress`, `pipeline:completed`, `pipeline:failed` via `listen` from `@tauri-apps/api/event`)
> - **Scroll position restoration** (`scrollPositionMap` + `requestAnimationFrame` + `data-today-scroll` selector)
> - **Empty state conditions** (no subscriptions → no API key → no signals → no new articles)
> - **`MainPanel` import removed** — TodayPage now uses its own `flex` layout instead of `MainPanel` wrapper. This is intentional. Other pages (Feeds, Topics) continue using `MainPanel` independently.

Replace the entire content of `apps/desktop/src/layout/Intelligence/TodayPage.tsx` with:

```typescript
import { useEffect, useCallback } from "react";
import { Flex, Text, Button } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { SignalList } from "./SignalList";
import { PipelineIndicator } from "./PipelineIndicator";
import { TodayOverview } from "./TodayOverview";
import { TodayEmptyState } from "./TodayEmptyState";
import { RightPanel } from "./RightPanel";
import { EvidencePanel } from "./EvidencePanel";
import { DailyStatus } from "./DailyStatus";
import { NextSteps } from "./NextSteps";
import { InlineReader } from "./InlineReader";
import { Settings, Sparkles, Loader2 } from "lucide-react";

export function TodayPage() {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      signals: state.signals,
      signalsLoading: state.signalsLoading,
      signalsError: state.signalsError,
      pipelineStatus: state.pipelineStatus,
      pipelineStage: state.pipelineStage,
      pipelineProgress: state.pipelineProgress,
      pipelineError: state.pipelineError,
      aiConfig: state.aiConfig,
      subscribes: state.subscribes,
      overview: state.overview,
      overviewLoading: state.overviewLoading,
      overviewError: state.overviewError,
      fetchSignals: state.fetchSignals,
      fetchAIConfig: state.fetchAIConfig,
      fetchOverview: state.fetchOverview,
      setPipelineStatus: state.setPipelineStatus,
      setPipelineProgress: state.setPipelineProgress,
      triggerPipeline: state.triggerPipeline,
      setPipelineError: state.setPipelineError,
      updateSettingDialogStatus: state.updateSettingDialogStatus,
      expandedSignalId: state.expandedSignalId,
      scrollPositionMap: state.scrollPositionMap,
      // Inline reading state
      activeReadingSignalId: state.activeReadingSignalId,
      activeReadingSourceIndex: state.activeReadingSourceIndex,
      isInlineReading: state.isInlineReading,
      rightPanelExpanded: state.rightPanelExpanded,
      startInlineReading: state.startInlineReading,
      closeInlineReading: state.closeInlineReading,
      navigateReadingSource: state.navigateReadingSource,
      signalDetails: state.signalDetails,
    })),
  );

  useEffect(() => {
    store.fetchAIConfig();
    store.fetchSignals();
    store.fetchOverview();
  }, []);

  useEffect(() => {
    const signalId = store.expandedSignalId;
    if (signalId != null && store.scrollPositionMap[signalId] !== undefined) {
      requestAnimationFrame(() => {
        const scrollContainer = document.querySelector('[data-today-scroll]') as HTMLElement | null;
        if (scrollContainer) {
          scrollContainer.scrollTop = store.scrollPositionMap[signalId];
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!(window as any).__TAURI_INTERNALS__) return;

    const unsubs: (() => void)[] = [];
    let cancelled = false;

    import("@tauri-apps/api/event").then(async ({ listen }) => {
      if (cancelled) return;

      unsubs.push(
        await listen("pipeline:started", () => {
          store.setPipelineStatus("running");
        }),
      );
      unsubs.push(
        await listen("pipeline:progress", (e: any) => {
          const { stage, current, total } = e.payload;
          store.setPipelineProgress(stage, current, total);
        }),
      );
      unsubs.push(
        await listen("pipeline:completed", () => {
          store.setPipelineStatus("done");
        }),
      );
      unsubs.push(
        await listen("pipeline:failed", (e: any) => {
          const msg = e.payload?.error_message || "Unknown error";
          store.setPipelineError(msg);
        }),
      );
    });

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const hasApiKey = store.aiConfig?.has_api_key ?? false;
  const hasSignals = store.signals.length > 0;
  const hasSubscriptions = store.subscribes.length > 0;

  const activeReadingSignal = store.signals.find(
    (s) => s.id === store.activeReadingSignalId,
  );
  const activeReadingDetail = store.activeReadingSignalId
    ? store.signalDetails[store.activeReadingSignalId]
    : undefined;
  const activeSources = activeReadingDetail?.all_sources ?? activeReadingSignal?.sources ?? [];
  const currentReadingSource = activeSources[store.activeReadingSourceIndex] ?? null;

  const handleInlineRead = useCallback(
    (articleUuid: string, feedUuid: string, articleId: number) => {
      // Find the signal that contains this article
      const signal = store.signals.find((s) =>
        s.sources.some((src) => src.article_id === articleId),
      );
      if (!signal) return;

      const detail = store.signalDetails[signal.id];
      const sources = detail?.all_sources ?? signal.sources;
      const sourceIndex = sources.findIndex((s) => s.article_id === articleId);

      store.startInlineReading(signal.id, sourceIndex >= 0 ? sourceIndex : 0);
    },
    [store.signals, store.signalDetails, store.startInlineReading],
  );

  const handleReadingBack = useCallback(() => {
    store.closeInlineReading();
  }, [store.closeInlineReading]);

  const handleReadingNavigate = useCallback(
    (index: number) => {
      store.navigateReadingSource(index);
    },
    [store.navigateReadingSource],
  );

  const renderEmptyState = () => {
    if (!hasSubscriptions) {
      return <TodayEmptyState type="no_subscriptions" />;
    }

    if (!hasApiKey) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center h-full">
          <div className="mb-4">
            <Settings size={48} className="text-[var(--gray-6)]" />
          </div>
          <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
            {t("today.empty.no_api_key")}
          </Text>
          <Button
            size="3"
            onClick={() => store.updateSettingDialogStatus(true)}
          >
            {t("today.empty.go_to_settings")}
          </Button>
        </div>
      );
    }

    if (!hasSignals) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center h-full">
          <div className="mb-4">
            <Sparkles size={48} className="text-[var(--gray-6)]" />
          </div>
          <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
            {t("today.empty.no_signals")}
          </Text>
          <Button size="3" onClick={() => store.triggerPipeline()}>
            {t("today.empty.start_analysis")}
          </Button>
        </div>
      );
    }

    return <TodayEmptyState type="no_new_articles" />;
  };

  // Determine what to show in the right panel
  const renderRightPanelContent = () => {
    if (store.isInlineReading && currentReadingSource && activeSources.length > 0) {
      return (
        <InlineReader
          source={currentReadingSource}
          sources={activeSources}
          currentIndex={store.activeReadingSourceIndex}
          onBack={handleReadingBack}
          onNavigate={handleReadingNavigate}
        />
      );
    }

    // Collapsed state: evidence, status, next steps
    return (
      <div className="flex flex-col h-full overflow-auto">
        <EvidencePanel signal={activeReadingSignal ?? store.signals[0] ?? null} />
        <DailyStatus overview={store.overview} loading={store.overviewLoading} />
        <NextSteps
          hasSignals={hasSignals}
          hasApiKey={hasApiKey}
          onOpenSettings={() => store.updateSettingDialogStatus(true)}
        />
      </div>
    );
  };

  return (
    <div className="flex h-full w-full">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <PipelineIndicator
          status={store.pipelineStatus}
          stage={store.pipelineStage}
          progress={store.pipelineProgress}
          error={store.pipelineError}
          onRetry={() => store.triggerPipeline()}
        />

        {store.signalsLoading && !hasSignals ? (
          <Flex align="center" justify="center" className="flex-1">
            <Loader2 className="animate-spin text-[var(--gray-8)]" size={32} />
          </Flex>
        ) : !hasApiKey || !hasSignals ? (
          renderEmptyState()
        ) : (
          <div className="flex-1 overflow-auto" data-today-scroll>
            <TodayOverview
              overview={store.overview}
              overviewLoading={store.overviewLoading}
              overviewError={store.overviewError}
              hasApiKey={hasApiKey}
            />
            <SignalList
              signals={store.signals}
              activeReadingSignalId={store.activeReadingSignalId}
              onInlineRead={handleInlineRead}
            />
          </div>
        )}
      </div>

      {/* Right panel */}
      {(hasSignals || store.isInlineReading) && (
        <RightPanel expanded={store.rightPanelExpanded}>
          {renderRightPanelContent()}
        </RightPanel>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update SignalList to accept activeReadingSignalId and onInlineRead**

Replace the content of `apps/desktop/src/layout/Intelligence/SignalList.tsx` with:

```typescript
import { Signal } from "@/stores/createTodaySlice";
import { SignalCard } from "./SignalCard";

interface SignalListProps {
  signals: Signal[];
  activeReadingSignalId?: number | null;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}

export function SignalList({ signals, activeReadingSignalId, onInlineRead }: SignalListProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {signals.map((signal, index) => {
        const isActive = activeReadingSignalId != null && activeReadingSignalId === signal.id;
        const isDimmed = activeReadingSignalId != null && !isActive;

        return (
          <div
            key={signal.id}
            className="animate-in fade-in slide-in-from-bottom-2 transition-opacity duration-300"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: "both",
              opacity: isDimmed ? 0.6 : 1,
            }}
          >
            <SignalCard
              signal={signal}
              isActive={isActive}
              onInlineRead={onInlineRead}
            />
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Update SignalCard to accept isActive and onInlineRead props and pass to SignalSourceList**

Modify `apps/desktop/src/layout/Intelligence/SignalCard.tsx`. Update the `SignalCardProps` interface (lines 12-14):

```typescript
interface SignalCardProps {
  signal: Signal;
  isActive?: boolean;
  onInlineRead?: (articleUuid: string, feedUuid: string, articleId: number) => void;
}
```

Update the component function signature (line 16):

```typescript
export function SignalCard({ signal, isActive, onInlineRead }: SignalCardProps) {
```

Add accent border when active. Change the outer div className (line 93) from:

```typescript
    <div className="group rounded-lg border border-[var(--gray-4)] bg-[var(--color-background)] p-4 transition-all hover:border-[var(--gray-7)] hover:shadow-sm cursor-default">
```

to:

```typescript
    <div
      className={`group rounded-lg border bg-[var(--color-background)] p-4 transition-all hover:shadow-sm cursor-default ${
        isActive
          ? "border-[var(--accent-8)] shadow-sm ring-1 ring-[var(--accent-3)]"
          : "border-[var(--gray-4)] hover:border-[var(--gray-7)]"
      }`}
    >
```

Pass `onInlineRead` through to `SignalSourceList`. Change the `SignalSourceList` rendering (lines 182-188) from:

```typescript
          <SignalSourceList
            sources={sources}
            onSourceClick={handleSourceClick}
            onLoadAll={handleLoadAll}
            loading={detailLoading}
          />
```

to:

```typescript
          <SignalSourceList
            sources={sources}
            onSourceClick={handleSourceClick}
            onLoadAll={handleLoadAll}
            loading={detailLoading}
            onInlineRead={onInlineRead}
          />
```

- [ ] **Step 6: Run existing tests to ensure nothing broke**

Run: `pnpm test -- apps/desktop/src/layout/Intelligence/__tests__/ --reporter verbose`
Expected: All existing Today tests PASS (TodayPage, SignalCard, SignalSourceList, TodayEmptyState tests should still pass since we added optional props)

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src/layout/Intelligence/TodayPage.tsx apps/desktop/src/layout/Intelligence/SignalList.tsx apps/desktop/src/layout/Intelligence/SignalCard.tsx apps/desktop/src/layout/Intelligence/SignalSourceItem.tsx apps/desktop/src/layout/Intelligence/SignalSourceList.tsx
git commit -m "feat(today): implement three-panel layout with inline reading"
```

---

### Task 6: SignalCard Visual Enhancement — Signal Level + Confidence

**Files:**
- Modify: `apps/desktop/src/layout/Intelligence/SignalCard.tsx`

- [ ] **Step 1: Add signal level indicator and confidence display**

We add a "signal level" based on `relevance_score` and a confidence bar. Modify `apps/desktop/src/layout/Intelligence/SignalCard.tsx`.

Add a helper function before the component function (after the interface, around line 15):

```typescript
function getSignalLevel(score: number): { label: string; color: string; dotColor: string } {
  if (score >= 0.8) {
    return { label: "High", color: "text-[var(--accent-9)]", dotColor: "bg-[var(--accent-9)]" };
  }
  if (score >= 0.5) {
    return { label: "Medium", color: "text-[var(--amber-9)]", dotColor: "bg-[var(--amber-9)]" };
  }
  return { label: "Low", color: "text-[var(--gray-9)]", dotColor: "bg-[var(--gray-9)]" };
}
```

Inside the component, after `const hasWim = ...` block (after line 45), add:

```typescript
  const level = getSignalLevel(signal.relevance_score);
```

Add the level indicator and confidence bar in the JSX. After the topic tag link block (after the closing `</Link>` on line 111), add:

```typescript
        {/* Signal level + confidence */}
        <Flex align="center" gap="2" mt="1">
          <Flex align="center" gap="1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${level.dotColor}`} />
            <Text size="1" className={level.color}>
              {t(`today.signal_card.level.${level.label.toLowerCase()}`)}
            </Text>
          </Flex>
          <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
            <div className="flex-1 h-1 rounded-full bg-[var(--gray-3)]">
              <div
                className="h-1 rounded-full bg-[var(--accent-9)] transition-all"
                style={{ width: `${Math.round(signal.relevance_score * 100)}%` }}
              />
            </div>
            <Text size="1" className="text-[var(--gray-8)] tabular-nums">
              {Math.round(signal.relevance_score * 100)}%
            </Text>
          </div>
        </Flex>
```

- [ ] **Step 2: Verify the component renders with no TypeScript errors**

Run: `npx tsc --noEmit --project apps/desktop/tsconfig.json 2>&1 | head -20`
Expected: No type errors (or only pre-existing ones). The `getSignalLevel` function returns proper strings used in class attributes.

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/layout/Intelligence/SignalCard.tsx
git commit -m "feat(today): add signal level indicator and confidence bar to SignalCard"
```

---

### Task 7: Sidebar Context-Aware Redesign

**Files:**
- Create: `apps/desktop/src/components/layout/SidebarToday.tsx`
- Create: `apps/desktop/src/components/layout/SidebarTopics.tsx`
- Create: `apps/desktop/src/components/layout/SidebarFeeds.tsx`
- Modify: `apps/desktop/src/components/layout/Sidebar.tsx`
- Modify: `apps/desktop/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Create SidebarToday component**

Create `apps/desktop/src/components/layout/SidebarToday.tsx`:

```typescript
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, Layers } from "lucide-react";
import { Text } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";

export function SidebarToday() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      topics: state.topics,
      followingTopicIds: state.followingTopicIds,
    })),
  );

  // Guard: show skeleton while topics data is loading (topics may not be fetched yet)
  if (store.topics === undefined) {
    return (
      <div className="flex flex-col gap-1 px-3 pb-2">
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--gray-11)]">
            {t("layout.sidebar.tracked_topics")}
          </span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-3 h-3 rounded bg-[var(--gray-3)] animate-pulse" />
            <div className="h-3 w-20 rounded bg-[var(--gray-3)] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const followedTopics = store.topics.filter((tp) => store.followingTopicIds.has(tp.id));

  return (
    <div className="flex flex-col gap-1">
      <div className="px-3 pb-2">
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--gray-11)]">
            {t("layout.sidebar.today_focus")}
          </span>
        </div>
        <div
          className="flex flex-col gap-0.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--gray-3)] transition-colors"
          onClick={() => navigate(RouteConfig.LOCAL_TODAY)}
        >
          <span className="text-xs font-medium text-[var(--gray-12)]">
            {t("layout.sidebar.today_focus")}
          </span>
          <span className="text-[11px] text-[var(--gray-9)]">
            {t("layout.sidebar.today_focus_desc")}
          </span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--gray-11)]">
            {t("layout.sidebar.tracked_topics")}
          </span>
        </div>
        {followedTopics.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {followedTopics.slice(0, 8).map((topic) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/local/topics/${topic.uuid}`)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-[var(--gray-3)] transition-colors"
              >
                <Layers size={12} className="text-[var(--gray-9)] shrink-0" />
                <span className="text-xs text-[var(--gray-12)] truncate">
                  {topic.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-2 py-2 text-xs text-[var(--gray-9)]">
            {t("layout.sidebar.no_tracked_topics")}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SidebarTopics component**

Create `apps/desktop/src/components/layout/SidebarTopics.tsx`:

```typescript
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";

export function SidebarTopics() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      topics: state.topics,
      filterMode: state.filterMode,
      setFilterMode: state.setFilterMode,
    })),
  );

  const displayedTopics =
    store.filterMode === "following"
      ? store.topics.filter((tp) => tp.is_following)
      : store.topics;

  return (
    <div className="flex flex-col gap-1">
      <div className="px-3 pb-2">
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[var(--gray-11)]">
            {t("layout.sidebar.topics_list")}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {displayedTopics.length > 0 ? (
            displayedTopics.slice(0, 15).map((topic) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/local/topics/${topic.uuid}`)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-[var(--gray-3)] transition-colors"
              >
                <Layers size={12} className="text-[var(--gray-9)] shrink-0" />
                <span className="text-xs text-[var(--gray-12)] truncate">
                  {topic.title}
                </span>
              </button>
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-[var(--gray-9)]">
              {t("layout.topics.empty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create SidebarFeeds component**

Create `apps/desktop/src/components/layout/SidebarFeeds.tsx`:

```typescript
import { useTranslation } from "react-i18next";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ChannelList } from "@/components/Subscribes";

export function SidebarFeeds() {
  const { t } = useTranslation();

  return (
    <DndProvider backend={HTML5Backend}>
      <ChannelList />
    </DndProvider>
  );
}
```

- [ ] **Step 4: Refactor Sidebar to accept context prop**

Replace the content of `apps/desktop/src/components/layout/Sidebar.tsx` with:

```typescript
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FolderPlus,
  RotateCw,
  PlusCircle,
  PanelLeftClose,
} from "lucide-react";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";
import { AddFeedChannel } from "@/components/AddFeed";
import { AddFolder } from "@/components/AddFolder";
import { useRefresh } from "@/hooks/useRefresh";
import { useBearStore } from "@/stores";
import { SidebarToday } from "./SidebarToday";
import { SidebarTopics } from "./SidebarTopics";
import { SidebarFeeds } from "./SidebarFeeds";

export type SidebarContext = "today" | "topics" | "feeds" | "default";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  context?: SidebarContext;
}

export const Sidebar = React.memo(function ({
  collapsed,
  onToggle,
  context = "default",
}: SidebarProps) {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      getSubscribes: state.getSubscribes,
      globalSyncStatus: state.globalSyncStatus,
    })),
  );

  const [addFolderDialogStatus, setAddFolderDialogStatus] = useState(false);
  const { startRefresh } = useRefresh();

  if (collapsed) {
    return null;
  }

  const renderContextContent = () => {
    switch (context) {
      case "today":
        return <SidebarToday />;
      case "topics":
        return <SidebarTopics />;
      case "feeds":
        return <SidebarFeeds />;
      default:
        return <SidebarToday />;
    }
  };

  return (
    <div className="flex flex-col h-full w-[240px] bg-[var(--gray-1)] border-r border-[var(--gray-4)] select-none shrink-0 overflow-hidden">
      <div className="flex items-center justify-between h-[var(--app-toolbar-height)] px-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--gray-12)]">
            {t(`layout.sidebar.context_${context}`)}
          </span>
        </div>
        <Tooltip content={t("layout.sidebar.collapse")} side="right">
          <IconButton
            variant="ghost"
            size="1"
            color="gray"
            className="text-[var(--gray-11)]"
            onClick={onToggle}
          >
            <PanelLeftClose size={14} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Context-specific content */}
      <div className="flex-1 overflow-auto">
        {renderContextContent()}
      </div>

      {/* Bottom action bar — only for feeds */}
      {context === "feeds" && (
        <div className="flex items-center gap-1 px-3 py-2 border-t border-[var(--gray-4)]">
          <AddFolder
            action="add"
            dialogStatus={addFolderDialogStatus}
            setDialogStatus={setAddFolderDialogStatus}
            afterConfirm={store.getSubscribes}
            afterCancel={() => {}}
            trigger={
              <IconButton
                variant="ghost"
                size="1"
                color="gray"
                className="text-[var(--gray-11)]"
              >
                <FolderPlus size={14} />
              </IconButton>
            }
          />
          <Tooltip content={t("Update")}>
            <IconButton
              size="1"
              loading={store.globalSyncStatus}
              variant="ghost"
              onClick={startRefresh}
              color="gray"
              className="text-[var(--gray-11)]"
            >
              <RotateCw size={14} />
            </IconButton>
          </Tooltip>
          <AddFeedChannel>
            <IconButton
              variant="ghost"
              size="1"
              color="gray"
              className="text-[var(--gray-11)]"
            >
              <PlusCircle size={14} />
            </IconButton>
          </AddFeedChannel>
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 5: Update AppLayout to pass context based on current route**

Replace the content of `apps/desktop/src/components/layout/AppLayout.tsx` with:

```typescript
import React, { useState, useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Rail } from "./Rail";
import { Sidebar, SidebarContext } from "./Sidebar";
import { RouteConfig } from "@/config";

const SIDEBAR_COLLAPSED_KEY = "lettura_sidebar_collapsed";

function getInitialCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === "true";
  } catch {
    return false;
  }
}

function getSidebarContext(pathname: string): SidebarContext {
  if (pathname.startsWith("/local/today")) return "today";
  if (pathname.startsWith("/local/topics")) return "topics";
  if (
    pathname.startsWith("/local/all") ||
    pathname.startsWith("/local/feeds") ||
    pathname.startsWith("/local/starred")
  )
    return "feeds";
  return "default";
}

export const AppLayout = React.memo(function () {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsed);
  const location = useLocation();

  const sidebarContext = useMemo(
    () => getSidebarContext(location.pathname),
    [location.pathname],
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-row h-full bg-canvas">
      <Rail />
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} context={sidebarContext} />
      <div className="flex-1 overflow-hidden h-full">
        <Outlet />
      </div>
    </div>
  );
});
```

- [ ] **Step 6: Verify existing tests still pass**

Run: `pnpm test -- apps/desktop/src/__tests__/routing.test.tsx --reporter verbose`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src/components/layout/Sidebar.tsx apps/desktop/src/components/layout/AppLayout.tsx apps/desktop/src/components/layout/SidebarToday.tsx apps/desktop/src/components/layout/SidebarTopics.tsx apps/desktop/src/components/layout/SidebarFeeds.tsx
git commit -m "feat(layout): add context-aware sidebar with Today/Topics/Feeds contexts"
```

---

### Task 8: Topic Detail Page with Right Panel

**Files:**
- Create: `apps/desktop/src/layout/Intelligence/Topics/TopicRightPanel.tsx`
- Modify: `apps/desktop/src/layout/Intelligence/Topics/TopicDetailPage.tsx`
- Modify: `apps/desktop/src/layout/Intelligence/Topics/TopicArticleItem.tsx`

- [ ] **Step 1: Create TopicRightPanel component**

Create `apps/desktop/src/layout/Intelligence/Topics/TopicRightPanel.tsx`:

```typescript
import { Text, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Rss, PieChart } from "lucide-react";
import type { TopicDetail, SourceGroup } from "@/stores/topicSlice";

interface TopicRightPanelProps {
  topic: TopicDetail;
}

export function TopicRightPanel({ topic }: TopicRightPanelProps) {
  const { t } = useTranslation();

  const sourceGroups = topic.source_groups ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Source Distribution */}
      <div className="p-4">
        <Flex align="center" gap="2" mb="3">
          <PieChart size={16} className="text-[var(--accent-9)]" />
          <Text size="2" weight="medium" className="text-[var(--gray-12)]">
            {t("layout.topics.detail.source_distribution")}
          </Text>
        </Flex>

        {sourceGroups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sourceGroups.map((group: SourceGroup) => {
              const percentage = topic.article_count > 0
                ? Math.round((group.article_count / topic.article_count) * 100)
                : 0;
              return (
                <div key={group.feed_uuid} className="flex flex-col gap-1">
                  <Flex align="center" justify="between">
                    <Flex align="center" gap="1.5">
                      <Rss size={12} className="text-[var(--gray-9)]" />
                      <Text size="1" className="text-[var(--gray-11)] truncate">
                        {group.feed_title}
                      </Text>
                    </Flex>
                    <Text size="1" className="text-[var(--gray-8)] tabular-nums">
                      {group.article_count} ({percentage}%)
                    </Text>
                  </Flex>
                  <div className="h-1 rounded-full bg-[var(--gray-3)]">
                    <div
                      className="h-1 rounded-full bg-[var(--accent-9)] transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Text size="1" className="text-[var(--gray-9)]">
            {t("layout.topics.detail.no_source_data")}
          </Text>
        )}
      </div>

      {/* Summary */}
      {topic.topic_summary && (
        <div className="p-4 border-t border-[var(--gray-4)]">
          <Text size="1" weight="medium" className="text-[var(--gray-11)] block mb-2">
            {t("layout.topics.detail.topic_summary")}
          </Text>
          <Text size="1" className="text-[var(--gray-11)] leading-relaxed">
            {topic.topic_summary}
          </Text>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update TopicArticleItem to accept onClick callback**

Replace `apps/desktop/src/layout/Intelligence/Topics/TopicArticleItem.tsx` with:

```typescript
import { Text, Flex } from "@radix-ui/themes";
import type { TopicArticle } from "@/stores/topicSlice";
import { formatRelativeTime } from "@/helpers/formatRelativeTime";

interface TopicArticleItemProps {
  article: TopicArticle;
  onClick?: (article: TopicArticle) => void;
}

export function TopicArticleItem({ article, onClick }: TopicArticleItemProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(article);
    } else if (typeof window !== "undefined") {
      window.open(article.link, "_blank");
    }
  };

  return (
    <div
      className="py-3 px-4 border-b border-[var(--gray-3)] hover:bg-[var(--gray-2)] cursor-pointer transition-colors last:border-b-0"
      onClick={handleClick}
    >
      <Flex direction="column" gap="1">
        <Text size="2" className="text-[var(--gray-12)] truncate">
          {article.title}
        </Text>
        <Flex align="center" gap="2">
          <Text size="1" className="text-[var(--gray-9)]">
            {article.feed_title}
          </Text>
          <Text size="1" className="text-[var(--gray-8)]">
            {formatRelativeTime(article.pub_date)}
          </Text>
        </Flex>
        {article.excerpt && (
          <Text size="1" className="text-[var(--gray-11)] line-clamp-1">
            {article.excerpt}
          </Text>
        )}
      </Flex>
    </div>
  );
}
```

- [ ] **Step 3: Refactor TopicDetailPage to include right panel**

> **Design change note:** The new `TopicDetailPage` removes the `first_seen_at` date display that existed in the original version. This is intentional — the spec defines Topic detail as a "dossier" emphasizing the topic's current state and evolution, so only `last_updated_at` is shown. The `first_seen_at` field remains available in `TopicDetail` type for future timeline features.

Replace `apps/desktop/src/layout/Intelligence/Topics/TopicDetailPage.tsx` with:

```typescript
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Text, Flex } from "@radix-ui/themes";
import { ArrowLeft, Layers, FileText, Rss, Clock, Pin, PinOff } from "lucide-react";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { cn } from "@/helpers/cn";
import { TopicArticleItem } from "./TopicArticleItem";
import { SourceGroup } from "./SourceGroup";
import { TopicRightPanel } from "./TopicRightPanel";
import { RightPanel } from "../RightPanel";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TopicDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const store = useBearStore(
    useShallow((state) => ({
      topics: state.topics,
      selectedTopic: state.selectedTopic,
      detailLoading: state.detailLoading,
      error: state.error,
      fetchTopicDetail: state.fetchTopicDetail,
      clearSelectedTopic: state.clearSelectedTopic,
      followTopic: state.followTopic,
      unfollowTopic: state.unfollowTopic,
    })),
  );

  const topicFromList = store.topics.find((tp) => tp.uuid === uuid);
  const topicId = topicFromList?.id;

  useEffect(() => {
    if (topicId != null) {
      store.fetchTopicDetail(topicId);
    }
    return () => {
      store.clearSelectedTopic();
    };
  }, [topicId]);

  const topic = store.selectedTopic;

  if (!topicId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas text-[var(--gray-9)]">
        <Layers size={48} className="mb-4 text-[var(--gray-8)]" />
        <Text size="2" className="text-[var(--gray-11)]">
          {t("layout.topics.empty")}
        </Text>
      </div>
    );
  }

  if (store.detailLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas text-[var(--gray-9)]">
        <Layers size={48} className="mb-4 text-[var(--gray-8)] animate-pulse" />
        <Text size="2" className="text-[var(--gray-9)]">
          {t("layout.topics.detail.loading_detail")}
        </Text>
      </div>
    );
  }

  if (store.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas">
        <Text size="2" className="text-[var(--red-9)]">
          {store.error}
        </Text>
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  const hasSourceGroups = topic.source_groups && topic.source_groups.length > 0;

  return (
    <div className="flex h-full w-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(RouteConfig.LOCAL_TOPICS)}
            className="flex items-center gap-1 text-[var(--gray-9)] hover:text-[var(--gray-11)] transition-colors text-sm mb-4"
          >
            <ArrowLeft size={14} />
            <span>{t("layout.topics.detail.back")}</span>
          </button>

          <div className="flex items-center justify-between mb-3">
            <Text
              size="6"
              weight="bold"
              className="text-[var(--gray-12)] leading-tight"
            >
              {topic.title}
            </Text>
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors border",
                topic.is_following
                  ? "border-[var(--accent-6)] text-[var(--accent-9)] bg-[var(--accent-2)]"
                  : "border-[var(--gray-6)] text-[var(--gray-11)] hover:border-[var(--gray-7)]",
              )}
              onClick={() => {
                topic.is_following ? store.unfollowTopic(topic.id) : store.followTopic(topic.id);
              }}
            >
              {topic.is_following ? <Pin size={14} /> : <PinOff size={14} />}
              <span>{topic.is_following ? t("layout.topics.following") : t("layout.topics.follow")}</span>
            </button>
          </div>

          {topic.description && (
            <Text
              size="2"
              className="text-[var(--gray-11)] leading-relaxed block mb-4"
            >
              {topic.description}
            </Text>
          )}

          <Flex align="center" gap="4" mb="4">
            <Flex align="center" gap="1">
              <FileText size={14} className="text-[var(--gray-9)]" />
              <Text size="1" className="text-[var(--gray-9)]">
                {topic.article_count} {t("layout.topics.detail.articles")}
              </Text>
            </Flex>
            <Flex align="center" gap="1">
              <Rss size={14} className="text-[var(--gray-9)]" />
              <Text size="1" className="text-[var(--gray-9)]">
                {topic.source_count} {t("layout.topics.detail.sources")}
              </Text>
            </Flex>
            <Flex align="center" gap="1">
              <Clock size={14} className="text-[var(--gray-8)]" />
              <Text size="1" className="text-[var(--gray-8)]">
                {t("layout.topics.detail.last_updated")} {formatDate(topic.last_updated_at)}
              </Text>
            </Flex>
          </Flex>

          <div className="border-t border-[var(--gray-4)] my-4" />

          <Text size="3" weight="medium" className="text-[var(--gray-12)] block mb-3">
            {t("layout.topics.detail.related_articles")}
          </Text>

          {topic.articles.length === 0 ? (
            <Text size="2" className="text-[var(--gray-9)]">
              {t("layout.topics.detail.no_articles")}
            </Text>
          ) : hasSourceGroups ? (
            <div className="flex flex-col gap-4">
              <Text size="2" weight="medium" className="text-[var(--gray-11)]">
                {t("layout.topics.detail.source_groups")}
              </Text>
              {topic.source_groups!.map((group) => (
                <SourceGroup key={group.feed_uuid} group={group} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--gray-4)] overflow-hidden">
              {topic.articles.map((article) => (
                <TopicArticleItem key={article.article_id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: source distribution */}
      {hasSourceGroups && (
        <RightPanel expanded={false}>
          <TopicRightPanel topic={topic} />
        </RightPanel>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify no TypeScript errors**

Run: `npx tsc --noEmit --project apps/desktop/tsconfig.json 2>&1 | head -20`
Expected: No new type errors

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/layout/Intelligence/Topics/TopicDetailPage.tsx apps/desktop/src/layout/Intelligence/Topics/TopicArticleItem.tsx apps/desktop/src/layout/Intelligence/Topics/TopicRightPanel.tsx
git commit -m "feat(topics): add right panel with source distribution to topic detail page"
```

---

### Task 9: i18n Keys + Calm Intelligence CSS

**Files:**
- Modify: `apps/desktop/src/locales/en.json`
- Modify: `apps/desktop/src/locales/zh.json`
- Modify: `apps/desktop/src/styles/custom-theme.css`
- Modify: `apps/desktop/src/styles/custom-components.css`

- [ ] **Step 1: Add new i18n keys to English locale**

In `apps/desktop/src/locales/en.json`, add the following keys inside the `"today"` object (after the `"topic_badge"` key, around line 210):

```json
    "signal_card": {
      "articles": "articles",
      "sources": "sources",
      "level": {
        "high": "High Signal",
        "medium": "Medium Signal",
        "low": "Low Signal"
      }
    },
```

Add the following new keys after the `"topic_badge"` line:

```json
    "right_panel": {
      "evidence_title": "Source Evidence",
      "daily_status": {
        "title": "Today's Status",
        "loading": "Loading status...",
        "no_data": "No data yet",
        "signals": "signals",
        "articles": "articles"
      },
      "next_steps": {
        "title": "Next Steps",
        "explore_topics": "Explore tracked topics",
        "manage_feeds": "Manage your feeds",
        "configure_ai": "Configure AI analysis"
      }
    },
    "inline_reader": {
      "back": "Back",
      "prev": "Previous",
      "next": "Next",
      "content_placeholder": "Article content will be displayed here"
    }
```

In the `"layout.sidebar"` section, add the context labels:

```json
    "sidebar": {
      "brand": "Lettura",
      "today_focus": "Today Focus",
      "today_focus_desc": "View latest signals",
      "tracked_topics": "Tracked Topics",
      "no_tracked_topics": "No tracked topics yet",
      "collapse": "Collapse sidebar",
      "expand": "Expand sidebar",
      "context_today": "Today",
      "context_topics": "Topics",
      "context_feeds": "Feeds",
      "context_default": "Lettura",
      "topics_list": "Topics"
    }
```

In the `"layout.topics.detail"` section, add:

```json
        "source_distribution": "Source Distribution",
        "no_source_data": "No source data available"
```

- [ ] **Step 2: Add new i18n keys to Chinese locale**

In `apps/desktop/src/locales/zh.json`, add corresponding Chinese translations. In the `"today"` object, update `"signal_card"` and add new sections:

```json
    "signal_card": {
      "articles": "篇文章",
      "sources": "个来源",
      "level": {
        "high": "高信号",
        "medium": "中信号",
        "low": "低信号"
      }
    },
```

Add after `"topic_badge"`:

```json
    "right_panel": {
      "evidence_title": "来源证据",
      "daily_status": {
        "title": "今日状态",
        "loading": "加载状态中...",
        "no_data": "暂无数据",
        "signals": "个信号",
        "articles": "篇文章"
      },
      "next_steps": {
        "title": "下一步",
        "explore_topics": "浏览关注的话题",
        "manage_feeds": "管理订阅源",
        "configure_ai": "配置 AI 分析"
      }
    },
    "inline_reader": {
      "back": "返回",
      "prev": "上一篇",
      "next": "下一篇",
      "content_placeholder": "文章内容将在此显示"
    }
```

Update `"layout.sidebar"`:

```json
    "sidebar": {
      "brand": "Lettura",
      "today_focus": "Today Focus",
      "today_focus_desc": "查看最新信号",
      "tracked_topics": "跟踪话题",
      "no_tracked_topics": "尚无跟踪主题",
      "collapse": "收起侧边栏",
      "expand": "展开侧边栏",
      "context_today": "今日",
      "context_topics": "话题",
      "context_feeds": "订阅",
      "context_default": "Lettura",
      "topics_list": "话题列表"
    }
```

In `"layout.topics.detail"`, add:

```json
        "source_distribution": "来源分布",
        "no_source_data": "暂无来源数据"
```

- [ ] **Step 3: Add Calm Intelligence CSS custom properties**

In `apps/desktop/src/styles/custom-theme.css`, insert the following block at the end of the existing `:root` / `.light` / `.light-theme` CSS rule (i.e. after the last property in the `:root` block, before the closing `}` or before the `@supports` block):

```css
/* Calm Intelligence - Blue-purple accent for Today signals */
:root,
.light,
.light-theme {
  --calm-accent: #6366f1;
  --calm-accent-light: #eef2ff;
  --calm-accent-muted: #a5b4fc;
  --calm-bg: #fafafa;
  --calm-card-bg: #ffffff;
  --calm-card-border: #f0f0f2;
  --calm-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  --calm-card-radius: 12px;
  --calm-tag-bg: #f5f3ff;
  --calm-tag-text: #7c3aed;
  --calm-tag-border: #ede9fe;
  --calm-tag-radius: 6px;
  --right-panel-collapsed-width: 280px;
  --right-panel-expanded-width: 480px;
}
```

Add in the `.dark` / `.dark-theme` block (at the end of the existing dark mode rule, after the last property):

```css
/* Calm Intelligence - Dark mode */
.dark,
.dark-theme {
  --calm-accent: #818cf8;
  --calm-accent-light: #1e1b4b;
  --calm-accent-muted: #6366f1;
  --calm-bg: #111;
  --calm-card-bg: #191919;
  --calm-card-border: #2a2a2a;
  --calm-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  --calm-card-radius: 12px;
  --calm-tag-bg: #1e1b4b;
  --calm-tag-text: #a78bfa;
  --calm-tag-border: #312e81;
  --calm-tag-radius: 6px;
}
```

- [ ] **Step 4: Add right-panel component class**

In `apps/desktop/src/styles/custom-components.css`, add at the end of the file:

```css
/* Right panel smooth width transition */
.right-panel-transition {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

- [ ] **Step 5: Run i18n key completeness test**

Run: `pnpm test -- apps/desktop/src/__tests__/i18n-today-keys.test.ts --reporter verbose`
Expected: PASS (existing test structure checks are still valid)

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/locales/en.json apps/desktop/src/locales/zh.json apps/desktop/src/styles/custom-theme.css apps/desktop/src/styles/custom-components.css
git commit -m "feat: add i18n keys and Calm Intelligence CSS custom properties"
```

---

### Task 10: Integration Tests

**Files:**
- Create: `apps/desktop/src/components/layout/__tests__/Sidebar.context.test.tsx`
- Create: `apps/desktop/src/layout/Intelligence/__tests__/TodayInlineReading.test.tsx`

- [ ] **Step 1: Write sidebar context switching test**

Create `apps/desktop/src/components/layout/__tests__/Sidebar.context.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar, SidebarContext } from "../Sidebar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      getSubscribes: vi.fn(),
      globalSyncStatus: false,
      topics: [],
      followingTopicIds: new Set(),
      filterMode: "all",
      setFilterMode: vi.fn(),
    }),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("../SidebarToday", () => ({
  SidebarToday: () => <div data-testid="sidebar-today">Today Sidebar</div>,
}));

vi.mock("../SidebarTopics", () => ({
  SidebarTopics: () => <div data-testid="sidebar-topics">Topics Sidebar</div>,
}));

vi.mock("../SidebarFeeds", () => ({
  SidebarFeeds: () => <div data-testid="sidebar-feeds">Feeds Sidebar</div>,
}));

vi.mock("@/components/AddFeed", () => ({
  AddFeedChannel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/AddFolder", () => ({
  AddFolder: ({ trigger }: { trigger: React.ReactNode }) => <div>{trigger}</div>,
}));

vi.mock("@/hooks/useRefresh", () => ({
  useRefresh: () => ({ startRefresh: vi.fn() }),
}));

vi.mock("react-dnd", () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

vi.mock("@/components/Subscribes", () => ({
  ChannelList: () => <div data-testid="channel-list">Channels</div>,
}));

describe("Sidebar context switching", () => {
  it("should render SidebarToday when context is 'today'", () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} context="today" />);

    expect(screen.getByTestId("sidebar-today")).toBeInTheDocument();
  });

  it("should render SidebarTopics when context is 'topics'", () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} context="topics" />);

    expect(screen.getByTestId("sidebar-topics")).toBeInTheDocument();
  });

  it("should render SidebarFeeds when context is 'feeds'", () => {
    render(<Sidebar collapsed={false} onToggle={vi.fn()} context="feeds" />);

    expect(screen.getByTestId("sidebar-feeds")).toBeInTheDocument();
  });

  it("should return null when collapsed", () => {
    const { container } = render(
      <Sidebar collapsed={true} onToggle={vi.fn()} context="today" />,
    );

    expect(container.innerHTML).toBe("");
  });
});
```

- [ ] **Step 2: Write Today inline reading integration test**

Create `apps/desktop/src/layout/Intelligence/__tests__/TodayInlineReading.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineReader } from "../InlineReader";
import type { SignalSource } from "@/stores/createTodaySlice";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

const sources: SignalSource[] = [
  {
    article_id: 1,
    article_uuid: "u1",
    title: "Article One",
    link: "https://a.com/1",
    feed_title: "Feed A",
    feed_uuid: "fa",
    pub_date: "2026-04-30T10:00:00Z",
    excerpt: "First excerpt",
  },
  {
    article_id: 2,
    article_uuid: "u2",
    title: "Article Two",
    link: "https://b.com/2",
    feed_title: "Feed B",
    feed_uuid: "fb",
    pub_date: "2026-04-30T11:00:00Z",
    excerpt: "Second excerpt",
  },
];

describe("Today inline reading flow", () => {
  it("should display first source when opened", () => {
    render(
      <InlineReader
        source={sources[0]}
        sources={sources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("Article One")).toBeInTheDocument();
    expect(screen.getByText("Feed A")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("should navigate to next source", () => {
    const onNavigate = vi.fn();
    render(
      <InlineReader
        source={sources[0]}
        sources={sources}
        currentIndex={0}
        onBack={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.next"));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("should navigate to previous source", () => {
    const onNavigate = vi.fn();
    render(
      <InlineReader
        source={sources[1]}
        sources={sources}
        currentIndex={1}
        onBack={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.prev"));
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("should call onBack when back button clicked", () => {
    const onBack = vi.fn();
    render(
      <InlineReader
        source={sources[0]}
        sources={sources}
        currentIndex={0}
        onBack={onBack}
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("today.inline_reader.back"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 3: Run all new tests**

Run: `pnpm test -- apps/desktop/src/components/layout/__tests__/Sidebar.context.test.tsx apps/desktop/src/layout/Intelligence/__tests__/TodayInlineReading.test.tsx --reporter verbose`
Expected: All tests PASS

- [ ] **Step 4: Run full test suite to verify nothing is broken**

Run: `pnpm test -- --reporter verbose 2>&1 | tail -30`
Expected: All existing tests + new tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/components/layout/__tests__/Sidebar.context.test.tsx apps/desktop/src/layout/Intelligence/__tests__/TodayInlineReading.test.tsx
git commit -m "test: add integration tests for sidebar context and inline reading"
```

---

### Task 11: Topics List Page Enhancement

**Files:**
- Modify: `apps/desktop/src/layout/Intelligence/Topics/TopicListPage.tsx`

- [ ] **Step 1: Wrap TopicListPage in MainPanel for consistency**

The `TopicListPage` currently renders without `MainPanel` wrapper. The Today page no longer uses `MainPanel` (it uses its own flex layout), but for consistency with other pages like Feeds, Topics should be wrapped.

In `apps/desktop/src/layout/Intelligence/Topics/TopicListPage.tsx`, add the import at the top:

```typescript
import { MainPanel } from "@/components/MainPanel";
```

Wrap the loading state (lines 39-48) with `MainPanel`:

Change from:
```typescript
  if (store.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-canvas text-[var(--gray-9)]">
```

to:
```typescript
  if (store.loading) {
    return (
      <MainPanel>
        <div className="flex flex-col items-center justify-center h-full text-[var(--gray-9)]">
```

And close the `MainPanel` tag (change the closing `</div>` of the loading state to `</div></MainPanel>`).

Apply the same `MainPanel` wrapper pattern to:
- The error state (lines 50-58)
- The empty topics state (lines 60-69)
- The "empty filtered" state (lines 71-110)
- The main content state (lines 112-162)

Each state becomes: `<MainPanel><div ...>...</div></MainPanel>`.

For the main content return (line 112), change:
```typescript
  return (
    <div className="p-6 max-w-3xl mx-auto">
```

to:
```typescript
  return (
    <MainPanel>
      <div className="p-6 max-w-3xl mx-auto overflow-auto h-full">
```

And close with `</MainPanel>` instead of `</div>` at the end.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project apps/desktop/tsconfig.json 2>&1 | head -20`
Expected: No new type errors

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/layout/Intelligence/Topics/TopicListPage.tsx
git commit -m "refactor(topics): wrap TopicListPage in MainPanel for layout consistency"
```

---

## Self-Review

### 1. Spec Coverage

| Spec Requirement | Task |
|-----------------|------|
| Today three-panel layout (Rail + Sidebar + Main + Right Panel) | Task 5 |
| Right panel collapsed (280px) and expanded (480px) for reading | Task 2, Task 5 |
| Signal card with level indicator, confidence, evidence | Task 6 |
| Inline reading in right panel with back/prev/next | Task 4, Task 5 |
| Active signal highlight + inactive signal dimming | Task 5 (SignalList) |
| Sidebar context-aware (different content per page) | Task 7 |
| Topics list page with sidebar context | Task 7, Task 11 |
| Topic detail with right panel (source distribution) | Task 8 |
| Feeds page keeps existing layout, sidebar shows feeds context | Task 7 |
| Dual-path reading: Today inline + Feeds independent | Task 4, Task 5 |
| Calm Intelligence visual (light bg, white cards, accent, tags) | Task 9 |
| i18n keys for all new components | Task 9 |
| Error/empty states preserved | Task 5 (kept from original) |

**Gaps found:** None. All spec requirements are covered.

### 2. Placeholder Scan

Searched for: "TBD", "TODO", "implement later", "fill in details", "add appropriate", "add validation", "handle edge cases", "Write tests for the above", "Similar to Task".
**Result:** None found. All steps contain complete code.

### 3. Type Consistency

- `SignalSource` type used consistently across `SignalSourceItem`, `SignalSourceList`, `InlineReader`, `EvidencePanel`
- `TodaySlice` interface extended with new fields: `activeReadingSignalId`, `activeReadingSourceIndex`, `isInlineReading`, `rightPanelExpanded`
- `SidebarContext` type exported from `Sidebar.tsx` and used in `AppLayout.tsx`
- `RightPanel` props: `expanded: boolean`, `children: ReactNode` — consistent across all usage sites (TodayPage, TopicDetailPage)
- `SignalCardProps` extended with optional `isActive?: boolean` and `onInlineRead?` callback
- `SignalListProps` extended with optional `activeReadingSignalId?: number | null` and `onInlineRead?`
- `TopicArticleItem` now accepts optional `onClick?: (article: TopicArticle) => void`
- i18n keys referenced in components match keys added to en.json/zh.json

**No inconsistencies found.**
