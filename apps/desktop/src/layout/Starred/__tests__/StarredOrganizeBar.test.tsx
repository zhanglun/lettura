import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetCollections = vi.fn().mockResolvedValue([]);
const mockGetArticleCollections = vi.fn().mockResolvedValue([]);
const mockAddArticleToCollection = vi.fn().mockResolvedValue(undefined);
const mockRemoveArticleFromCollection = vi.fn().mockResolvedValue(undefined);
const mockCreateCollection = vi.fn().mockResolvedValue({ id: 99, name: "New", description: null });
const mockGetArticleTags = vi.fn().mockResolvedValue([]);
const mockAddTagToArticle = vi.fn().mockResolvedValue({ id: 10, name: "test-tag" });
const mockRemoveTagFromArticle = vi.fn().mockResolvedValue(undefined);
const mockShowErrorToast = vi.fn();

vi.mock("@/helpers/starredApi", () => ({
  getCollections: (...args: unknown[]) => mockGetCollections(...args),
  getArticleCollections: (...args: unknown[]) => mockGetArticleCollections(...args),
  addArticleToCollection: (...args: unknown[]) => mockAddArticleToCollection(...args),
  removeArticleFromCollection: (...args: unknown[]) => mockRemoveArticleFromCollection(...args),
  createCollection: (...args: unknown[]) => mockCreateCollection(...args),
  getArticleTags: (...args: unknown[]) => mockGetArticleTags(...args),
  addTagToArticle: (...args: unknown[]) => mockAddTagToArticle(...args),
  removeTagFromArticle: (...args: unknown[]) => mockRemoveTagFromArticle(...args),
}));

vi.mock("@/helpers/errorHandler", () => ({
  showErrorToast: (...args: unknown[]) => mockShowErrorToast(...args),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { StarredOrganizeBar } from "../StarredOrganizeBar";
import type { ArticleResItem } from "@/db";

const baseArticle: ArticleResItem = {
  id: 1,
  uuid: "art-1",
  title: "Test Article",
  link: "https://example.com/1",
  description: "desc",
  content: "<p>content</p>",
  author: "",
  image: "",
  media_object: "",
  feed_uuid: "feed-1",
  feed_title: "Feed",
  feed_url: "",
  pub_date: "2026-01-01",
  create_date: "2026-01-01",
  read_status: 0,
  starred: 1,
};

describe("StarredOrganizeBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCollections.mockResolvedValue([
      { id: 1, name: "Collection A", description: null },
      { id: 2, name: "Collection B", description: null },
    ]);
    mockGetArticleCollections.mockResolvedValue([
      { id: 1, name: "Collection A", description: null },
    ]);
    mockGetArticleTags.mockResolvedValue([
      { id: 5, name: "rust" },
      { id: 6, name: "async" },
    ]);
  });

  it("renders organize bar with collection and tag buttons", () => {
    render(<StarredOrganizeBar article={baseArticle} />);
    expect(screen.getByText("starred.organize.title")).toBeInTheDocument();
  });

  it("loads collections and article collections when collection popover opens", async () => {
    render(<StarredOrganizeBar article={baseArticle} />);

    // Find the FolderPlus button and click to open popover
    const buttons = screen.getAllByRole("button");
    const folderButton = buttons.find((b) =>
      b.querySelector("svg.lucide-folder-plus"),
    );
    expect(folderButton).toBeTruthy();
    fireEvent.click(folderButton!);

    await waitFor(() => {
      expect(mockGetCollections).toHaveBeenCalledTimes(1);
      expect(mockGetArticleCollections).toHaveBeenCalledWith(1);
    });
  });

  it("calls addArticleToCollection when checking a collection", async () => {
    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const folderButton = buttons.find((b) =>
      b.querySelector("svg.lucide-folder-plus"),
    );
    fireEvent.click(folderButton!);

    // Wait for collections to load
    await waitFor(() => {
      expect(screen.getByText("Collection A")).toBeInTheDocument();
      expect(screen.getByText("Collection B")).toBeInTheDocument();
    });

    // Click unchecked collection "Collection B"
    const collectionB = screen.getByText("Collection B");
    const checkbox = collectionB.closest("label")!.querySelector("button")!;
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockAddArticleToCollection).toHaveBeenCalledWith(1, 2);
    });
  });

  it("calls removeArticleFromCollection when unchecking a collection", async () => {
    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const folderButton = buttons.find((b) =>
      b.querySelector("svg.lucide-folder-plus"),
    );
    fireEvent.click(folderButton!);

    await waitFor(() => {
      expect(screen.getByText("Collection A")).toBeInTheDocument();
    });

    // Click checked collection "Collection A" to uncheck
    const collectionA = screen.getByText("Collection A");
    const checkbox = collectionA.closest("label")!.querySelector("button")!;
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockRemoveArticleFromCollection).toHaveBeenCalledWith(1, 1);
    });
  });

  it("loads tags when tag popover opens", async () => {
    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const tagButton = buttons.find((b) =>
      b.querySelector("svg.lucide-tags"),
    );
    expect(tagButton).toBeTruthy();
    fireEvent.click(tagButton!);

    await waitFor(() => {
      expect(mockGetArticleTags).toHaveBeenCalledWith(1);
    });
  });

  it("calls removeTagFromArticle when clicking tag remove button", async () => {
    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const tagButton = buttons.find((b) =>
      b.querySelector("svg.lucide-tags"),
    );
    fireEvent.click(tagButton!);

    await waitFor(() => {
      expect(screen.getByText("#rust")).toBeInTheDocument();
    });

    // Find the X button inside the rust tag
    const rustTag = screen.getByText("#rust").closest("span")!;
    const xButton = rustTag.querySelector("button")!;
    fireEvent.click(xButton);

    await waitFor(() => {
      expect(mockRemoveTagFromArticle).toHaveBeenCalledWith(1, 5);
    });
  });

  it("calls addTagToArticle when adding a new tag", async () => {
    mockGetArticleTags
      .mockResolvedValueOnce([]) // initial open
      .mockResolvedValueOnce([{ id: 10, name: "new-tag" }]); // after add

    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const tagButton = buttons.find((b) =>
      b.querySelector("svg.lucide-tags"),
    );
    fireEvent.click(tagButton!);

    await waitFor(() => {
      expect(mockGetArticleTags).toHaveBeenCalledTimes(1);
    });

    // Find the text input for adding tags
    const input = screen.getByPlaceholderText("starred.organize.add_tag");
    fireEvent.change(input, { target: { value: "new-tag" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mockAddTagToArticle).toHaveBeenCalledWith(1, "new-tag");
    });
  });

  it("calls showErrorToast when collection loading fails", async () => {
    mockGetCollections.mockRejectedValueOnce(new Error("Network error"));

    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const folderButton = buttons.find((b) =>
      b.querySelector("svg.lucide-folder-plus"),
    );
    fireEvent.click(folderButton!);

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledTimes(1);
      expect(mockShowErrorToast).toHaveBeenCalledWith(
        expect.any(Error),
        "Failed to load collection data",
      );
    });
  });

  it("calls showErrorToast when tag loading fails", async () => {
    mockGetArticleTags.mockRejectedValueOnce(new Error("Network error"));

    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const tagButton = buttons.find((b) =>
      b.querySelector("svg.lucide-tags"),
    );
    fireEvent.click(tagButton!);

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledTimes(1);
      expect(mockShowErrorToast).toHaveBeenCalledWith(
        expect.any(Error),
        "Failed to load article tags",
      );
    });
  });

  it("calls showErrorToast when toggling collection fails", async () => {
    mockAddArticleToCollection.mockRejectedValueOnce(new Error("Server error"));

    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const folderButton = buttons.find((b) =>
      b.querySelector("svg.lucide-folder-plus"),
    );
    fireEvent.click(folderButton!);

    await waitFor(() => {
      expect(screen.getByText("Collection B")).toBeInTheDocument();
    });

    const collectionB = screen.getByText("Collection B");
    const checkbox = collectionB.closest("label")!.querySelector("button")!;
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith(
        expect.any(Error),
        "Failed to toggle collection",
      );
    });
  });

  it("calls showErrorToast when adding tag fails", async () => {
    mockAddTagToArticle.mockRejectedValueOnce(new Error("Server error"));
    mockGetArticleTags.mockResolvedValueOnce([]);

    render(<StarredOrganizeBar article={baseArticle} />);

    const buttons = screen.getAllByRole("button");
    const tagButton = buttons.find((b) =>
      b.querySelector("svg.lucide-tags"),
    );
    fireEvent.click(tagButton!);

    await waitFor(() => {
      expect(mockGetArticleTags).toHaveBeenCalledTimes(1);
    });

    const input = screen.getByPlaceholderText("starred.organize.add_tag");
    fireEvent.change(input, { target: { value: "fail-tag" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith(
        expect.any(Error),
        "Failed to add tag",
      );
    });
  });

  it("disables buttons when article has no id", () => {
    const noIdArticle = { ...baseArticle, id: undefined as unknown as number };
    render(<StarredOrganizeBar article={noIdArticle} />);

    const buttons = screen.getAllByRole("button");
    // FolderPlus and Tags buttons should be disabled
    const folderButton = buttons.find((b) =>
      b.querySelector("svg.lucide-folder-plus"),
    );
    const tagButton = buttons.find((b) =>
      b.querySelector("svg.lucide-tags"),
    );
    expect(folderButton).toBeDisabled();
    expect(tagButton).toBeDisabled();
  });
});
