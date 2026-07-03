import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIConfigPanel } from "../AIConfig";
import { Appearance } from "../Appearance";
import { Behavior } from "../Behavior";
import { Sources } from "../Sources";

const mocks = vi.hoisted(() => ({
  fetchAIConfig: vi.fn(),
  getDedupStats: vi.fn(() => Promise.resolve({
    total_analyzed: 1247,
    duplicates_found: 86,
    duplicate_groups: 23,
    avg_information_density: 0.72,
  })),
  saveAIConfig: vi.fn(() => Promise.resolve(undefined)),
  triggerPipeline: vi.fn(() => Promise.resolve(undefined)),
  validateAIConfig: vi.fn(() => Promise.resolve({ valid: true, message: "ok" })),
  syncFeed: vi.fn(() => Promise.resolve(undefined)),
  updateUserConfig: vi.fn(),
  storeState: {
    aiConfig: {
      has_api_key: true,
      model: "gpt-4o-mini",
      embedding_model: "text-embedding-3-small",
      base_url: "https://api.openai.com/v1",
      enable_embedding: true,
      pipeline_interval_hours: 6,
      enable_auto_pipeline: true,
    },
    pipelineStatus: "idle",
    userConfig: {
      update_interval: 0,
      threads: 1,
      color_scheme: "light",
      customize_style: {
        font_size: 18,
        line_height: 1.6,
      },
      reader_preset: "comfortable",
      card_density: "comfortable",
      launch_at_login: false,
      background_sync: true,
      notification_level: "off",
      notification_enabled: false,
      cache_retention_days: 30,
      data_retention_days: 90,
      purge_on_days: 0,
      purge_unread_articles: true,
    },
    subscribes: [
      {
        uuid: "folder-1",
        item_type: "folder",
        title: "Engineering",
        children: [
          {
            uuid: "feed-1",
            item_type: "channel",
            title: "Vercel Blog",
            link: "https://vercel.com/blog",
            feed_url: "https://vercel.com/feed",
            unread: 2,
            health_status: 0,
            last_sync_date: "2026-05-26T09:56:00Z",
          },
        ],
      },
      {
        uuid: "feed-2",
        item_type: "channel",
        title: "The Information",
        link: "https://theinformation.com",
        feed_url: "https://rsshub.app/theinformation",
        unread: 0,
        health_status: 2,
        last_sync_date: "2026-05-26T09:57:00Z",
      },
    ],
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "zh",
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock("i18next", () => ({
  default: {
    t: (key: string) => key,
  },
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector,
}));

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      aiConfig: mocks.storeState.aiConfig,
      fetchAIConfig: mocks.fetchAIConfig,
      pipelineStatus: mocks.storeState.pipelineStatus,
      userConfig: mocks.storeState.userConfig,
      updateUserConfig: mocks.updateUserConfig,
      subscribes: mocks.storeState.subscribes,
      syncAllArticles: vi.fn(),
    }),
}));

vi.mock("@/helpers/dataAgent", () => ({
  getDedupStats: mocks.getDedupStats,
  saveAIConfig: mocks.saveAIConfig,
  validateAIConfig: mocks.validateAIConfig,
  triggerPipeline: mocks.triggerPipeline,
  syncFeed: mocks.syncFeed,
  exportOpml: vi.fn(),
}));

vi.mock("@/layout/Setting/CustomizeStyle", () => ({
  CustomizeStyle: () => <div data-testid="customize-style" />,
}));

vi.mock("../Appearance/ColorScheme", () => ({
  ColorScheme: () => <div data-testid="color-scheme" />,
}));

vi.mock("../Appearance/Accent", () => ({
  Accent: () => <div data-testid="accent-picker" />,
}));

vi.mock("@tauri-apps/plugin-autostart", () => ({
  enable: vi.fn(),
  disable: vi.fn(),
  isEnabled: vi.fn(() => Promise.resolve(false)),
}));

vi.mock("@radix-ui/themes", () => ({
  Select: {
    Root: ({
      children,
      value,
      onValueChange,
    }: {
      children: React.ReactNode;
      value?: string;
      onValueChange?: (value: string) => void;
    }) => (
      <select value={value} onChange={(event) => onValueChange?.(event.target.value)}>
        {children}
      </select>
    ),
    Trigger: () => null,
    Content: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Group: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Item: ({ children, value }: { children: React.ReactNode; value: string }) => (
      <option value={value}>{children}</option>
    ),
  },
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (value: boolean) => void }) => (
    <button type="button" aria-pressed={checked} onClick={() => onCheckedChange?.(!checked)} />
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Settings tabs mockup alignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AI config exposes provider, pipeline, embedding, and privacy sections", async () => {
    const { container } = render(<AIConfigPanel />);

    expect(screen.getByText("settings.ai.provider_title")).toBeInTheDocument();
    expect(screen.getByText("settings.ai.analysis_status")).toBeInTheDocument();
    expect(screen.getByText("settings.ai.modeling_title")).toBeInTheDocument();
    expect(screen.getByText("settings.ai.enable_embedding")).toBeInTheDocument();
    expect(screen.getByText("settings.ai.privacy_title")).toBeInTheDocument();
    expect(container.querySelector(".settings-ai-layout")).toBeInTheDocument();
    expect(container.querySelector(".settings-ai-provider-panel")).toBeInTheDocument();
    expect(container.querySelector(".settings-ai-status-panel")).toBeInTheDocument();
    expect(container.querySelector(".settings-ai-run-panel")).toBeInTheDocument();
    expect(screen.getByDisplayValue("text-embedding-3-small")).toBeInTheDocument();
    expect(await screen.findByText("1247")).toBeInTheDocument();
  });

  it("AI config validates, saves, and manually triggers the pipeline", async () => {
    render(<AIConfigPanel />);

    fireEvent.click(screen.getByRole("button", { name: "settings.ai.validate" }));
    await waitFor(() => expect(mocks.validateAIConfig).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("settings.ai.api_key"), {
      target: { value: "sk-test" },
    });
    fireEvent.change(screen.getByLabelText("settings.ai.base_url"), {
      target: { value: "https://example.test/v1" },
    });
    fireEvent.change(screen.getByDisplayValue("text-embedding-3-small"), {
      target: { value: "text-embedding-3-large" },
    });
    fireEvent.click(screen.getByRole("button", { name: "settings.ai.save" }));

    await waitFor(() => expect(mocks.saveAIConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "sk-test",
        baseUrl: "https://example.test/v1",
        embeddingModel: "text-embedding-3-large",
      }),
    ));

    fireEvent.click(screen.getByRole("button", { name: /settings\.ai\.trigger_pipeline/ }));
    await waitFor(() => expect(mocks.triggerPipeline).toHaveBeenCalledWith("manual"));
  });

  it("sources health counts nested feeds from folders", () => {
    const { container } = render(<Sources />);

    expect(screen.getByText("settings.sources.health_center_title")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("The Information")).toBeInTheDocument();
    expect(container.querySelector(".settings-sources-layout")).toBeInTheDocument();
    expect(container.querySelector(".settings-sources-health-panel")).toBeInTheDocument();
    expect(container.querySelector(".settings-sources-broken-list")).toBeInTheDocument();
    expect(screen.getByText("settings.sources.open_subscription_management")).toBeInTheDocument();
    expect(screen.getByText("settings.sources.broken_queue_help")).toBeInTheDocument();
  });

  it("sources retry action syncs the selected broken feed", () => {
    render(<Sources />);

    fireEvent.click(screen.getByRole("button", { name: "settings.sources.action_retry" }));

    expect(mocks.syncFeed).toHaveBeenCalledWith("channel", "feed-2");
  });

  it("appearance exposes theme, accent, presets, density, and reading preview", () => {
    const { container } = render(<Appearance />);

    expect(screen.getByText("Theme mode")).toBeInTheDocument();
    expect(screen.getByText("Accent color")).toBeInTheDocument();
    expect(screen.getByText("Reader preference")).toBeInTheDocument();
    expect(screen.getByText("Card density")).toBeInTheDocument();
    expect(screen.getByText("Reading preview")).toBeInTheDocument();
    expect(container.querySelector(".settings-appearance-layout")).toBeInTheDocument();
    expect(container.querySelectorAll(".settings-appearance-theme-card")).toHaveLength(3);
    expect(container.querySelector(".settings-mini-list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A-" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A+" })).toBeInTheDocument();
    expect(container.querySelectorAll(".settings-preview-article p")).toHaveLength(3);
  });

  it("appearance controls persist theme, reading style, preset, and density changes", () => {
    render(<Appearance />);

    fireEvent.click(screen.getByText("Dark"));
    expect(mocks.updateUserConfig).toHaveBeenCalledWith(
      expect.objectContaining({ color_scheme: "dark" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "A+" }));
    expect(mocks.updateUserConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        customize_style: expect.objectContaining({ font_size: 19 }),
      }),
    );

    fireEvent.change(screen.getByLabelText("Line height"), { target: { value: "1.8" } });
    expect(mocks.updateUserConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        customize_style: expect.objectContaining({ line_height: 1.8 }),
      }),
    );

    fireEvent.click(screen.getByText("Immersive"));
    expect(mocks.updateUserConfig).toHaveBeenCalledWith(
      expect.objectContaining({ reader_preset: "immersive" }),
    );

    fireEvent.change(screen.getByDisplayValue("Comfortable"), { target: { value: "compact" } });
    expect(mocks.updateUserConfig).toHaveBeenCalledWith(
      expect.objectContaining({ card_density: "compact" }),
    );
  });

  it("behavior exposes runtime summary and storage controls", () => {
    const { container } = render(<Behavior />);

    expect(screen.getByText("settings.behavior.runtime_status")).toBeInTheDocument();
    expect(screen.getByText("settings.behavior.system_behavior")).toBeInTheDocument();
    expect(screen.getByText("settings.behavior.data_cache")).toBeInTheDocument();
    expect(screen.getByText("settings.behavior.local_storage")).toBeInTheDocument();
    expect(screen.getByText("settings.behavior.exit_behavior")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Launch at Login")).toBeInTheDocument();
    expect(screen.getByText("Local Storage")).toBeInTheDocument();
    expect(container.querySelector(".settings-behavior-layout")).toBeInTheDocument();
    expect(container.querySelector(".settings-behavior-system-panel")).toBeInTheDocument();
    expect(container.querySelector(".settings-behavior-data-panel")).toBeInTheDocument();
    expect(container.querySelector(".settings-behavior-storage-panel")).toBeInTheDocument();
    expect(container.querySelector(".settings-behavior-exit-panel")).toBeInTheDocument();
  });
});
