import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import * as dataAgent from "@/helpers/dataAgent";
import { request } from "@/helpers/request";

vi.mock("@tauri-apps/api/core");
vi.mock("@/helpers/request", () => ({
  request: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("dataAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("HTTP request functions", () => {
    describe("getChannels", () => {
      it("should get channels with filter", async () => {
        const mockResponse = {
          data: { list: [{ uuid: "1", name: "Channel 1", parent_uuid: "" }] },
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const filter = { type: "all" };
        const result = await dataAgent.getChannels(filter);

        expect(request.get).toHaveBeenCalledWith("feeds", {
          params: { filter },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getSubscribes", () => {
      it("should get all subscribes", async () => {
        const mockResponse = {
          data: [{ uuid: "1", name: "Feed 1", url: "https://example.com" }],
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const result = await dataAgent.getSubscribes();

        expect(request.get).toHaveBeenCalledWith("subscribes");
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getFolders", () => {
      it("should get all folders", async () => {
        const mockResponse = {
          data: [{ uuid: "1", name: "Folder 1" }],
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const result = await dataAgent.getFolders();

        expect(request.get).toHaveBeenCalledWith("folders", {});
        expect(result).toEqual(mockResponse);
      });
    });

    describe("deleteChannel", () => {
      it("should delete channel by uuid", async () => {
        const mockResponse = { data: { success: true } };
        (request.delete as any).mockResolvedValue(mockResponse);

        const result = await dataAgent.deleteChannel("channel-uuid-123");

        expect(request.delete).toHaveBeenCalledWith("feeds/channel-uuid-123", {
          params: { delete_articles: false },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getArticleList", () => {
      it("should get article list with filter", async () => {
        const mockResponse = {
          data: { list: [{ uuid: "1", title: "Article 1" }], total: 1 },
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const filter = { feed_uuid: "feed-123", page: 1 };
        const result = await dataAgent.getArticleList(filter);

        expect(request.get).toHaveBeenCalledWith("articles", {
          params: filter,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe("syncFeed", () => {
      it("should sync feed by uuid and type", async () => {
        const mockResponse = {
          data: { "feed-123": ["synced", 5, "success"] },
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const result = await dataAgent.syncFeed("rss", "feed-123");

        expect(request.get).toHaveBeenCalledWith("/feeds/feed-123/sync", {
          params: { feed_type: "rss" },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getUnreadTotal", () => {
      it("should get unread total counts", async () => {
        const mockResponse = {
          data: { "feed-1": 10, "feed-2": 5 },
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const result = await dataAgent.getUnreadTotal();

        expect(request.get).toHaveBeenCalledWith("unread-total");
        expect(result).toEqual(mockResponse);
      });
    });

    describe("updateArticleReadStatus", () => {
      it("should update article read status", async () => {
        const mockResponse = { data: { success: true } };
        (request.post as any).mockResolvedValue(mockResponse);

        const result = await dataAgent.updateArticleReadStatus(
          "article-uuid-123",
          1,
        );

        expect(request.post).toHaveBeenCalledWith(
          "/articles/article-uuid-123/read",
          { read_status: 1 },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("markAllRead", () => {
      it("should mark all articles as read", async () => {
        const mockResponse = { data: 5 };
        (request.post as any).mockResolvedValue(mockResponse);

        const body = { isAll: true };
        const result = await dataAgent.markAllRead(body);

        expect(request.post).toHaveBeenCalledWith("/mark-all-as-read", body);
        expect(result).toEqual(mockResponse);
      });

      it("should mark articles as read for specific feed", async () => {
        const mockResponse = { data: 3 };
        (request.post as any).mockResolvedValue(mockResponse);

        const body = { uuid: "feed-123", isToday: false };
        const result = await dataAgent.markAllRead(body);

        expect(request.post).toHaveBeenCalledWith("/mark-all-as-read", body);
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getUserConfig", () => {
      it("should get user config", async () => {
        const mockResponse = {
          data: { theme: "light", language: "en" },
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const result = await dataAgent.getUserConfig();

        expect(request.get).toHaveBeenCalledWith("/user-config");
        expect(result).toEqual(mockResponse);
      });
    });

    describe("updateUserConfig", () => {
      it("should update user config", async () => {
        const mockResponse = {
          data: { theme: "dark", language: "en" },
        };
        (request.post as any).mockResolvedValue(mockResponse);

        const config = { theme: "dark" };
        const result = await dataAgent.updateUserConfig(config);

        expect(request.post).toHaveBeenCalledWith("/user-config", config);
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getArticleDetail", () => {
      it("should get article detail by uuid", async () => {
        const mockResponse = {
          data: { uuid: "1", title: "Article 1", content: "Content" },
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const config = { headers: { "X-Cache": "no" } };
        const result = await dataAgent.getArticleDetail("article-1", config);

        expect(request.get).toHaveBeenCalledWith("articles/article-1", config);
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getBestImage", () => {
      it("should get best image for url", async () => {
        const mockResponse = {
          data: "https://example.com/best-image.jpg",
        };
        (request.get as any).mockResolvedValue(mockResponse);

        const result = await dataAgent.getBestImage("https://example.com/page");

        expect(request.get).toHaveBeenCalledWith("image-proxy", {
          params: { url: "https://example.com/page" },
        });
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe("Tauri command functions", () => {
    describe("createFolder", () => {
      it("should create folder via Tauri command", async () => {
        const mockResult = 1;
        (invoke as any).mockResolvedValue(mockResult);

        const result = await dataAgent.createFolder("Test Folder");

        expect(invoke).toHaveBeenCalledWith("create_folder", {
          name: "Test Folder",
        });
        expect(result).toBe(mockResult);
      });
    });

    describe("updateFolder", () => {
      it("should update folder via Tauri command", async () => {
        const mockResult = 1;
        (invoke as any).mockResolvedValue(mockResult);

        const result = await dataAgent.updateFolder("folder-uuid", "New Name");

        expect(invoke).toHaveBeenCalledWith("update_folder", {
          uuid: "folder-uuid",
          name: "New Name",
        });
        expect(result).toBe(mockResult);
      });
    });

    describe("fetchFeed", () => {
      it("should fetch feed via Tauri command", async () => {
        const mockResult = [{ title: "Feed Title" }, "success"];
        (invoke as any).mockResolvedValue(mockResult);

        const result = await dataAgent.fetchFeed("https://example.com/feed");

        expect(invoke).toHaveBeenCalledWith("fetch_feed", {
          url: "https://example.com/feed",
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe("subscribeFeed", () => {
      it("should subscribe to feed via Tauri command", async () => {
        const mockResult = [{ uuid: "feed-123", name: "Feed" }, 5, "success"];
        (invoke as any).mockResolvedValue(mockResult);

        const result = await dataAgent.subscribeFeed(
          "https://example.com/feed",
        );

        expect(invoke).toHaveBeenCalledWith("add_feed", {
          url: "https://example.com/feed",
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe("updateThreads", () => {
      it("should update threads via Tauri command", async () => {
        const mockResult = { success: true };
        (invoke as any).mockResolvedValue(mockResult);

        const result = await dataAgent.updateThreads(4);

        expect(invoke).toHaveBeenCalledWith("update_threads", {
          threads: 4,
        });
        expect(result).toEqual(mockResult);
      });
    });
  });
});
