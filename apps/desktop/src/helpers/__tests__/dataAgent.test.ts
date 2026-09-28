import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import * as dataAgent from "@/helpers/dataAgent";

// 数据面已收敛为单一 invoke 通道：这里只验证「函数 → 命令名 + 参数」的契约。
// invoke 本身由 setup.ts 全局 mock。

describe("dataAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSubscribes 调 get_subscribes", async () => {
    (invoke as any).mockResolvedValue([]);
    await dataAgent.getSubscribes();
    expect(invoke).toHaveBeenCalledWith("get_subscribes");
  });

  it("getArticleList 透传 filter", async () => {
    (invoke as any).mockResolvedValue({ list: [], total: 0 });
    const filter = { read_status: 1, limit: 20, cursor: 2 };
    await dataAgent.getArticleList(filter);
    expect(invoke).toHaveBeenCalledWith("get_articles", { filter });
  });

  it("getCarrierCounts 透传 filter", async () => {
    (invoke as any).mockResolvedValue({ text: 1, audio: 0, video: 0, email: 0 });
    await dataAgent.getCarrierCounts({ feed_uuid: "f1" });
    expect(invoke).toHaveBeenCalledWith("get_carrier_counts", {
      filter: { feed_uuid: "f1" },
    });
  });

  it("fetchFeed 透传探测参数（含新模式参数）", async () => {
    (invoke as any).mockResolvedValue({ feed: null, resolved_url: "", candidates: [], entries: [], message: "" });
    await dataAgent.fetchFeed("a@x.com", undefined, "email", "mail", "acct-1");
    expect(invoke).toHaveBeenCalledWith("fetch_feed", {
      url: "a@x.com",
      origin: undefined,
      carrier: "email",
      providerHint: "mail",
      accountUuid: "acct-1",
    });
  });

  it("subscribeFeed 透传订阅参数", async () => {
    (invoke as any).mockResolvedValue([{}, 1, ""]);
    await dataAgent.subscribeFeed("https://x.com/feed", "native", undefined, undefined, "acct-1");
    expect(invoke).toHaveBeenCalledWith("add_feed", {
      url: "https://x.com/feed",
      origin: "native",
      carrier: undefined,
      providerHint: undefined,
      accountUuid: "acct-1",
    });
  });

  it("deleteChannel 落到 delete_feed 并默认保留文章", async () => {
    (invoke as any).mockResolvedValue(1);
    await dataAgent.deleteChannel("u1");
    expect(invoke).toHaveBeenCalledWith("delete_feed", {
      uuid: "u1",
      deleteArticles: false,
    });
  });

  it("syncFeed 用 camelCase 传 feedType", async () => {
    (invoke as any).mockResolvedValue({});
    await dataAgent.syncFeed("folder", "u1");
    expect(invoke).toHaveBeenCalledWith("sync_feed", {
      feedType: "folder",
      uuid: "u1",
    });
  });

  it("markAllRead 映射为 snake_case 的 param 结构", async () => {
    (invoke as any).mockResolvedValue(3);
    await dataAgent.markAllRead({ uuid: "u1", isToday: true });
    expect(invoke).toHaveBeenCalledWith("mark_all_read", {
      param: { uuid: "u1", is_today: true, is_all: undefined },
    });
  });

  it("updateArticleReadStatus 透传已读状态", async () => {
    (invoke as any).mockResolvedValue(1);
    await dataAgent.updateArticleReadStatus("a1", 2);
    expect(invoke).toHaveBeenCalledWith("update_article_read_status", {
      uuid: "a1",
      readStatus: 2,
    });
  });

  it("updateUserConfig 用 userCfg 承载配置", async () => {
    (invoke as any).mockResolvedValue(1);
    const cfg = { theme: "dark" } as any;
    await dataAgent.updateUserConfig(cfg);
    expect(invoke).toHaveBeenCalledWith("update_user_config", { userCfg: cfg });
  });

  it("账户四命令透传", async () => {
    (invoke as any).mockResolvedValue([]);
    await dataAgent.listSourceAccounts();
    expect(invoke).toHaveBeenCalledWith("list_source_accounts");

    (invoke as any).mockClear().mockResolvedValue({});
    await dataAgent.saveSourceAccount("mail", "工作", "{}");
    expect(invoke).toHaveBeenCalledWith("save_source_account", {
      provider: "mail",
      label: "工作",
      settings: "{}",
    });

    (invoke as any).mockClear().mockResolvedValue(1);
    await dataAgent.deleteSourceAccount("acct-1");
    expect(invoke).toHaveBeenCalledWith("delete_source_account", { uuid: "acct-1" });

    (invoke as any).mockClear().mockResolvedValue("ok");
    await dataAgent.testSourceAccount("mail", "{}");
    expect(invoke).toHaveBeenCalledWith("test_source_account", {
      provider: "mail",
      settings: "{}",
    });
  });

  it("规则两命令透传", async () => {
    (invoke as any).mockResolvedValue([]);
    await dataAgent.listSiteRules();
    expect(invoke).toHaveBeenCalledWith("list_site_rules");

    (invoke as any).mockClear().mockResolvedValue("demo");
    await dataAgent.importSiteRule("[route]");
    expect(invoke).toHaveBeenCalledWith("import_site_rule", { content: "[route]" });
  });

  it("globalSearch 透传查询与条数", async () => {
    (invoke as any).mockResolvedValue([]);
    await dataAgent.globalSearch("rust", 6);
    expect(invoke).toHaveBeenCalledWith("global_search", { query: "rust", limit: 6 });
  });
});
