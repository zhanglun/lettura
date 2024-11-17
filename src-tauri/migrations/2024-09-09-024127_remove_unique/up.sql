-- 首先禁用外键约束
PRAGMA foreign_keys = OFF;

-- 创建临时表
CREATE TABLE feeds_new (
    id             INTEGER  NOT NULL
                           PRIMARY KEY,
    uuid           TEXT     NOT NULL
                           UNIQUE,
    title          TEXT     NOT NULL,
    link           TEXT     NOT NULL,
    feed_url       TEXT     NOT NULL,
    feed_type      TEXT     NOT NULL
                           DEFAULT "",
    description    TEXT     NOT NULL
                           DEFAULT "",
    pub_date       DATETIME NOT NULL,
    updated        DATETIME NOT NULL
                           DEFAULT (CURRENT_TIMESTAMP),
    logo           TEXT     NOT NULL
                           DEFAULT "",
    health_status  INTEGER  NOT NULL
                           DEFAULT (0),
    failure_reason TEXT     NOT NULL
                           DEFAULT "",
    sort           INTEGER  NOT NULL
                           DEFAULT 0,
    sync_interval  INTEGER  NOT NULL
                           DEFAULT 0,
    last_sync_date DATETIME NOT NULL
                           DEFAULT CURRENT_TIMESTAMP,
    create_date    DATETIME NOT NULL
                           DEFAULT CURRENT_TIMESTAMP,
    update_date    DATETIME NOT NULL
                           DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feed_url, title)
);

-- 复制数据到新表
INSERT INTO feeds_new
SELECT * FROM feeds;

-- 创建临时 articles 表
CREATE TABLE articles_new (
    id           INTEGER  NOT NULL
                         PRIMARY KEY,
    uuid         VARCHAR  NOT NULL
                         UNIQUE,
    title        VARCHAR  NOT NULL,
    link         VARCHAR  NOT NULL,
    feed_url     VARCHAR  NOT NULL,
    feed_uuid    VARCHAR  NOT NULL,
    description  VARCHAR  NOT NULL,
    author       VARCHAR  NOT NULL,
    pub_date     DATETIME NOT NULL,
    content      VARCHAR  NOT NULL,
    create_date  DATETIME NOT NULL
                         DEFAULT CURRENT_TIMESTAMP,
    update_date  DATETIME NOT NULL
                         DEFAULT CURRENT_TIMESTAMP,
    read_status  INTEGER  NOT NULL
                         DEFAULT 1,
    media_object TEXT,
    starred      INTEGER  NOT NULL
                         DEFAULT 0,
    UNIQUE (link, title),
    FOREIGN KEY (feed_uuid) REFERENCES feeds_new(uuid)
);

-- 复制 articles 数据
INSERT INTO articles_new
SELECT * FROM articles;

-- 删除旧表
DROP TABLE articles;
DROP TABLE feeds;

-- 重命名新表
ALTER TABLE feeds_new RENAME TO feeds;
ALTER TABLE articles_new RENAME TO articles;

-- 重新启用外键约束
PRAGMA foreign_keys = ON;
