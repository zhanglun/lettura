-- Your SQL goes here
CREATE TABLE IF NOT EXISTS feeds (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  feed_url VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  pub_date DATETIME NOT NULL,
  sync_interval INTEGER NOT NULL DEFAULT 0,
  last_sync_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sort INTEGER NOT NULL DEFAULT 0,
  feed_type VARCHAR NOT NULL DEFAULT "",
  updated DATETIME, -- feed updated date
  logo TEXT NOT NULL DEFAULT "",
  create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- record insert date
  update_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- record update date
  UNIQUE("link", "title")
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL UNIQUE,
  channel_uuid VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  feed_url VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  content VARCHAR NOT NULL,
  pub_date DATETIME NOT NULL,
  author VARCHAR NOT NULL,
  create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_status INTEGER NOT NULL DEFAULT 1,  -- 1: 未读 2: 已读
  UNIQUE("link", "title")
);
CREATE INDEX IF NOT EXISTS idx_channel_uuid_and_read_status ON "articles" ("channel_uuid", "read_status");
CREATE INDEX IF NOT EXISTS idx_channel_uuid_and_read_status_and_pub_date ON "articles" ("channel_uuid", "read_status", "pub_date");

CREATE TABLE IF NOT EXISTS  folders (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feed_metas (
  id INTEGER NOT NULL PRIMARY KEY,
  child_uuid VARCHAR NOT NULL,
  parent_uuid VARCHAR NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
