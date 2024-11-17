-- This file should undo anything in `up.sql`

-- 禁用外键约束
PRAGMA foreign_keys = OFF;

-- 创建原始表结构
CREATE TABLE feeds (
    id INTEGER NOT NULL PRIMARY KEY,
    uuid VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    link VARCHAR NOT NULL,
    feed_url VARCHAR NOT NULL UNIQUE,
    description VARCHAR NOT NULL,
    pub_date DATETIME NOT NULL,
    sync_interval INTEGER NOT NULL DEFAULT 0,
    last_sync_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sort INTEGER NOT NULL DEFAULT 0,
    feed_type VARCHAR NOT NULL DEFAULT "",
    updated DATETIME,
    logo TEXT NOT NULL DEFAULT "",
    create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 复制数据回原始表结构
INSERT INTO feeds
SELECT * FROM feeds;

-- 重新启用外键约束
PRAGMA foreign_keys = ON;
