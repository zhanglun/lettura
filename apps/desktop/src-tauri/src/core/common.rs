use crate::db;
use diesel::{prelude::*, sql_types::*};
use serde::Serialize;

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct ArticleQueryItem {
  #[diesel(sql_type = Integer)]
  pub id: i32,

  #[diesel(sql_type = Text)]
  pub uuid: String,

  #[diesel(sql_type = Text)]
  pub title: String,

  #[diesel(sql_type = Text)]
  pub link: String,

  #[diesel(sql_type = Text)]
  pub feed_url: String,

  #[diesel(sql_type = Text)]
  pub feed_uuid: String,

  #[diesel(sql_type = Text)]
  pub feed_title: String,

  #[diesel(sql_type = Text)]
  pub description: String,

  #[diesel(sql_type = Text)]
  pub author: String,

  #[diesel(sql_type = Text)]
  pub pub_date: String,

  #[diesel(sql_type = Text)]
  pub content: String,

  #[diesel(sql_type = Text)]
  pub create_date: String,

  #[diesel(sql_type = Text)]
  pub update_date: String,

  #[diesel(sql_type = Integer)]
  pub read_status: i32,

  #[diesel(sql_type = Integer)]
  pub starred: i32,

  #[diesel(sql_type = Text)]
  pub starred_at: String,
}
pub struct Common {}
pub struct GlobalSearchQuery {
  pub query: String,
  pub limit: Option<i32>,
  pub cursor: Option<i32>,
  pub start_date: Option<String>,
  pub end_date: Option<String>,
  pub feed_uuid: Option<String>,
  pub is_starred: Option<i32>,
  pub min_relevance: Option<f32>,
}

pub struct StaredQueryItem {}

impl Common {
  pub fn global_search(search: GlobalSearchQuery) -> Vec<ArticleQueryItem> {
    let mut connection = db::establish_connection();
    let query_str = search.query;
    let limit = search.limit.unwrap_or(12);
    let cursor = search.cursor.unwrap_or(1);
    let start_date = search.start_date;
    let end_date = search.end_date;
    let feed_uuid = search.feed_uuid;

    let mut query_boxed = diesel::sql_query("").into_boxed();

    let (search_condition, search_params) = Self::parse_search_query(&query_str);

    let mut where_conditions = vec![search_condition, "A.feed_uuid = F.uuid".to_string()];

    let mut params = search_params;

    if let Some(uuid) = &feed_uuid {
      where_conditions.push("A.feed_uuid = ?".to_string());
      params.push(uuid.clone());
    }

    if let Some(start) = &start_date {
      where_conditions.push("A.pub_date >= ?".to_string());
      params.push(start.clone());
    }

    if let Some(end) = &end_date {
      where_conditions.push("A.pub_date <= ?".to_string());
      params.push(end.clone());
    }

    if let Some(is_starred) = &search.is_starred {
      where_conditions.push("A.starred = ?".to_string());
      params.push(is_starred.to_string());
    }

    if let Some(min_relevance) = &search.min_relevance {
      where_conditions.push("EXISTS (SELECT 1 FROM article_ai_analysis AAA WHERE AAA.article_id = A.id AND AAA.relevance_score >= ?)".to_string());
      params.push(min_relevance.to_string());
    }

    let where_clause = where_conditions.join(" AND ");

    query_boxed = query_boxed.sql(format!(
      "
        SELECT
          A.id,
          A.uuid,
          A.title,
          A.link,
          F.feed_url as feed_url,
          F.uuid as feed_uuid,
          F.title as feed_title,
          A.description,
          A.author,
          A.pub_date,
          A.content,
          A.create_date,
          A.update_date,
          A.read_status,
          A.starred,
          A.starred_at
        FROM
          articles AS A
        LEFT JOIN feeds as F
        WHERE
          {}
        LIMIT ? OFFSET ?
        ;",
      where_clause
    ));

    let mut query = query_boxed.bind::<Text, _>(&params[0]);

    for param in params.iter().skip(1) {
      query = query.bind::<Text, _>(param.clone());
    }

    query = query.bind::<Integer, _>(limit);
    query = query.bind::<Integer, _>((cursor - 1) * limit.clone());

    let result = query.get_results(&mut connection).unwrap();

    result
  }

  fn parse_search_query(query: &str) -> (String, Vec<String>) {
    let query = query.trim();

    if query.is_empty() {
      return ("(1=1)".to_string(), vec![]);
    }

    let mut conditions = vec![];
    let mut params = vec![];
    let mut i = 0;
    let chars: Vec<char> = query.chars().collect();
    let len = chars.len();

    while i < len {
      let c = chars[i];

      if c == '"' {
        i += 1;
        let mut phrase = String::new();

        while i < len && chars[i] != '"' {
          phrase.push(chars[i]);
          i += 1;
        }

        if !phrase.is_empty() {
          conditions.push("((A.title LIKE ?) OR (A.content LIKE ?))".to_string());
          params.push(format!("%{}%", phrase));
          params.push(format!("%{}%", phrase));
        }

        i += 1;
        i = Self::skip_whitespace(&chars, i);
      } else if i + 3 <= len && Self::matches_keyword(&chars, i, "NOT") {
        i += 3;
        i = Self::skip_whitespace(&chars, i);

        if i < len {
          let (term, next_i) = Self::extract_term(&chars, i);
          if !term.is_empty() {
            conditions.push("((A.title NOT LIKE ?) AND (A.content NOT LIKE ?))".to_string());
            params.push(format!("%{}%", term));
            params.push(format!("%{}%", term));
          }
          i = next_i;
        }
      } else if i + 2 <= len && Self::matches_keyword(&chars, i, "OR") {
        i += 2;
        i = Self::skip_whitespace(&chars, i);
      } else if i + 3 <= len && Self::matches_keyword(&chars, i, "AND") {
        i += 3;
        i = Self::skip_whitespace(&chars, i);
      } else {
        let (term, next_i) = Self::extract_term(&chars, i);
        if !term.is_empty() {
          conditions.push("((A.title LIKE ?) OR (A.content LIKE ?))".to_string());
          params.push(format!("%{}%", term));
          params.push(format!("%{}%", term));
        }
        i = next_i;
      }
    }

    if conditions.is_empty() {
      return ("(1=1)".to_string(), vec![]);
    }

    let condition_str = format!("({})", conditions.join(" AND "));

    (condition_str, params)
  }

  fn matches_keyword(chars: &[char], start: usize, keyword: &str) -> bool {
    let keyword_chars: Vec<char> = keyword.chars().collect();
    let keyword_len = keyword_chars.len();

    if start + keyword_len > chars.len() {
      return false;
    }

    for i in 0..keyword_len {
      if chars[start + i].to_ascii_uppercase() != keyword_chars[i].to_ascii_uppercase() {
        return false;
      }
    }

    true
  }

  fn skip_whitespace(chars: &[char], mut i: usize) -> usize {
    while i < chars.len() && chars[i].is_whitespace() {
      i += 1;
    }
    i
  }

  fn extract_term(chars: &[char], start: usize) -> (String, usize) {
    let mut term = String::new();
    let mut i = start;

    while i < chars.len() {
      let c = chars[i];

      if c == '"' {
        break;
      }

      if c.is_whitespace() {
        let ahead = Self::skip_whitespace(chars, i + 1);
        if ahead + 3 <= chars.len() && Self::matches_keyword(chars, ahead, "AND") {
          break;
        }
        if ahead + 2 <= chars.len() && Self::matches_keyword(chars, ahead, "OR") {
          break;
        }
        if ahead + 3 <= chars.len() && Self::matches_keyword(chars, ahead, "NOT") {
          break;
        }
        i = ahead;
        continue;
      }

      term.push(c);
      i += 1;
    }

    (term.trim().to_string(), i)
  }
}
