//! 来源账户：IMAP 邮箱、B站 cookie 等凭据的宿主。
//!
//! 凭据放 DB 而非 lettura.toml——`update_user_config` 会把整个配置
//! round-trip 给前端，密钥不宜走那条路。settings 为 provider 特定的 JSON：
//!   - mail:     {host, port, user, password, folder?, tls?}
//!   - bilibili: {sessdata}
//!
//! 本模块只做存取；真正用凭据的是各 fetcher（app 解析好经 AccountMaterial 递入，
//! 密钥面收敛在主 crate 一处）。

use diesel::prelude::*;
use uuid::Uuid;

use crate::db;
use crate::models::SourceAccount;
use crate::schema;

pub fn list_accounts() -> Vec<SourceAccount> {
  let mut connection = db::establish_connection();
  schema::source_accounts::dsl::source_accounts
    .order(schema::source_accounts::id.desc())
    .load::<SourceAccount>(&mut connection)
    .unwrap_or_default()
}

pub fn get_account(uuid: &str) -> Option<SourceAccount> {
  let mut connection = db::establish_connection();
  schema::source_accounts::dsl::source_accounts
    .filter(schema::source_accounts::uuid.eq(uuid))
    .first::<SourceAccount>(&mut connection)
    .ok()
}

/// 新建账户；settings 必须是合法 JSON（内容校验交给 test_source_account）
pub fn save_account(provider: &str, label: &str, settings: &str) -> Result<SourceAccount, String> {
  if provider.is_empty() {
    return Err("provider 不能为空".to_string());
  }
  if label.trim().is_empty() {
    return Err("账户名称不能为空".to_string());
  }
  let parsed: serde_json::Value =
    serde_json::from_str(settings).map_err(|e| format!("settings 不是合法 JSON: {e}"))?;

  let mut connection = db::establish_connection();
  let account = (
    schema::source_accounts::uuid.eq(Uuid::new_v4().hyphenated().to_string()),
    schema::source_accounts::provider.eq(provider),
    schema::source_accounts::label.eq(label.trim()),
    schema::source_accounts::settings.eq(parsed.to_string()),
  );

  diesel::insert_into(schema::source_accounts::dsl::source_accounts)
    .values(account)
    .get_result::<SourceAccount>(&mut connection)
    .map_err(|e| format!("保存账户失败: {e}"))
}

/// 删除账户；引用它的订阅置回无账户（不删订阅——mail 源还可以重新绑定账户）
pub fn delete_account(uuid: &str) -> usize {
  let mut connection = db::establish_connection();

  diesel::update(schema::feeds::dsl::feeds.filter(schema::feeds::account_uuid.eq(uuid)))
    .set(schema::feeds::account_uuid.eq::<Option<String>>(None))
    .execute(&mut connection)
    .ok();

  diesel::delete(
    schema::source_accounts::dsl::source_accounts.filter(schema::source_accounts::uuid.eq(uuid)),
  )
  .execute(&mut connection)
  .unwrap_or(0)
}

/// 连接测试：分发到对应 fetcher 的探测实现
pub async fn test_account(provider: &str, settings: &str) -> Result<String, String> {
  let parsed: serde_json::Value =
    serde_json::from_str(settings).map_err(|e| format!("settings 不是合法 JSON: {e}"))?;

  match provider {
    "mail" => fetcher_mail::probe_account(&parsed).await,
    other => Err(format!("暂不支持测试 {other} 类型的账户")),
  }
}

/// 主 crate 内部：feed 行的 account_uuid → AccountMaterial（fetcher 的凭据材料）
pub fn account_material(uuid: &str) -> Option<fetcher_core::AccountMaterial> {
  get_account(uuid).map(|account| fetcher_core::AccountMaterial {
    uuid: account.uuid,
    provider: account.provider,
    settings: serde_json::from_str(&account.settings).unwrap_or(serde_json::Value::Null),
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_save_rejects_bad_input() {
    assert!(save_account("", "l", "{}").is_err());
    assert!(save_account("mail", "  ", "{}").is_err());
    assert!(save_account("mail", "l", "not-json").is_err());
  }
}
