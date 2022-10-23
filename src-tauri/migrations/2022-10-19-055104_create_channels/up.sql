-- Your SQL goes here
DROP TABLE IF EXISTS channels;

CREATE TABLE channels (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  feed_url VARCHAR NOT NULL,
  image VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  pub_date DATETIME NOT NULL,
  UNIQUE("link","title")
);

DROP TABLE IF EXISTS articles;

CREATE TABLE articles (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL UNIQUE,
  channel_uuid VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL UNIQUE,
  feed_url VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  content VARCHAR NOT NULL,
  pub_date DATETIME NOT NULL,
  read_status INTEGER NOT NULL DEFAULT 1,
  UNIQUE("link","title") -- 1: 未读 2: 已读
);
