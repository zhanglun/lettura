-- Your SQL goes here
DROP table channels;
DROP table articles;

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
  UNIQUE(uuid)
);
