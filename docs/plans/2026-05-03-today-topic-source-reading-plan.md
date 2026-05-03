# 2026-05-03 Today / Topic Source Reading Plan

## Purpose

Fix the current Today and Topic gaps found in review:

1. Today source articles open a right-side reader but do not show real article content.
2. Source article primary click can still navigate away from Today instead of opening/replacing the right-side detail.
3. Signal topic tags go to the Topics list instead of the matching Topic detail.
4. Today feedback buttons use emoji, while the PRD requires plain text controls.
5. Topic detail lacks the minimum Recent Changes and Start Here sections from the PRD.
6. Topics empty preview has duplicated hard-coded Chinese and non-i18n units.

This plan is the narrow execution entry for GLM. Do not use the archived progress document as the primary task source for this round.

## Scope

### Batch A: Must Complete

- Today source article right-side reading flow.
- Topic tag navigation to the matching Topic detail.
- Feedback button UI cleanup.
- Topics empty preview cleanup.
- Focused tests for the above.

### Batch B: Best Effort

- Minimal Topic detail `Recent Changes`.
- Minimal Topic detail `Start Here`.
- Focused tests if these sections are implemented.

## Explicit Non-Goals

- Do not implement Phase 6 Refresh Center.
- Do not redesign Today or Topic overall layout.
- Do not modify Feeds, Search, Starred, Settings, or onboarding unless a compile error requires a tiny type update.
- Do not add a new AI generation chain.
- Do not change Feed unread/read_status behavior.
- Do not treat `follow_topic` feedback as real Topic follow unless the existing backend already does that. If it only records feedback, leave it as-is and note it as a future task.

## Product Rules

- `Source Articles` only expands/collapses the source list.
- Source item primary click opens or replaces the right-side detail.
- Opening another source article replaces the current detail without requiring close first.
- Closing the right-side detail clears only the active source article/detail. It must not force-collapse the source list.
- Today inline source reading must not automatically change `read_status`.
- Full Article View or an explicit user action may keep the existing mark-read behavior.
- Source detail must support four states:
  - loading
  - error with retry
  - empty when no `content` / `description` / `excerpt` exists
  - content
- Article HTML must be rendered through the existing safe article rendering path or an existing safe HTML rendering helper. Do not split raw HTML as plain text paragraphs.
- Feedback buttons must be plain text: useful, not relevant, continue tracking. No emoji.
- Topic detail `Recent Changes` / `Start Here` may be derived from existing topic articles. Do not pretend they are AI-generated.

## Implementation Plan

### 1. Today Source Article Detail

- Review these files first:
  - `apps/desktop/src/layout/Intelligence/TodayPage.tsx`
  - `apps/desktop/src/layout/Intelligence/SignalCard.tsx`
  - `apps/desktop/src/layout/Intelligence/SignalSourceList.tsx`
  - `apps/desktop/src/layout/Intelligence/SignalSourceItem.tsx`
  - `apps/desktop/src/layout/Intelligence/InlineReader.tsx`
  - `apps/desktop/src/stores/createTodaySlice.ts`
  - existing article detail APIs in `apps/desktop/src/helpers/dataAgent.ts` and Rust commands.

- Add or reuse a way to fetch full article detail by `article_uuid` or `article_id`.
- Add Today store state:
  - `activeSourceArticleUuid`
  - `sourceArticleDetail`
  - `sourceArticleLoading`
  - `sourceArticleError`
- Add Today store actions:
  - `openSourceArticle(source)`
  - `closeSourceArticle()`
  - `retrySourceArticle()`
- `openSourceArticle(source)` must:
  - overwrite the current active source
  - set loading
  - fetch full article detail
  - set content on success
  - set error on failure
- Update `InlineReader` to prefer full article `content` / `description`; fallback to `source.excerpt`; otherwise show empty state.
- Keep the external original link as a secondary action.

### 2. Source Click Behavior

- Remove the primary `navigate('/local/feeds/...')` behavior from Today source item clicks.
- Source item primary click must call `openSourceArticle(source)`.
- `Source Articles` expand/collapse must remain independent from right-side detail state.

### 3. Topic Tag Navigation

- Backend `Signal` should include `topic_uuid` when `topic_id` is present.
- Frontend `Signal` type should include `topic_uuid?: string | null`.
- `SignalCard` topic tag should link to `/local/topics/:topic_uuid`.
- If `topic_uuid` is unavailable, do not guess via title. Prefer fixing the backend response.

### 4. Feedback UI

- Remove emoji from Today feedback buttons.
- Keep the existing `submitFeedback` behavior.
- Use plain text labels from i18n.

### 5. Topics Empty Preview

- Remove duplicated hard-coded Chinese next steps.
- Add i18n keys for `articles` and `sources` units if needed.
- Verify Chinese and English locales do not mix languages.

### 6. Topic Detail Minimum PRD Sections

Best effort:

- Add `Recent Changes` section:
  - use backend `recent_changes` if present
  - otherwise derive from the latest 3 topic articles by date
  - show date, title, feed/source
- Add `Start Here` section:
  - use top 1-3 articles by `relevance_score`
  - provide a read/open entry
- Do not add AI generation.

## Tests

Add or update focused tests:

- `Source Articles` click only expands source list.
- Source item click opens right-side detail.
- Clicking another source item replaces the detail.
- Closing detail allows reopening any source.
- Detail fetch failure shows error state and retry.
- `openSourceArticle` overwrites current source.
- `closeSourceArticle` clears active detail but does not collapse source list.
- Topic tag links to matching Topic detail.
- Feedback buttons render without emoji.
- Topics empty preview does not render hard-coded Chinese or English-only units.
- If Batch B is implemented:
  - Topic detail renders Recent Changes.
  - Topic detail renders Start Here.

## Verification Commands

Run:

```bash
pnpm --dir apps/desktop exec tsc --noEmit
pnpm --dir apps/desktop exec vitest run src/layout/Intelligence
```

If Rust types or commands change, also run:

```bash
cargo check
```

## Completion Report

When done, report:

- Files changed.
- Which Batch A items are complete.
- Whether Batch B was completed or deferred.
- Commands run and exact results.
- Any remaining known gaps.
