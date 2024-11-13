-- Your SQL goes her
CREATE TABLE IF NOT EXISTS feeds (
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
  updated DATETIME, -- feed updated date
  logo TEXT NOT NULL DEFAULT "",
  create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- record insert date
  update_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP -- record update date
);

PRAGMA foreign_keys = 0;

CREATE TABLE sqlitestudio_temp_table AS SELECT *
                                          FROM feeds;

DROP TABLE feeds;

CREATE TABLE feeds (
    id             INTEGER  NOT NULL
                            PRIMARY KEY,
    uuid           TEXT     NOT NULL
                            UNIQUE,
    title          TEXT     NOT NULL,
    link           TEXT     NOT NULL,
    feed_url       TEXT     NOT NULL
                            UNIQUE,
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
                            DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO feeds (
                      id,
                      uuid,
                      title,
                      link,
                      feed_url,
                      description,
                      pub_date,
                      sync_interval,
                      last_sync_date,
                      sort,
                      create_date,
                      update_date,
                      feed_type,
                      updated,
                      logo
                  )
                  SELECT id,
                         uuid,
                         title,
                         link,
                         feed_url,
                         description,
                         pub_date,
                         sync_interval,
                         last_sync_date,
                         sort,
                         create_date,
                         update_date,
                         feed_type,
                         updated,
                         logo
                    FROM sqlitestudio_temp_table;

DROP TABLE sqlitestudio_temp_table;

PRAGMA foreign_keys = 1;
