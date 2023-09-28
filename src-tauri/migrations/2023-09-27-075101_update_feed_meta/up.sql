-- Your SQL goes here
PRAGMA foreign_keys = 0;

CREATE TABLE sqlitestudio_temp_table AS SELECT *
                                          FROM feed_metas;

DROP TABLE feed_metas;

CREATE TABLE feed_metas (
    id          INTEGER  PRIMARY KEY
                         NOT NULL,
    uuid        VARCHAR  NOT NULL,
    folder_uuid VARCHAR  NOT NULL,
    sort        INTEGER  NOT NULL
                         DEFAULT (0),
    create_date DATETIME NOT NULL
                         DEFAULT (CURRENT_TIMESTAMP),
    update_date DATETIME NOT NULL
                         DEFAULT (CURRENT_TIMESTAMP)
);

INSERT INTO feed_metas (
                           id,
                           uuid,
                           folder_uuid,
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
