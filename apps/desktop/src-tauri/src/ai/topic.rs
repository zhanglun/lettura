use crate::ai::llm::LLMProvider;
use crate::models::{NewTopic, NewTopicArticle, NewTopicFollow, Topic};
use crate::schema::{article_ai_analysis, articles, feeds, topic_articles, topic_follows, topics};
use diesel::prelude::*;
use serde::Serialize;
use std::collections::HashMap;
use std::collections::HashSet;
use uuid::Uuid;

/// Response type for get_topics IPC
#[derive(Debug, Serialize)]
pub struct TopicItem {
  pub id: i32,
  pub uuid: String,
  pub title: String,
  pub description: String,
  pub status: String,
  pub article_count: i32,
  pub source_count: i32,
  pub first_seen_at: String,
  pub last_updated_at: String,
  pub is_following: bool,
}

/// Response type for get_topic_detail IPC (flat structure to match frontend)
#[derive(Debug, Serialize)]
pub struct TopicDetail {
  pub id: i32,
  pub uuid: String,
  pub title: String,
  pub description: String,
  pub status: String,
  pub article_count: i32,
  pub source_count: i32,
  pub first_seen_at: String,
  pub last_updated_at: String,
  pub is_following: bool,
  pub recent_changes: Option<String>,
  pub articles: Vec<TopicArticleItem>,
  pub topic_summary: Option<String>,
  pub source_groups: Vec<SourceGroup>,
}

/// Article within a topic detail
#[derive(Debug, Serialize, Clone)]
pub struct TopicArticleItem {
  pub article_id: i32,
  pub title: String,
  pub link: String,
  pub feed_title: String,
  pub feed_uuid: String,
  pub pub_date: String,
  pub relevance_score: f64,
  pub excerpt: Option<String>,
}

/// Articles grouped by source feed
#[derive(Debug, Serialize)]
pub struct SourceGroup {
  pub feed_title: String,
  pub feed_uuid: String,
  pub article_count: i32,
  pub articles: Vec<TopicArticleItem>,
}

/// Create or update a topic from a cluster of articles.
/// Called during pipeline after clustering.
pub fn assign_or_create_topic(
  conn: &mut SqliteConnection,
  article_ids: &[i32],
  cluster_title: &str,
) -> Result<Option<i32>, String> {
  if article_ids.len() < 2 {
    return Ok(None);
  }

  let existing_topic_id: Option<i32> = article_ai_analysis::table
    .filter(article_ai_analysis::article_id.eq_any(article_ids))
    .filter(article_ai_analysis::topic_id.is_not_null())
    .select(article_ai_analysis::topic_id)
    .first::<Option<i32>>(conn)
    .ok()
    .flatten();

  let source_count = compute_source_count(conn, article_ids)?;

  let topic_id = if let Some(tid) = existing_topic_id {
    diesel::update(topics::table.find(tid))
      .set((
        topics::article_count.eq(article_ids.len() as i32),
        topics::source_count.eq(source_count),
        topics::last_updated_at.eq(chrono::Utc::now().naive_utc()),
      ))
      .execute(conn)
      .map_err(|e| e.to_string())?;
    tid
  } else {
    let new_uuid = Uuid::new_v4().hyphenated().to_string();
    diesel::insert_into(topics::table)
      .values(NewTopic {
        uuid: new_uuid.clone(),
        title: cluster_title.to_string(),
        description: String::new(),
        status: "active".to_string(),
        article_count: article_ids.len() as i32,
        source_count,
      })
      .execute(conn)
      .map_err(|e| e.to_string())?;

    topics::table
      .filter(topics::uuid.eq(&new_uuid))
      .select(topics::id)
      .first(conn)
      .map_err(|e| e.to_string())?
  };

  link_articles_to_topic(conn, topic_id, article_ids);
  set_topic_id_on_analysis(conn, topic_id, article_ids);

  Ok(Some(topic_id))
}

fn compute_source_count(conn: &mut SqliteConnection, article_ids: &[i32]) -> Result<i32, String> {
  let feed_uuids: Vec<String> = articles::table
    .filter(articles::id.eq_any(article_ids))
    .select(articles::feed_uuid)
    .load::<String>(conn)
    .map_err(|e| e.to_string())?;
  Ok(feed_uuids.iter().collect::<HashSet<_>>().len() as i32)
}

fn link_articles_to_topic(conn: &mut SqliteConnection, topic_id: i32, article_ids: &[i32]) {
  for &aid in article_ids {
    diesel::insert_into(topic_articles::table)
      .values(NewTopicArticle {
        topic_id,
        article_id: aid,
        relevance_score: 0.7,
      })
      .execute(conn)
      .ok();
  }
}

fn set_topic_id_on_analysis(conn: &mut SqliteConnection, topic_id: i32, article_ids: &[i32]) {
  for &aid in article_ids {
    diesel::update(
      article_ai_analysis::table.filter(article_ai_analysis::article_id.eq(aid)),
    )
    .set(article_ai_analysis::topic_id.eq(topic_id))
    .execute(conn)
    .ok();
  }
}

pub async fn generate_topic_summary(
  conn: &mut SqliteConnection,
  topic_id: i32,
  llm: &dyn LLMProvider,
) -> Result<(), String> {
  let (article_count, source_count): (i32, i32) = topics::table
    .find(topic_id)
    .select((topics::article_count, topics::source_count))
    .first(conn)
    .map_err(|e| e.to_string())?;

  if article_count < 3 || source_count < 2 {
    return Ok(());
  }

  let article_ids: Vec<i32> = topic_articles::table
    .filter(topic_articles::topic_id.eq(topic_id))
    .select(topic_articles::article_id)
    .load::<i32>(conn)
    .map_err(|e| e.to_string())?;

  let article_rows: Vec<(i32, String, String)> = articles::table
    .filter(articles::id.eq_any(&article_ids))
    .inner_join(feeds::table.on(feeds::uuid.eq(articles::feed_uuid)))
    .select((articles::id, articles::title, feeds::title))
    .load::<(i32, String, String)>(conn)
    .map_err(|e| e.to_string())?;

  let summaries: std::collections::HashMap<i32, String> = article_ai_analysis::table
    .filter(article_ai_analysis::article_id.eq_any(&article_ids))
    .select((article_ai_analysis::article_id, article_ai_analysis::summary))
    .load::<(i32, Option<String>)>(conn)
    .map_err(|e| e.to_string())?
    .into_iter()
    .filter_map(|(id, s)| s.map(|text| (id, text)))
    .collect();

  let article_lines: Vec<String> = article_rows
    .iter()
    .map(|(id, title, feed_title)| {
      let summary_text = summaries.get(id).map(|s| s.as_str()).unwrap_or("No summary available");
      format!("- {} ({}): {}", title, feed_title, summary_text)
    })
    .collect();

  if article_lines.is_empty() {
    return Ok(());
  }

  let topic_title: String = topics::table
    .find(topic_id)
    .select(topics::title)
    .first(conn)
    .unwrap_or_default();

  let system = "你正在为一组相关文章撰写综合主题摘要。规则：中文不超过150字。总结核心主题和关键进展。注意不同来源之间的分歧观点。使用事实性语言，不要夸张。使用现在时。请直接输出摘要，不要加前缀或引号。请用中文输出。";
  let prompt = format!(
    "主题标题：{}\n文章列表：\n{}",
    topic_title,
    article_lines.join("\n")
  );

  match llm.complete(&prompt, system).await {
    Ok(summary) => {
      let trimmed = summary.trim().to_string();
      diesel::update(topics::table.find(topic_id))
        .set(topics::description.eq(trimmed))
        .execute(conn)
        .map_err(|e| e.to_string())?;
    }
    Err(e) => {
      log::warn!("Failed to generate topic summary for topic {}: {}", topic_id, e);
    }
  }

  Ok(())
}

/// Follow a topic (idempotent).
pub fn follow_topic(conn: &mut SqliteConnection, topic_id: i32) -> Result<(), String> {
  let _ = topics::table
    .find(topic_id)
    .first::<Topic>(conn)
    .map_err(|_| "Topic not found".to_string())?;
  diesel::insert_or_ignore_into(topic_follows::table)
    .values(NewTopicFollow { topic_id })
    .execute(conn)
    .map_err(|e| e.to_string())?;
  Ok(())
}

/// Unfollow a topic.
pub fn unfollow_topic(conn: &mut SqliteConnection, topic_id: i32) -> Result<(), String> {
  diesel::delete(topic_follows::table.filter(topic_follows::topic_id.eq(topic_id)))
    .execute(conn)
    .map_err(|e| e.to_string())?;
  Ok(())
}

/// Check if a topic is followed by the user.
fn is_topic_followed(conn: &mut SqliteConnection, topic_id: i32) -> bool {
  topic_follows::table
    .filter(topic_follows::topic_id.eq(topic_id))
    .select(topic_follows::id)
    .first::<Option<i32>>(conn)
    .is_ok()
}

/// Get all followed topic IDs.
fn get_followed_topic_ids(conn: &mut SqliteConnection) -> HashSet<i32> {
  topic_follows::table
    .select(topic_follows::topic_id)
    .load::<i32>(conn)
    .unwrap_or_default()
    .into_iter()
    .collect()
}

/// Get topics list for IPC
pub fn get_topics_list(
  conn: &mut SqliteConnection,
  status: Option<String>,
  sort: Option<String>,
  limit: Option<i64>,
) -> Result<Vec<TopicItem>, String> {
  let limit = limit.unwrap_or(20);
  let sort_field = sort.unwrap_or_else(|| "last_updated_at".to_string());

  let followed_ids = get_followed_topic_ids(conn);

  let mut query = topics::table.into_boxed();

  if let Some(ref s) = status {
    query = query.filter(topics::status.eq(s));
  }

  let topic_models: Vec<Topic> = if sort_field == "article_count" {
    query
      .order(topics::article_count.desc())
      .limit(limit)
      .load::<Topic>(conn)
      .map_err(|e| e.to_string())?
  } else if sort_field == "relevance" {
    query
      .order(topics::last_updated_at.desc())
      .limit(limit * 3)
      .load::<Topic>(conn)
      .map_err(|e| e.to_string())?
  } else {
    query
      .order(topics::last_updated_at.desc())
      .limit(limit)
      .load::<Topic>(conn)
      .map_err(|e| e.to_string())?
  };

  let mut items: Vec<TopicItem> = topic_models
    .into_iter()
    .map(|t| {
      let is_following = followed_ids.contains(&t.id);
      TopicItem {
        id: t.id,
        uuid: t.uuid,
        title: t.title,
        description: t.description,
        status: t.status,
        article_count: t.article_count,
        source_count: t.source_count,
        first_seen_at: t.first_seen_at.to_string(),
        last_updated_at: t.last_updated_at.to_string(),
        is_following,
      }
    })
    .collect();

  if sort_field == "relevance" {
    let now = chrono::Utc::now().naive_utc();
    items.sort_by(|a, b| {
      let score_a = crate::ai::ranking::compute_topic_relevance_simple(
        a.article_count,
        a.source_count,
        &a.last_updated_at,
        &now,
        a.is_following,
      );
      let score_b = crate::ai::ranking::compute_topic_relevance_simple(
        b.article_count,
        b.source_count,
        &b.last_updated_at,
        &now,
        b.is_following,
      );
      score_b
        .partial_cmp(&score_a)
        .unwrap_or(std::cmp::Ordering::Equal)
    });
    items.truncate(limit as usize);
  }

  Ok(items)
}

/// Get topic detail for IPC (supports both id and uuid lookup)
pub fn get_topic_detail_by_id(
  conn: &mut SqliteConnection,
  topic_id_or_uuid: &str,
) -> Result<TopicDetail, String> {
  let topic: Topic = topics::table
    .filter(topics::uuid.eq(topic_id_or_uuid))
    .or_filter(topics::id.eq(topic_id_or_uuid.parse::<i32>().unwrap_or(-1)))
    .first::<Topic>(conn)
    .map_err(|_| "Topic not found".to_string())?;

  let ta_rows: Vec<(i32, i32, f32)> = topic_articles::table
    .filter(topic_articles::topic_id.eq(topic.id))
    .select((
      topic_articles::id,
      topic_articles::article_id,
      topic_articles::relevance_score,
    ))
    .load::<(i32, i32, f32)>(conn)
    .map_err(|e| e.to_string())?;

  let mut arts = Vec::new();
  for (_, article_id, rel_score) in &ta_rows {
    let article: Option<(String, String, String, String)> = articles::table
      .find(article_id)
      .select((
        articles::title,
        articles::link,
        articles::feed_uuid,
        articles::pub_date,
      ))
      .first(conn)
      .ok();

    if let Some((title, link, feed_uuid, pub_date)) = article {
      let feed_title: String = feeds::table
        .filter(feeds::uuid.eq(&feed_uuid))
        .select(feeds::title)
        .first(conn)
        .unwrap_or_default();

      arts.push(TopicArticleItem {
        article_id: *article_id,
        title,
        link,
        feed_title,
        feed_uuid,
        pub_date,
        relevance_score: *rel_score as f64,
        excerpt: None,
      });
    }
  }

  let topic_summary = if topic.description.is_empty() {
    None
  } else {
    Some(topic.description.clone())
  };

  let mut group_map: HashMap<(String, String), Vec<TopicArticleItem>> = HashMap::new();
  for art in &arts {
    let key = (art.feed_title.clone(), art.feed_uuid.clone());
    group_map.entry(key).or_default().push(art.clone());
  }

  let mut source_groups: Vec<SourceGroup> = group_map
    .into_iter()
    .map(|((feed_title, feed_uuid), mut articles)| {
      articles.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap_or(std::cmp::Ordering::Equal));
      let article_count = articles.len() as i32;
      SourceGroup {
        feed_title,
        feed_uuid,
        article_count,
        articles,
      }
    })
    .collect();

  source_groups.sort_by(|a, b| b.article_count.cmp(&a.article_count));

  let is_following = is_topic_followed(conn, topic.id);

  Ok(TopicDetail {
    id: topic.id,
    uuid: topic.uuid,
    title: topic.title,
    description: topic.description,
    status: topic.status,
    article_count: topic.article_count,
    source_count: topic.source_count,
    first_seen_at: topic.first_seen_at.to_string(),
    last_updated_at: topic.last_updated_at.to_string(),
    is_following,
    recent_changes: None,
    articles: arts,
    topic_summary,
    source_groups,
  })
}
