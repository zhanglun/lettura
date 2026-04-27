# Lettura Starter Pack 详细实现规格

> 定义 8 个 Starter Pack 的完整源列表，每个 Pack 包含 15-18 个已验证的 RSS 源。

---

## 数据格式

Starter Pack 以 JSON 文件分发，存储在 `apps/desktop/src-tauri/src/sources/packs/` 目录。

```json
{
  "id": "ai",
  "name": "AI & Machine Learning",
  "description": "AI research, breakthroughs, and industry trends",
  "icon": "brain",
  "language": "en",
  "tags": ["artificial-intelligence", "llm", "tools"],
  "sources": [
    {
      "feed_url": "https://openai.com/news/rss.xml",
      "title": "OpenAI Blog",
      "site_url": "https://openai.com",
      "language": "en"
    }
  ]
}
```

> **`icon` 字段**：使用 lucide-react 图标名（如 `"brain"`, `"code-2"`, `"rocket"` 等），前端通过 `<DynamicIcon name={pack.icon} />` 渲染。8 个 Pack 对应图标：AI=`brain`, Developer=`code-2`, Startup=`rocket`, Product=`package`, Design=`palette`, Science=`flask-conical`, Business=`briefcase`, Tech News=`newspaper`。
>
> **`language` / `tags`**：在 JSON 顶层静态定义，`source_count` 由 Rust 端从 `sources.len()` 动态计算，不在 JSON 中存储。

---

## Pack 1: AI & Machine Learning (18 sources)

**已验证原生 RSS (10)**

| Site | Feed URL | Language |
|------|----------|----------|
| OpenAI Blog | `https://openai.com/news/rss.xml` | en |
| DeepMind Blog | `https://deepmind.google/blog/rss.xml` | en |
| Hugging Face Blog | `https://huggingface.co/blog/feed.xml` | en |
| MIT Technology Review | `https://www.technologyreview.com/feed/` | en |
| O'Reilly Radar (AI & ML) | `https://www.oreilly.com/radar/topics/ai-ml/feed/` | en |
| NVIDIA Blog | `https://blogs.nvidia.com/feed/` | en |
| Machine Learning Mastery | `https://machinelearningmastery.com/feed/` | en |
| Towards Data Science | `https://towardsdatascience.com/feed` | en |
| AI News | `https://artificialintelligence-news.com/feed` | en |
| Google Research Blog | `https://blog.google/innovation-and-ai/technology/ai/rss/` | en |

**RSSHub 替代 (5)**

| Site | Feed URL | Language | 说明 |
|------|----------|----------|------|
| Anthropic News | `https://rsshub.app/anthropic/news` | en | 无原生 RSS |
| Microsoft Research Blog | `https://www.microsoft.com/en-us/research/feed/` | en | 需确认可用性 |
| Stability AI Blog | `https://rsshub.app/stabilityai/blog` | en | 无原生 RSS |
| The Batch (DeepLearning.AI) | `https://rsshub.app/deeplearningai/the-batch` | en | 仅邮件订阅 |
| Meta AI Blog | `https://rsshub.app/metaai/blog` | en | 无原生 RSS |

---

## Pack 2: Developer (16 sources)

**已验证原生 RSS (10)**

| Site | Feed URL | Language |
|------|----------|----------|
| Hacker News | `https://news.ycombinator.com/rss` | en |
| GitHub Blog | `https://github.blog/feed/` | en |
| Stack Overflow Blog | `https://stackoverflow.blog/feed/` | en |
| Smashing Magazine | `https://www.smashingmagazine.com/feed/` | en |
| Dev.to | `https://dev.to/feed` | en |
| Martin Fowler | `https://martinfowler.com/feed.atom` | en |
| Joel on Software | `https://www.joelonsoftware.com/feed/` | en |
| Airbnb Engineering | `https://medium.com/feed/airbnb-engineering` | en |
| CSS-Tricks | `https://css-tricks.com/feed/` | en |
| The Pragmatic Engineer | `https://newsletter.pragmaticengineer.com/feed` | en |

**补充源 (6)**

| Site | Feed URL | Language | 说明 |
|------|----------|----------|------|
| Uber Engineering | `https://www.uber.com/blog/feed/` | en | 已验证 |
| Cloudflare Changelog | `https://developers.cloudflare.com/changelog/rss.xml` | en | 替代 blog feed |
| ThoughtWorks Insights | `https://www.thoughtworks.com/rss/insights.rss` | en | 替代 Tech Radar |
| Vercel Blog | `https://vercel.com/atom` | en | Atom 格式 |
| Stripe Blog | `https://stripe.com/blog/feed.rss` | en | 已验证 |
| Paul Graham Essays | `https://rsshub.app/lesswrong/shortform?user=PaulGraham` | en | RSSHub 替代 |

---

## Pack 3: Startup & Indie Hacker (15 sources)

**已验证原生 RSS (10)**

| Site | Feed URL | Language |
|------|----------|----------|
| The Verge | `https://www.theverge.com/rss/index.xml` | en |
| TechCrunch (Startups) | `https://techcrunch.com/category/startups/feed/` | en |
| Stratechery | `https://stratechery.com/feed/` | en |
| Daring Fireball | `https://daringfireball.net/feeds/main` | en |
| SaaStr | `https://www.saastr.com/feed/` | en |
| Stripe Blog | `https://stripe.com/blog/feed.rss` | en |
| Vercel Blog | `https://vercel.com/atom` | en |
| Y Combinator Blog | `https://blog.ycombinator.com/feed/` | en |
| First Round Review | `https://review.firstround.com/rss` | en |
| Product Hunt Blog | `https://www.producthunt.com/feed` | en |

**补充源 (5)**

| Site | Feed URL | Language | 说明 |
|------|----------|----------|------|
| Indie Hackers | `https://feed.indiehackers.world/posts.rss` | en | 第三方 feed |
| a16z Blog | `https://a16z.com/feed/` | en | 需验证 |
| Platformer | `https://platformer.news/feed` | en | 需验证 |
| The Information | `https://rsshub.app/theinformation` | en | RSSHub |
| Signal v. Noise Archive | `https://m.signalvnoise.com/feed/` | en | 已停更，存档 |

---

## Pack 4: Product (14 sources)

> 以下源列表基于技术架构文档设计，尚未逐个验证。

| Site | Feed URL | Language | 备注 |
|------|----------|----------|------|
| Product Hunt | `https://www.producthunt.com/feed` | en | 与 Pack 3 重复，共享 |
| Mind the Product | `https://www.mindtheproduct.com/feed/` | en | 产品管理社区 |
| Harvard Business Review (Tech) | `https://hbr.org/topic/subject/technology/feed` | en | 需验证 |
| UX Collective | `https://medium.com/feed/ux-collective` | en | Medium publication |
| Intercom Blog | `https://www.intercom.com/blog/feed/` | en | 需验证 |
| Reforge Blog | `https://www.reforge.com/blog/rss.xml` | en | 需验证 |
| Lenny's Newsletter | `https://lennys.substack.com/feed` | en | Substack |
| Product Coalition | `https://medium.com/feed/product-coalition` | en | Medium |
| The Product Manager | `https://theproductmanager.com/feed/` | en | 需验证 |
| SVPG | `https://svpg.com/feed/` | en | Marty Cagan |
| Ken Norton Blog | `https://kennorton.com/atom.xml` | en | 需验证 |
| Amplitude Blog | `https://amplitude.com/blog/feed` | en | 需验证 |
| Mixpanel Blog | `https://mixpanel.com/blog/feed/` | en | 需验证 |
| Notion Blog | `https://www.notion.so/blog/rss.xml` | en | 需验证 |

---

## Pack 5: Design (13 sources)

> 以下源列表基于技术架构文档设计，尚未逐个验证。

| Site | Feed URL | Language | 备注 |
|------|----------|----------|------|
| Dribbble Blog | `https://dribbble.com/stories.rss` | en | 需验证 |
| Smashing Magazine | `https://www.smashingmagazine.com/feed/` | en | 与 Pack 2 共享 |
| UX Collective | `https://medium.com/feed/ux-collective` | en | 与 Pack 4 共享 |
| A List Apart | `https://alistapart.com/main/feed/` | en | 需验证 |
| Design Systems | `https://designsystems.com/feed/` | en | 需验证 |
| InVision Blog | `https://www.invisionapp.com/inside-design/feed/` | en | 需验证 |
| Google Design | `https://design.google/feed/` | en | 需验证 |
| Airbnb Design | `https://airbnb.design/feed/` | en | 需验证 |
| Figma Blog | `https://www.figma.com/blog/feed/` | en | 需验证 |
| Sidebar | `https://sidebar.io/feed/` | en | 五个设计链接/天 |
| Creative Review | `https://www.creativereview.co.uk/feed/` | en | 需验证 |
| Design Milk | `https://design-milk.com/feed/` | en | 需验证 |
| Fast Company Design | `https://www.fastcompany.com/section/design/feed/` | en | 需验证 |

---

## Pack 6: Science (12 sources)

> 以下源列表基于技术架构文档设计，尚未逐个验证。

| Site | Feed URL | Language | 备注 |
|------|----------|----------|------|
| Nature News | `https://www.nature.com/nature.rss` | en | 需验证 |
| Science Magazine | `https://www.science.org/rss/express_recent.xml` | en | 需验证 |
| Ars Technica Science | `https://feeds.arstechnica.com/arstechnica/science` | en | 需验证 |
| New Scientist | `https://www.newscientist.com/feed/home/` | en | 需验证 |
| Scientific American | `https://www.scientificamerican.com/feed/` | en | 需验证 |
| Quanta Magazine | `https://api.quantamagazine.org/feed/` | en | 需验证 |
| Wired Science | `https://www.wired.com/feed/category/science/latest/rss` | en | 需验证 |
| The Conversation Science | `https://theconversation.com/us/technology/articles.atom` | en | 需验证 |
| EurekAlert | `https://www.eurekalert.org/rss/breakthroughs.xml` | en | 需验证 |
| Phys.org | `https://phys.org/rss-feed/` | en | 需验证 |
| NASA News | `https://www.nasa.gov/rss/dyn/breaking_news.rss` | en | 需验证 |
| Space.com | `https://www.space.com/feeds/all` | en | 需验证 |

---

## Pack 7: Business (14 sources)

> 以下源列表基于技术架构文档设计，尚未逐个验证。

| Site | Feed URL | Language | 备注 |
|------|----------|----------|------|
| Bloomberg Technology | `https://www.bloomberg.com/feeds/sitemap_news.xml` | en | 需验证 |
| The Economist | `https://www.economist.com/rss` | en | 需验证 |
| Financial Times | `https://www.ft.com/rss/home` | en | 需验证 |
| HBR | `https://hbr.org/feed` | en | 需验证 |
| WSJ Tech | `https://feeds.content.dowjones.io/public/rss/mw_topstories` | en | 需验证 |
| CNBC Tech | `https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147` | en | 需验证 |
| The Verge | `https://www.theverge.com/rss/index.xml` | en | 与 Pack 3 共享 |
| Stratechery | `https://stratechery.com/feed/` | en | 与 Pack 3 共享 |
| Daring Fireball | `https://daringfireball.net/feeds/main` | en | 与 Pack 3 共享 |
| Fast Company | `https://www.fastcompany.com/rss` | en | 需验证 |
| Inc.com | `https://www.inc.com/rss.xml` | en | 需验证 |
| Forbes Tech | `https://www.forbes.com/innovation/feed/` | en | 需验证 |
| Wired Business | `https://www.wired.com/feed/category/business/latest/rss` | en | 需验证 |
| Business Insider Tech | `https://www.businessinsider.com/rss` | en | 需验证 |

---

## Pack 8: Tech News (16 sources)

> 以下源列表基于技术架构文档设计，尚未逐个验证。

| Site | Feed URL | Language | 备注 |
|------|----------|----------|------|
| TechCrunch | `https://techcrunch.com/feed/` | en | 需验证 |
| The Verge | `https://www.theverge.com/rss/index.xml` | en | 已验证 |
| Ars Technica | `https://feeds.arstechnica.com/arstechnica/index` | en | 需验证 |
| Wired | `https://www.wired.com/feed/rss` | en | 需验证 |
| Engadget | `https://www.engadget.com/rss.xml` | en | 需验证 |
| Gizmodo | `https://gizmodo.com/rss` | en | 需验证 |
| ZDNet | `https://www.zdnet.com/news/rss.xml` | en | 需验证 |
| The Information | `https://rsshub.app/theinformation` | en | RSSHub |
| 9to5Mac | `https://9to5mac.com/feed/` | en | 需验证 |
| Android Police | `https://www.androidpolice.com/feed/` | en | 需验证 |
| The Next Web | `https://thenextweb.com/feed/` | en | 需验证 |
| BleepingComputer | `https://www.bleepingcomputer.com/feed/` | en | 安全 |
| Krebs on Security | `https://krebsonsecurity.com/feed/` | en | 安全 |
| Hacker News | `https://news.ycombinator.com/rss` | en | 已验证 |
| Hacker News (enhanced) | `https://hnrss.org/frontpage` | en | 增强版 |
| lobste.rs | `https://lobste.rs/rss` | en | 技术社区 |

---

## 实现要求

### 1. Pack 加载

```rust
// apps/desktop/src-tauri/src/sources/starter_pack.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct StarterPack {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub sources: Vec<PackSource>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PackSource {
    pub feed_url: String,
    pub title: String,
    pub site_url: String,
    pub language: String,
    #[serde(default)]
    pub is_rsshub: bool,
}

pub fn load_pack(pack_id: &str) -> Result<StarterPack> {
    let json = include_str!(concat!("packs/", pack_id, ".json"));
    serde_json::from_str(json).map_err(|e| anyhow!("Failed to parse pack {}: {}", pack_id, e))
}

pub fn list_packs() -> Vec<StarterPack> {
    ["ai", "developer", "startup", "product", "design", "science", "business", "tech-news"]
        .iter()
        .filter_map(|id| load_pack(id).ok())
        .collect()
}
```

### 2. Pack 安装

```rust
pub async fn install_pack(conn: &SqliteConnection, pack_id: &str) -> Result<Vec<String>> {
    let pack = load_pack(pack_id)?;
    let mut installed = Vec::new();

    for source in &pack.sources {
        // 创建 source 记录
        diesel::insert_into(sources::table)
            .values(NewSource {
                feed_url: &source.feed_url,
                title: &source.title,
                site_url: &source.site_url,
                source_type: "starter_pack",
                pack_id: Some(pack_id),
                language: &source.language,
                ..Default::default()
            })
            .execute(conn)?;

        // 创建 feed 并触发首次抓取
        // (复用现有 feed 创建逻辑)
        installed.push(source.feed_url.clone());
    }

    Ok(installed)
}
```

### 3. 共享源处理

部分源出现在多个 Pack 中（如 Hacker News、The Verge、Smashing Magazine）。安装时：
- 检查 `feeds.feed_url` 是否已存在
- 如果已存在，只新增 `sources` 记录（关联到新 pack_id），不重复创建 feed
- 如果不存在，同时创建 `feeds` 和 `sources` 记录

### 4. 待验证标记

Pack 4-8 中的源标注了"需验证"。开发 Phase 2.1 时应：
1. 逐个 HTTP fetch 验证 feed URL
2. 替换 404 的 URL
3. 对无 RSS 的站点使用 RSSHub 替代或换源
4. 确认后移除"需验证"标记
