-- Your SQL goes here
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER NOT NULL PRIMARY KEY,
  uuid VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  sort INTEGER NOT NUll,
  create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS folder_channel_relations (
  id INTEGER NOT NULL PRIMARY KEY,
  folder_uuid VARCHAR NOT NULL,
  channel_uuid VARCHAR NOT NUll,
  create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("folder_uuid", "channel_uuid")
);

CREATE INDEX idx_channel_uuid_and_read_status on articles(channel_uuid, read_status);
