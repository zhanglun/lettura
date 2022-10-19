-- Your SQL goes here
DROP TABLE IF EXISTS channels;

CREATE TABLE channels (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  feed_url VARCHAR NOT NULL,
  image VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  pub_date DATETIME NOT NULL,
  UNIQUE(uuid)
);

DROP TABLE IF EXISTS articles;

CREATE TABLE articles (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL,
  channel_uuid VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  feed_url VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  content VARCHAR NOT NULL,
  pub_date DATETIME NOT NULL,
  read_status INTEGER NOT NULL DEFAULT 1, -- 1: 未读 2: 已读
  UNIQUE(uuid)
);
