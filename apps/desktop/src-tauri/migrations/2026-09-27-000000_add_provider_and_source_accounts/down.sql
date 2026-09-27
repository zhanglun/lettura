DROP INDEX IF EXISTS idx_feeds_account_uuid;
DROP INDEX IF EXISTS idx_source_accounts_provider;
DROP TABLE IF EXISTS source_accounts;

ALTER TABLE feeds DROP COLUMN source_config;
ALTER TABLE feeds DROP COLUMN account_uuid;
ALTER TABLE feeds DROP COLUMN provider;
