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
    feed_url       TEXT     NOT NULL,
    feed_type      TEXT     NOT NULL
                            DEFAULT "",
    description    TEXT     NOT NULL,
    pub_date       DATETIME NOT NULL,
    updated        DATETIME NOT NULL
                            DEFAULT (CURRENT_TIMESTAMP),
    logo           TEXT     NOT NULL
                            DEFAULT "",
    health_status  INTEGER  NOT NULL
                            DEFAULT (0),
    failure_reason TEXT     DEFAULT ""
                            NOT NULL,
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
    UNIQUE (
        link,
        title
    )
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

PRAGMA foreign_keys = 0;

CREATE TABLE sqlitestudio_temp_table AS SELECT *
                                          FROM feed_metas;

DROP TABLE feed_metas;

CREATE TABLE feed_metas (
    id          INTEGER  PRIMARY KEY
                         NOT NULL,
    child_uuid  VARCHAR  NOT NULL,
    parent_uuid VARCHAR  NOT NULL,
    sort        INTEGER  NOT NULL
                         DEFAULT (0),
    create_date DATETIME NOT NULL
                         DEFAULT (CURRENT_TIMESTAMP),
    update_date DATETIME NOT NULL
                         DEFAULT (CURRENT_TIMESTAMP)
);

INSERT INTO feed_metas (
                           id,
                           child_uuid,
                           parent_uuid,
                           sort,
                           create_date,
                           update_date
                       )
                       SELECT id,
                              child_uuid,
                              parent_uuid,
                              sort,
                              create_date,
                              update_date
                         FROM sqlitestudio_temp_table;

DROP TABLE sqlitestudio_temp_table;

PRAGMA foreign_keys = 1;
