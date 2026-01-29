use crate::db;
use crate::feed;
use crate::models;
use crate::schema;
use diesel::prelude::*;
use regex::Regex;
use std::collections::HashMap;
use uuid::Uuid;

/// 导出订阅为 OPML 格式
///
/// 从数据库中获取所有订阅（包括文件夹和源），并生成 OPML XML 字符串
///
/// # Returns
/// `Result<String, String>` - 成功返回 OPML XML 字符串，失败返回错误信息
///
/// # Examples
/// ```
/// let opml_content = export_opml().expect("导出失败");
/// println!("{}", opml_content);
/// ```
pub fn export_opml() -> Result<String, String> {
  let feeds = feed::channel::get_feeds();

  let mut xml = String::new();
  xml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
  xml.push_str("<opml version=\"2.0\">\n");
  xml.push_str("  <head>\n");
  xml.push_str("    <title>Subscriptions in Lettura</title>\n");
  xml.push_str("  </head>\n");
  xml.push_str("  <body>\n");

  for item in feeds {
    if item.item_type == "folder" {
      xml.push_str(&format!(
        "    <outline text=\"{}\" title=\"{}\">\n",
        escape_xml(&item.title),
        escape_xml(&item.title)
      ));

      if let Some(children) = item.children {
        for child in children {
          if child.item_type == "channel" {
            xml.push_str(&format!(
              "      <outline text=\"{}\" title=\"{}\" xmlUrl=\"{}\" htmlUrl=\"{}\" type=\"rss\"/>\n",
              escape_xml(&child.title),
              escape_xml(&child.title),
              escape_xml(&child.feed_url),
              escape_xml(&child.link.as_deref().unwrap_or(""))
            ));
          }
        }
      }

      xml.push_str("    </outline>\n");
    } else if item.item_type == "channel" {
      xml.push_str(&format!(
        "    <outline text=\"{}\" title=\"{}\" xmlUrl=\"{}\" htmlUrl=\"{}\" type=\"rss\"/>\n",
        escape_xml(&item.title),
        escape_xml(&item.title),
        escape_xml(&item.feed_url),
        escape_xml(&item.link.as_deref().unwrap_or(""))
      ));
    }
  }

  xml.push_str("  </body>\n");
  xml.push_str("</opml>");

  Ok(xml)
}

fn escape_xml(s: &str) -> String {
  s.replace('&', "&amp;")
    .replace('<', "&lt;")
    .replace('>', "&gt;")
    .replace('"', "&quot;")
    .replace('\'', "&apos;")
}

/// 从 OPML 导入订阅
///
/// 解析 OPML XML 字符串，提取源和文件夹，并在数据库中创建它们
///
/// # Arguments
/// * `opml_content` - OPML XML 字符串
///
/// # Returns
/// `Result<OpmlImportResult, String>` - 成功返回导入结果统计，失败返回错误信息
///
/// # Examples
/// ```
/// let result = import_opml(opml_content).expect("导入失败");
/// println!("导入 {} 个源", result.feed_count);
/// ```
pub fn import_opml(opml_content: &str) -> Result<OpmlImportResult, String> {
  let mut folder_map: HashMap<String, String> = HashMap::new();
  let mut result = OpmlImportResult::default();

  let mut current_folder: Option<String> = None;

  for line in opml_content.lines() {
    let line = line.trim();

    if line.contains("<outline") && !line.contains("xmlUrl") {
      if let Some(folder_name) = extract_attribute(line, "text") {
        current_folder = Some(folder_name.clone());

        if !folder_name.is_empty() {
          let folder_uuid = create_folder_if_not_exists(&folder_name);
          if folder_uuid.is_ok() {
            folder_map.insert(folder_name, folder_uuid.unwrap());
            result.folder_count += 1;
          }
        }
      }
    }

    if let Some(feed_url) = extract_attribute(line, "xmlUrl") {
      let title = extract_attribute(line, "text")
        .or_else(|| extract_attribute(line, "title"))
        .unwrap_or_else(|| {
          feed_url
            .split('/')
            .last()
            .unwrap_or("Unknown Feed")
            .to_string()
        });

      let folder_uuid = current_folder
        .as_ref()
        .and_then(|name| folder_map.get(name).cloned());

      match import_feed(&title, &feed_url, folder_uuid) {
        Ok(_) => result.feed_count += 1,
        Err(e) => {
          result.failed_count += 1;
          result.errors.push(format!("{}: {}", title, e));
        }
      }
    }

    if line.contains("</outline>") {
      current_folder = None;
    }
  }

  Ok(result)
}

fn extract_attribute(line: &str, attr: &str) -> Option<String> {
  let pattern = format!(r#"{}="([^"]*)""#, attr);
  let re = Regex::new(&pattern).ok()?;
  let caps = re.captures(line)?;
  let value = caps.get(1)?.as_str().trim();
  Some(value.to_string())
}

/// 创建文件夹（如果不存在）
fn create_folder_if_not_exists(folder_name: &str) -> Result<String, String> {
  let mut connection = db::establish_connection();

  let existing_folder = schema::folders::dsl::folders
    .filter(schema::folders::name.eq(folder_name))
    .load::<models::Folder>(&mut connection)
    .map_err(|e| format!("Database error: {}", e))?;

  if !existing_folder.is_empty() {
    return Ok(existing_folder[0].uuid.clone());
  }

  let uuid = Uuid::new_v4().hyphenated().to_string();
  let folder = models::NewFolder {
    uuid: uuid.clone(),
    name: folder_name.to_string(),
    sort: 0,
  };

  diesel::insert_into(schema::folders::dsl::folders)
    .values(&folder)
    .execute(&mut connection)
    .map_err(|e| format!("Failed to create folder: {}", e))?;

  Ok(uuid)
}

/// 导入单个源
fn import_feed(title: &str, feed_url: &str, folder_uuid: Option<String>) -> Result<(), String> {
  let mut connection = db::establish_connection();

  let existing_feed = schema::feeds::dsl::feeds
    .filter(schema::feeds::feed_url.eq(feed_url))
    .load::<models::Feed>(&mut connection)
    .map_err(|e| format!("Database error: {}", e))?;

  if !existing_feed.is_empty() {
    if let Some(folder_uuid) = folder_uuid {
      let feed_uuid = &existing_feed[0].uuid;

      let feed_meta_count: i64 = diesel::select(diesel::dsl::count(schema::feed_metas::dsl::uuid))
        .filter(schema::feed_metas::dsl::uuid.eq(feed_uuid))
        .get_result::<i64>(&mut connection)
        .map_err(|e| format!("Database error: {}", e))?;

      if feed_meta_count == 0 {
        let feed_meta = models::NewFeedMeta {
          uuid: feed_uuid.clone(),
          folder_uuid,
          sort: 0,
        };

        diesel::insert_into(schema::feed_metas::dsl::feed_metas)
          .values(&feed_meta)
          .execute(&mut connection)
          .map_err(|e| format!("Failed to associate feed with folder: {}", e))?;
      }
    }

    return Ok(());
  }

  let uuid = Uuid::new_v4().hyphenated().to_string();
  let feed = models::NewFeed {
    uuid: uuid.clone(),
    feed_type: "rss".to_string(),
    title: title.to_string(),
    link: feed_url.to_string(),
    logo: String::new(),
    feed_url: feed_url.to_string(),
    description: String::new(),
    pub_date: String::new(),
    updated: String::new(),
    sort: 0,
  };

  diesel::insert_into(schema::feeds::dsl::feeds)
    .values(&feed)
    .execute(&mut connection)
    .map_err(|e| format!("Failed to create feed: {}", e))?;

  if let Some(folder_uuid) = folder_uuid {
    let feed_meta = models::NewFeedMeta {
      uuid: uuid.clone(),
      folder_uuid,
      sort: 0,
    };

    diesel::insert_into(schema::feed_metas::dsl::feed_metas)
      .values(&feed_meta)
      .execute(&mut connection)
      .map_err(|e| format!("Failed to associate feed with folder: {}", e))?;
  }

  Ok(())
}

/// OPML 导入结果
#[derive(Debug, Default, Clone, serde::Serialize)]
pub struct OpmlImportResult {
  pub folder_count: usize,
  pub feed_count: usize,
  pub failed_count: usize,
  pub errors: Vec<String>,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_export_opml() {
    let result = export_opml();
    assert!(result.is_ok());
    let opml_content = result.unwrap();
    assert!(opml_content.contains("<?xml"));
    assert!(opml_content.contains("<opml"));
  }

  #[test]
  fn test_import_opml() {
    let opml_content = r#"<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Subscriptions in Lettura</title>
  </head>
  <body>
    <outline text="Test Folder" title="Test Folder">
      <outline text="Test Feed" title="Test Feed" xmlUrl="https://example.com/feed.xml" htmlUrl="https://example.com/"/>
    </outline>
    <outline text="Independent Feed" title="Independent Feed" xmlUrl="https://example.org/feed.xml" htmlUrl="https://example.org/"/>
  </body>
</opml>"#;

    let result = import_opml(opml_content);
    assert!(result.is_ok());
    let import_result = result.unwrap();
    assert_eq!(import_result.folder_count, 1);
    assert_eq!(import_result.feed_count, 2);
  }
}
