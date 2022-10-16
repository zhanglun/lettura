-- Your SQL goes here

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

DROP table feeds;
DROP table feed_article_relation;

CREATE TABLE articles (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL,
  channel_uuid VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  feed_url VARCHAR NOT NULL,
  image VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  content VARCHAR NOT NULL,
  pub_date DATETIME NOT NULL,
  UNIQUE(uuid)
);
