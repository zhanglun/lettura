-- 订阅源抓取器（fetcher）分发的落库前提：
--   feeds.provider   由哪个 fetcher 周期抓取（rss | mail | bilibili | site）——
--                    存量行都是经 RSS 进来的，回填 'rss' 语义正确；
--                    substack 的 origin=generator:newsletter 本就是原生 RSS，保持 rss。
--   feeds.account_uuid    关联 source_accounts（IMAP 账户、B站 cookie 等凭据）。
--   feeds.source_config   每源自由配置（JSON：发件人列表、UP 主 mid、规则参数等）。
ALTER TABLE feeds ADD COLUMN provider TEXT NOT NULL DEFAULT 'rss';
ALTER TABLE feeds ADD COLUMN account_uuid TEXT;
ALTER TABLE feeds ADD COLUMN source_config TEXT;

-- 账户表：凭据放 DB 而非 lettura.toml——update_user_config 会把整个配置
-- round-trip 给前端，密钥不宜走那条路。settings 为 JSON（IMAP host/port/授权码、SESSDATA）。
CREATE TABLE source_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    label TEXT NOT NULL,
    settings TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'ok',
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_source_accounts_provider ON source_accounts(provider);
CREATE INDEX idx_feeds_account_uuid ON feeds(account_uuid);
