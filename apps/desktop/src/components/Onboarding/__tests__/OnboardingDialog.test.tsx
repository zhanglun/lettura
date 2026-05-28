import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OnboardingDialog } from "../OnboardingDialog";

type MockState = {
  onboardingOpen: boolean;
  onboardingStep: string;
  setOnboardingStep: ReturnType<typeof vi.fn>;
  setOnboardingOpen: ReturnType<typeof vi.fn>;
  selectedInterestIds: string[];
  toggleInterestSelection: ReturnType<typeof vi.fn>;
  packs: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    language: string;
    tags: string[];
    source_count: number;
  }>;
  packsLoading: boolean;
  packsError: string | null;
  fetchPacks: ReturnType<typeof vi.fn>;
  selectedPackIds: string[];
  togglePackSelection: ReturnType<typeof vi.fn>;
  startInstall: ReturnType<typeof vi.fn>;
  installStatus: string;
  installProgress: { completed: number; total: number };
  installResult: null;
  installError: string | null;
  completeOnboarding: ReturnType<typeof vi.fn>;
  importOpmlAsSource: ReturnType<typeof vi.fn>;
  opmlImporting: boolean;
  opmlImportError: string | null;
};

let mockState: MockState;

vi.mock("@/stores", () => ({
  useBearStore: (selector: (state: MockState) => unknown) => selector(mockState),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

describe("OnboardingDialog", () => {
  beforeEach(() => {
    mockState = {
      onboardingOpen: true,
      onboardingStep: "welcome",
      setOnboardingStep: vi.fn(),
      setOnboardingOpen: vi.fn(),
      selectedInterestIds: ["ai"],
      toggleInterestSelection: vi.fn(),
      packs: [
        {
          id: "ai-starter",
          name: "AI Starter Pack",
          description: "AI sources",
          icon: "Bot",
          language: "en",
          tags: ["ai", "ml"],
          source_count: 8,
        },
      ],
      packsLoading: false,
      packsError: null,
      fetchPacks: vi.fn(),
      selectedPackIds: ["ai-starter"],
      togglePackSelection: vi.fn(),
      startInstall: vi.fn(),
      installStatus: "idle",
      installProgress: { completed: 0, total: 1 },
      installResult: null,
      installError: null,
      completeOnboarding: vi.fn(),
      importOpmlAsSource: vi.fn(),
      opmlImporting: false,
      opmlImportError: null,
    };
  });

  it("moves from welcome into interest selection", () => {
    render(<OnboardingDialog />);

    fireEvent.click(screen.getByText("onboarding.welcome.get_started"));

    expect(mockState.setOnboardingStep).toHaveBeenCalledWith("interests");
  });

  it("renders interest selection before starter packs", () => {
    mockState.onboardingStep = "interests";

    render(<OnboardingDialog />);

    expect(screen.getByText("onboarding.interests.title")).toBeInTheDocument();
    expect(screen.getByText("onboarding.interests.next")).toBeInTheDocument();
  });

  it("renders starter packs after interest selection", () => {
    mockState.onboardingStep = "select-pack";

    render(<OnboardingDialog />);

    expect(screen.getByText("onboarding.select_pack.title")).toBeInTheDocument();
    expect(screen.getByText("AI Starter Pack")).toBeInTheDocument();
  });
});
