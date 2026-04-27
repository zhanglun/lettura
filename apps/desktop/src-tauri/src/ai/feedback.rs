use crate::schema::{article_ai_analysis, user_feedback};
use diesel::prelude::*;
use diesel::sql_types::*;
use serde::Serialize;

const FEEDBACK_WEIGHT_USEFUL: f32 = 0.1;
const FEEDBACK_WEIGHT_NOT_RELEVANT: f32 = -0.2;
const FEEDBACK_WEIGHT_FOLLOW_TOPIC: f32 = 0.15;

#[derive(Debug, Queryable, Serialize, QueryableByName)]
pub struct UserFeedback {
    #[diesel(sql_type = Nullable<Integer>)]
    pub id: Option<i32>,
    #[diesel(sql_type = Integer)]
    pub signal_id: i32,
    #[diesel(sql_type = Text)]
    pub feedback_type: String,
    #[diesel(sql_type = Nullable<Text>)]
    pub comment: Option<String>,
    #[diesel(sql_type = Text)]
    pub create_date: String,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = user_feedback)]
pub struct NewUserFeedback {
    pub signal_id: i32,
    pub feedback_type: String,
    pub comment: Option<String>,
    pub create_date: String,
}

#[derive(Debug, Serialize)]
pub struct FeedbackResult {
    pub recorded: bool,
    pub updated_score: Option<f32>,
}

#[derive(Debug, Serialize, QueryableByName)]
pub struct FeedbackEntry {
    #[diesel(sql_type = Nullable<Integer>)]
    pub id: Option<i32>,
    #[diesel(sql_type = Integer)]
    pub signal_id: i32,
    #[diesel(sql_type = Text)]
    pub signal_title: String,
    #[diesel(sql_type = Text)]
    pub feedback_type: String,
    #[diesel(sql_type = Text)]
    pub created_at: String,
}

fn calculate_feedback_score_adjustment(feedbacks: &[UserFeedback]) -> f32 {
    let mut total = 0.0;
    for fb in feedbacks {
        total += match fb.feedback_type.as_str() {
            "useful" => FEEDBACK_WEIGHT_USEFUL,
            "not_relevant" => FEEDBACK_WEIGHT_NOT_RELEVANT,
            "follow_topic" => FEEDBACK_WEIGHT_FOLLOW_TOPIC,
            _ => 0.0,
        };
    }
    total
}

pub fn submit_feedback(
    conn: &mut SqliteConnection,
    signal_id: i32,
    feedback_type: String,
    comment: Option<String>,
) -> Result<FeedbackResult, String> {
    let valid_types = ["useful", "not_relevant", "follow_topic"];
    if !valid_types.contains(&feedback_type.as_str()) {
        return Err("FB_INVALID_TYPE".to_string());
    }

    let exists = article_ai_analysis::table
        .filter(article_ai_analysis::id.eq(signal_id))
        .select(article_ai_analysis::id)
        .first::<Option<i32>>(conn)
        .is_ok();

    if !exists {
        return Err("TODAY_NOT_FOUND".to_string());
    }

    let single_weight = match feedback_type.as_str() {
        "useful" => FEEDBACK_WEIGHT_USEFUL,
        "not_relevant" => FEEDBACK_WEIGHT_NOT_RELEVANT,
        "follow_topic" => FEEDBACK_WEIGHT_FOLLOW_TOPIC,
        _ => 0.0,
    };

    let now = chrono::Utc::now().to_rfc3339();

    diesel::insert_into(user_feedback::table)
        .values(NewUserFeedback {
            signal_id,
            feedback_type,
            comment,
            create_date: now,
        })
        .execute(conn)
        .map_err(|e| e.to_string())?;

    let current_score: Option<f32> = article_ai_analysis::table
        .filter(article_ai_analysis::id.eq(signal_id))
        .select(article_ai_analysis::relevance_score)
        .first(conn)
        .unwrap_or(None);

    let base_score = current_score.unwrap_or(0.5);
    let new_score = (base_score + single_weight).clamp(0.0, 1.0);

    diesel::update(article_ai_analysis::table.filter(article_ai_analysis::id.eq(signal_id)))
        .set(article_ai_analysis::relevance_score.eq(new_score))
        .execute(conn)
        .map_err(|e| e.to_string())?;

    Ok(FeedbackResult {
        recorded: true,
        updated_score: Some(new_score),
    })
}

pub fn get_feedback_history(
    conn: &mut SqliteConnection,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<Vec<FeedbackEntry>, String> {
    let limit = limit.unwrap_or(20);
    let offset = offset.unwrap_or(0);

    diesel::sql_query(
        "SELECT uf.id, uf.signal_id, COALESCE(aaa.signal_title, a.title) as signal_title, \
         uf.feedback_type, uf.create_date as created_at \
         FROM user_feedback uf \
         JOIN article_ai_analysis aaa ON uf.signal_id = aaa.id \
         JOIN articles a ON aaa.article_id = a.id \
         ORDER BY uf.create_date DESC \
         LIMIT ? OFFSET ?",
    )
    .bind::<Integer, _>(limit)
    .bind::<Integer, _>(offset)
    .load(conn)
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_data(conn: &mut SqliteConnection) -> i32 {
        let uid = uuid::Uuid::new_v4().to_string();
        let feed_uuid = format!("feed-{}", &uid[..8]);
        let art_uuid = format!("art-{}", &uid[..8]);
        let feed_url = format!("http://test-{}/feed", &uid[..8]);
        let feed_title = format!("Feed {}", &uid[..8]);

        diesel::sql_query(
            "INSERT INTO feeds (uuid, title, link, feed_url, feed_type, description, pub_date, updated, logo, health_status, failure_reason, sort, sync_interval, last_sync_date, create_date, update_date) \
             VALUES (?, ?, ?, ?, '', '', '2024-01-01', '2024-01-01', '', 0, '', 0, 0, '2024-01-01', '2024-01-01', '2024-01-01')",
        )
        .bind::<Text, _>(&feed_uuid)
        .bind::<Text, _>(&feed_title)
        .bind::<Text, _>(&format!("http://test-{}", &uid[..8]))
        .bind::<Text, _>(&feed_url)
        .execute(conn)
        .unwrap();

        diesel::sql_query(
            "INSERT INTO articles (uuid, title, link, feed_url, feed_uuid, description, author, pub_date, content, create_date, update_date, read_status, starred) \
             VALUES (?, 'Test Article', ?, ?, ?, 'Desc', 'Auth', '2024-01-01', 'Content', '2024-01-01', '2024-01-01', 0, 0)",
        )
        .bind::<Text, _>(&art_uuid)
        .bind::<Text, _>(&format!("http://test-{}", &uid[..8]))
        .bind::<Text, _>(&feed_url)
        .bind::<Text, _>(&feed_uuid)
        .execute(conn)
        .unwrap();

        let article_id: i32 =
            diesel::select(diesel::dsl::sql::<diesel::sql_types::Integer>("last_insert_rowid()"))
                .first(conn)
                .unwrap();

        diesel::sql_query(
            "INSERT INTO article_ai_analysis (article_id, relevance_score, is_duplicate, create_date, update_date) \
             VALUES (?, 0.5, 0, '2024-01-01', '2024-01-01')",
        )
        .bind::<Integer, _>(article_id)
        .execute(conn)
        .unwrap();

        diesel::select(diesel::dsl::sql::<diesel::sql_types::Integer>("last_insert_rowid()"))
            .first(conn)
            .unwrap()
    }

    #[test]
    fn test_calculate_feedback_score_adjustment_mixed() {
        let feedbacks = vec![
            UserFeedback {
                id: Some(1),
                signal_id: 1,
                feedback_type: "useful".to_string(),
                comment: None,
                create_date: "2024-01-01".to_string(),
            },
            UserFeedback {
                id: Some(2),
                signal_id: 1,
                feedback_type: "not_relevant".to_string(),
                comment: None,
                create_date: "2024-01-01".to_string(),
            },
            UserFeedback {
                id: Some(3),
                signal_id: 1,
                feedback_type: "follow_topic".to_string(),
                comment: None,
                create_date: "2024-01-01".to_string(),
            },
        ];
        let adj = calculate_feedback_score_adjustment(&feedbacks);
        let expected = FEEDBACK_WEIGHT_USEFUL + FEEDBACK_WEIGHT_NOT_RELEVANT + FEEDBACK_WEIGHT_FOLLOW_TOPIC;
        assert!((adj - expected).abs() < 0.001);
    }

    #[test]
    fn test_calculate_feedback_score_adjustment_empty() {
        let adj = calculate_feedback_score_adjustment(&[]);
        assert!((adj - 0.0).abs() < 0.001);
    }

    #[test]
    fn test_calculate_feedback_score_adjustment_unknown_type() {
        let feedbacks = vec![UserFeedback {
            id: Some(1),
            signal_id: 1,
            feedback_type: "unknown_type".to_string(),
            comment: None,
            create_date: "2024-01-01".to_string(),
        }];
        let adj = calculate_feedback_score_adjustment(&feedbacks);
        assert!((adj - 0.0).abs() < 0.001);
    }

    #[test]
    fn test_submit_feedback_invalid_type() {
        let conn = &mut crate::db::establish_connection();
        let result = submit_feedback(conn, 1, "bad_type".to_string(), None);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "FB_INVALID_TYPE");
    }

    #[test]
    fn test_submit_feedback_missing_signal() {
        let conn = &mut crate::db::establish_connection();
        let result = submit_feedback(conn, -99999, "useful".to_string(), None);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "TODAY_NOT_FOUND");
    }

    #[test]
    fn test_submit_feedback_score_update() {
        let conn = &mut crate::db::establish_connection();
        let signal_id = setup_test_data(conn);

        let result = submit_feedback(conn, signal_id, "useful".to_string(), Some("Great!".to_string()));
        assert!(result.is_ok());
        let fb = result.unwrap();
        assert!(fb.recorded);
        assert!(fb.updated_score.is_some());
        let score = fb.updated_score.unwrap();
        assert!(score > 0.5);
        assert!(score <= 1.0);

        let updated_score: Option<f32> = article_ai_analysis::table
            .filter(article_ai_analysis::id.eq(signal_id))
            .select(article_ai_analysis::relevance_score)
            .first(conn)
            .unwrap_or(None);
        assert!(updated_score.is_some());
        assert!((updated_score.unwrap() - score).abs() < 0.001);
    }

    #[test]
    fn test_submit_feedback_negative_score_clamps() {
        let conn = &mut crate::db::establish_connection();
        let signal_id = setup_test_data(conn);

        for _ in 0..10 {
            let _ = submit_feedback(conn, signal_id, "not_relevant".to_string(), None);
        }

        let result = submit_feedback(conn, signal_id, "not_relevant".to_string(), None);
        assert!(result.is_ok());
        let score = result.unwrap().updated_score.unwrap();
        assert!(score >= 0.0);
    }

    #[test]
    fn test_get_feedback_history_empty() {
        let conn = &mut crate::db::establish_connection();
        let result = get_feedback_history(conn, None, None);
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_feedback_history_with_data() {
        let conn = &mut crate::db::establish_connection();
        let signal_id = setup_test_data(conn);

        let _ = submit_feedback(conn, signal_id, "useful".to_string(), None);
        let _ = submit_feedback(
            conn,
            signal_id,
            "follow_topic".to_string(),
            Some("Interested".to_string()),
        );

        let result = get_feedback_history(conn, Some(10), Some(0));
        assert!(result.is_ok());
        let entries = result.unwrap();
        assert!(entries.len() >= 2);
    }
}
