-- Your SQL goes here
PRAGMA foreign_keys = 0;

CREATE TABLE sqlitestudio_temp_table AS SELECT *
                                          FROM articles;

DROP TABLE articles;

CREATE TABLE articles (
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
    UNIQUE (
        link,
        title
    ),
    FOREIGN KEY (
        feed_uuid
    )
    REFERENCES feeds (uuid) MATCH [FULL]
);

INSERT INTO articles (
                         id,
                         uuid,
                         title,
                         link,
                         feed_url,
                         feed_uuid,
                         description,
                         author,
                         pub_date,
                         content,
                         create_date,
                         update_date,
                         read_status,
                         media_object
                     )
                     SELECT id,
                            uuid,
                            title,
                            link,
                            feed_url,
                            feed_uuid,
                            description,
                            author,
                            pub_date,
                            content,
                            create_date,
                            update_date,
                            read_status,
                            media_object
                       FROM sqlitestudio_temp_table;

DROP TABLE sqlitestudio_temp_table;

CREATE INDEX idx_feed_uuid_and_read_status ON articles (
    feed_uuid,
    "read_status"
);

CREATE INDEX idx_feed_uuid_and_read_status_and_pub_date ON articles (
    feed_uuid,
    "read_status",
    "pub_date"
);

PRAGMA foreign_keys = 1;
