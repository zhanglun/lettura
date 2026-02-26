# AGENTS.md

This file provides essential guidelines for AI agents working on the Lettura codebase.

## Project Overview

Lettura is a cross-platform feed reader built with Tauri (Rust backend + React frontend). It uses TypeScript, React, Zustand for state management, and Tailwind CSS with Radix UI for styling.

## Build & Development Commands

```bash
# Development (starts both Tauri frontend and Rust backend)
pnpm tauri dev

# Production build
pnpm tauri build

# Frontend build only
pnpm build  # runs: tsc && vite build

# Type check
tsc --noEmit

# Lint (uses Rome)
npx rome check src/

# Format (uses Rome)
npx rome format src/

# Run all tests
pnpm test

# Run single test file
pnpm test path/to/test.spec.ts

# Run tests in watch mode
pnpm test -- --watch
```

**Note**: Vitest is configured with jsdom environment. Test setup file: `src/__tests__/setup.ts`

## TypeScript Configuration

- **Strict mode**: Enabled
- **Target**: ESNext
- **Module Resolution**: Node
- **Path aliases**: `@/*` maps to `./src/*`
- **Key settings**: `forceConsistentCasingInFileNames`, `isolatedModules`, `jsx: "react-jsx"`

Always run `tsc --noEmit` before committing to catch type errors.

## Code Style Guidelines

### Imports

Import order (from top to bottom):
1. React and external libraries
2. Third-party packages
3. Local modules with `@/` alias
4. Type imports (if needed)

```tsx
import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { toast } from "sonner";
import { useBearStore } from "@/stores";
import { ArticleResItem } from "@/db";
import { showErrorToast } from "@/helpers/errorHandler";
```

### Formatting (Rome)

- **Indentation**: 2 spaces
- **Line width**: 80 characters
- **Line endings**: LF
- **Quote style**: Single quotes
- Always format with `npx rome format` before committing

### Naming Conventions

- **Components**: PascalCase (e.g., `DialogAboutApp`, `LocalPage`, `Kbd`)
- **Hooks**: camelCase with `use` prefix (e.g., `useLoadFeed`, `useScrollTop`)
- **Functions/Methods**: camelCase (e.g., `setArticle`, `getSubscribes`)
- **Variables**: camelCase
- **Constants/Enums**: PascalCase (e.g., `ArticleReadStatus`, `ArticleStarStatus`)
- **Store slices**: `create[Name]Slice` (e.g., `createArticleSlice`)
- **Stores**: `use[Name]Store` (e.g., `useBearStore`)

### File Organization

```
src/
├── components/     # Reusable UI components (Kbd, Modal, Icon)
├── layout/         # Page-level components (Article, Search, Setting, Local)
├── stores/         # Zustand slices and main store
├── helpers/        # Utilities (dataAgent, request, errorHandler)
├── hooks/          # Custom React hooks
├── typing/         # Enums and shared types
├── db.ts           # Database interfaces (Channel, Article, Feed)
├── App.tsx         # Root component
└── index.tsx       # Entry point
```

### State Management (Zustand)

**Slice pattern**:
```tsx
import { StateCreator } from "zustand";

export interface MySlice {
  value: string;
  setValue: (val: string) => void;
}

export const createMySlice: StateCreator<MySlice> = (set, get) => ({
  value: "",
  setValue: (val) => set({ value: val }),
});
```

**Component usage with selective subscription**:
```tsx
const store = useBearStore(
  useShallow((state) => ({
    article: state.article,
    setArticle: state.setArticle,
  }))
);
```

Update state immutably: `set(() => ({ articleList: list }))`

### React Patterns

- Use functional components with hooks exclusively
- Use `useEffect` for side effects and lifecycle events
- Use `useShallow` for selective store subscriptions (prevents re-renders)
- Custom hooks in `hooks/` for complex logic
- For DOM manipulation: `useEffect` with event listeners

### API Layer

**Tauri commands**:
```tsx
import { invoke } from "@tauri-apps/api";
export const createFolder = async (name: string): Promise<number> => {
  return invoke("create_folder", { name });
};
```

**HTTP requests**:
```tsx
import { request } from "@/helpers/request";
export const getArticles = async () => {
  return request.get("articles");
};
```

Return typed Promises. Chain `.then()` for results.

### Error Handling

Use `src/helpers/errorHandler.ts` for consistent error handling:

```tsx
import { showErrorToast, showSuccessToast, withErrorToast } from "@/helpers/errorHandler";

// Show error toast
showErrorToast(error, "Operation failed");

// Show success toast
showSuccessToast("Saved successfully");

// Wrap async calls with error handling
const result = await withErrorToast(promise, "Failed to load data");
```

Error types: `NETWORK`, `SYNC`, `VALIDATION`, `UNKNOWN`

### Internationalization

Use `i18next` for translations:

```tsx
import { t } from "i18next";
import i18next from "i18next";

// Get translation
const message = t("Save successful");

// In components
{i18next.t("We have {{num}} new items", { num: 5 })}
```

### Styling

- **Framework**: Tailwind CSS v3 with Radix UI
- **Theme**: Light/dark via `@radix-ui/themes` `Theme` component
- **Class utilities**: `clsx` for conditional classes:
  ```tsx
  className={clsx("base-class", isActive && "active-class", className)}
  ```
- **Custom colors**: Radix color tokens in `tailwind.config.js`
- Prefer Tailwind utility classes over inline styles

### Type Safety

- **NEVER** use `@ts-ignore`, `@ts-except-error`, or `as any`
- Define interfaces/types in appropriate files (`typing/`, `db.ts`, component files)
- Use enums for fixed values (`typing/index.ts`)

### Linting Rules (Rome)

From `rome.json`:
- `recommended` rules enabled
- `suspicious.noExplicitAny`: OFF (prefer proper typing)
- `security.noDangerouslySetInnerHtml`: OFF (used for HTML parsing)
- `a11y.useKeyWithClickEvents`: OFF (custom keyboard shortcuts)

## Architecture Notes

- **Frontend**: Vite + React 18
- **Backend**: Rust (Tauri) + Actix-web server
- **Database**: Diesel ORM with SQLite
- **State**: Zustand with `subscribeWithSelector` middleware
- **Styling**: Tailwind CSS + Radix UI
- **i18n**: i18next
- **Testing**: Vitest + React Testing Library
- **Toast**: Sonner

## Before Committing

1. `tsc --noEmit` - type check
2. `npx rome format src/` - format
3. `npx rome check src/` - lint
4. `pnpm test` - run tests
5. Test manually in `pnpm tauri dev`

## Common Patterns

**New component**:
```tsx
import React from "react";
import { clsx } from "clsx";

interface Props {
  value: string;
  className?: string;
}

export const MyComponent = ({ value, className }: Props) => (
  <div className={clsx("base-styles", className)}>{value}</div>
);
```

**Async operation with error handling**:
```tsx
import { withErrorToast } from "@/helpers/errorHandler";

const result = await withErrorToast(
  dataAgent.fetchData(params),
  "Failed to fetch data"
);
```
