use crate::models::{NewUserFeedback, UserFeedback};
use diesel::prelude::*;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum FeedbackType {
  Useful,
  NotRelevant,
  FollowTopic,
}

impl FeedbackType {
  pub fn from_str(s: &str) -> Result<Self, String> {
    match s {
      "useful" => Ok(Self::Useful),
      "not_relevant" => Ok(Self::NotRelevant),
      "follow_topic" => Ok(Self::FollowTopic),
      _ => Err(format!("Unknown feedback type: {}", s)),
    }
  }

  pub fn weight(&self) -> f32 {
    match self {
      Self::Useful => 0.1,
      Self::NotRelevant => -0.2,
      Self::FollowTopic => 0.15,
    }
  }
}

pub fn submit_user_feedback(
  conn: &mut diesel::SqliteConnection,
  signal_id: i32,
  feedback_type_str: &str,
  comment: Option<String>,
) -> Result<UserFeedback, String> {
  let ft = FeedbackType::from_str(feedback_type_str)?;
  let weight = ft.weight();

  let new_feedback = NewUserFeedback {
    signal_id,
    feedback_type: feedback_type_str.to_string(),
    comment,
  };

  diesel::insert_into(crate::schema::user_feedback::table)
    .values(&new_feedback)
    .execute(conn)
    .map_err(|e| format!("Failed to insert feedback: {}", e))?;

  let feedback = crate::schema::user_feedback::table
    .filter(crate::schema::user_feedback::signal_id.eq(signal_id))
    .order(crate::schema::user_feedback::id.desc())
    .first::<UserFeedback>(conn)
    .map_err(|e| format!("Failed to fetch inserted feedback: {}", e))?;

  let score_expr = diesel::dsl::sql::<diesel::sql_types::Nullable<diesel::sql_types::Float>>(
    &format!(
      "MIN(1.0, MAX(0.0, COALESCE(relevance_score, 0.5) + {}))",
      weight
    ),
  );
  diesel::update(
    crate::schema::article_ai_analysis::table.filter(crate::schema::article_ai_analysis::id.eq(signal_id)),
  )
  .set(crate::schema::article_ai_analysis::relevance_score.eq(score_expr))
    .execute(conn)
    .map_err(|e| format!("Failed to update relevance score: {}", e))?;

  Ok(feedback)
}

pub fn get_feedback_history(
  conn: &mut diesel::SqliteConnection,
  limit: Option<i64>,
) -> Result<Vec<UserFeedback>, String> {
  let limit = limit.unwrap_or(50);
  crate::schema::user_feedback::table
    .order(crate::schema::user_feedback::create_date.desc())
    .limit(limit)
    .load::<UserFeedback>(conn)
    .map_err(|e| format!("Failed to fetch feedback history: {}", e))
}
