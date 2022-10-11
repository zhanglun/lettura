-- Your SQL goes here
CREATE TABLE feeds (
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

CREATE TABLE articles (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  link VARCHAR NOT NULL,
  feed_url VARCHAR NOT NULL,
  image VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  content VARCHAR NOT NULL,
  pub_date DATETIME NOT NULL,
  UNIQUE(uuid)
);

CREATE TABLE feed_article_relation (
  id INTEGER NOT NULL PRIMARY KEY,
  feed_uuid VARCHAR NOT NULL,
  article_uuid VARCHAR NOT NULL
);
