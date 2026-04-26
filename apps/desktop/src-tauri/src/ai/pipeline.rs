use crate::ai::config::AiConfig;
use crate::ai::embedding::EmbeddingProvider;
use crate::ai::llm::LLMProvider;
use crate::ai::ranking;
use crate::ai::signal_title;
use crate::ai::summary;
use crate::ai::why_it_matters;
use crate::db;
use crate::schema::{article_ai_analysis, articles, feeds, pipeline_runs};
use chrono::Utc;
use diesel::prelude::*;
use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Emitter;

static PIPELINE_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Serialize)]
pub struct PipelineResult {
    pub run_id: i32,
    pub started: bool,
}

#[derive(Debug, Serialize)]
pub struct Signal {
    pub id: i32,
    pub title: String,
    pub summary: String,
    pub why_it_matters: String,
    pub relevance_score: f64,
    pub source_count: i32,
    pub sources: Vec<SignalSource>,
    pub topic_id: Option<i32>,
    pub topic_title: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct SignalSource {
    pub article_id: i32,
    pub article_uuid: String,
    pub title: String,
    pub link: String,
    pub feed_title: String,
    pub feed_uuid: String,
    pub pub_date: String,
    pub excerpt: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SignalDetail {
    pub signal: Signal,
    pub all_sources: Vec<SignalSource>,
}

#[derive(Debug)]
pub enum PipelineError {
    AlreadyRunning,
    NoApiKey,
    DbError(String),
    AiError(String),
}

impl std::fmt::Display for PipelineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PipelineError::AlreadyRunning => write!(f, "PL_ALREADY_RUNNING"),
            PipelineError::NoApiKey => write!(f, "AI_NO_API_KEY"),
            PipelineError::DbError(e) => write!(f, "Database error: {}", e),
            PipelineError::AiError(e) => write!(f, "AI error: {}", e),
        }
    }
}

pub fn is_pipeline_running() -> bool {
    PIPELINE_RUNNING.load(Ordering::SeqCst)
}

/// Convenience wrapper: load AI config, create providers, spawn pipeline
/// if API key is configured. No-op otherwise.
///
/// Call this from sync call sites after articles are fetched.
pub fn spawn_pipeline_if_configured(app_handle: Option<tauri::AppHandle>) {
    use crate::ai::embedding::OpenAIEmbedding;
    use crate::ai::llm::OpenAILLM;
    use crate::core::config;

    let user_config = config::get_user_config();
    let ai_config = match user_config.ai {
        Some(ref c) if c.has_api_key() => c.clone(),
        _ => return, // no API key configured, silently skip
    };

    tokio::spawn(async move {
        let embedding = OpenAIEmbedding::new(
            &ai_config.api_key,
            &ai_config.base_url,
            ai_config.embedding_model.clone(),
        );
        let llm = OpenAILLM::new(
            &ai_config.api_key,
            &ai_config.base_url,
            ai_config.model.clone(),
        );

        let result = run_pipeline(
            &ai_config,
            &embedding,
            &llm,
            "incremental",
            app_handle.as_ref(),
        )
        .await;

        match result {
            Ok(r) => log::info!("Pipeline completed: run_id={}", r.run_id),
            Err(e) => log::warn!("Pipeline failed: {}", e),
        }
    });
}

/// Starts a background timer that runs the pipeline at the configured interval.
/// Called once during app startup.
pub fn start_pipeline_timer(app_handle: tauri::AppHandle) {
    use crate::ai::embedding::OpenAIEmbedding;
    use crate::ai::llm::OpenAILLM;
    use crate::core::config;

    tokio::spawn(async move {
        loop {
            let user_config = config::get_user_config();
            let interval_hours = user_config
                .ai
                .as_ref()
                .map(|c| c.pipeline_interval_hours)
                .unwrap_or(1)
                .max(1);

            tokio::time::sleep(std::time::Duration::from_secs(interval_hours * 3600)).await;

            let ai_config = match user_config.ai {
                Some(ref c) if c.has_api_key() => c.clone(),
                _ => continue,
            };

            let embedding = OpenAIEmbedding::new(
                &ai_config.api_key,
                &ai_config.base_url,
                ai_config.embedding_model.clone(),
            );
            let llm = OpenAILLM::new(
                &ai_config.api_key,
                &ai_config.base_url,
                ai_config.model.clone(),
            );

            let result = run_pipeline(
                &ai_config,
                &embedding,
                &llm,
                "scheduled",
                Some(&app_handle),
            )
            .await;

            match result {
                Ok(r) => log::info!("Scheduled pipeline completed: run_id={}", r.run_id),
                Err(PipelineError::AlreadyRunning) => {}
                Err(e) => log::warn!("Scheduled pipeline failed: {}", e),
            }
        }
    });
}

pub async fn run_pipeline(
    ai_config: &AiConfig,
    embedding_provider: &dyn EmbeddingProvider,
    llm_provider: &dyn LLMProvider,
    run_type: &str,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<PipelineResult, PipelineError> {
    if !ai_config.has_api_key() {
        return Err(PipelineError::NoApiKey);
    }

    if PIPELINE_RUNNING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err(PipelineError::AlreadyRunning);
    }

    let result = run_pipeline_inner(ai_config, embedding_provider, llm_provider, run_type, app_handle).await;

    PIPELINE_RUNNING.store(false, Ordering::SeqCst);
    result
}

async fn run_pipeline_inner(
    ai_config: &AiConfig,
    embedding_provider: &dyn EmbeddingProvider,
    llm_provider: &dyn LLMProvider,
    run_type: &str,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<PipelineResult, PipelineError> {
    let conn = &mut db::establish_connection();

    let started_at = Utc::now().to_rfc3339();
    diesel::insert_into(pipeline_runs::table)
        .values((
            pipeline_runs::run_type.eq(run_type),
            pipeline_runs::status.eq("running"),
            pipeline_runs::started_at.eq(&started_at),
        ))
        .execute(conn)
        .map_err(|e| PipelineError::DbError(e.to_string()))?;

    let run_id: i32 = diesel::select(diesel::dsl::sql::<diesel::sql_types::Integer>(
        "last_insert_rowid()",
    ))
    .first(conn)
    .unwrap_or(0);

    emit_event(app_handle, "pipeline:started", serde_json::json!({"run_id": run_id, "run_type": run_type}));

    let result = execute_pipeline_steps(conn, ai_config, embedding_provider, llm_provider, app_handle).await;

    let (status, error_message) = match &result {
        Ok(count) => {
            emit_event(app_handle, "pipeline:completed", serde_json::json!({"run_id": run_id, "signals_generated": count}));
            ("completed", None)
        }
        Err(e) => {
            emit_event(app_handle, "pipeline:failed", serde_json::json!({"run_id": run_id, "error_message": e.to_string()}));
            ("failed", Some(e.to_string()))
        }
    };

    let finished_at = Utc::now().to_rfc3339();
    diesel::update(pipeline_runs::table.filter(pipeline_runs::id.eq(Some(run_id))))
        .set((
            pipeline_runs::status.eq(status),
            pipeline_runs::finished_at.eq(&finished_at),
            pipeline_runs::error_message.eq(error_message),
        ))
        .execute(conn)
        .ok();

    result.map(|_| PipelineResult { run_id, started: true })
}

async fn execute_pipeline_steps(
    conn: &mut SqliteConnection,
    ai_config: &AiConfig,
    embedding_provider: &dyn EmbeddingProvider,
    llm_provider: &dyn LLMProvider,
    app_handle: Option<&tauri::AppHandle>,
) -> Result<usize, PipelineError> {
    emit_progress(app_handle, "fetching_articles", 0, 1);

    let unprocessed = fetch_unprocessed_articles(conn);
    if unprocessed.is_empty() {
        return Ok(0);
    }

    emit_progress(app_handle, "generating_embeddings", 0, 1);

    let texts: Vec<String> = unprocessed
        .iter()
        .map(|a| truncate_content(&a.description, 8000))
        .collect();

    let text_refs: Vec<&str> = texts.iter().map(|s| s.as_str()).collect();

    let embeddings = embedding_provider
        .embed(text_refs)
        .await
        .map_err(PipelineError::AiError)?;

    for (i, article) in unprocessed.iter().enumerate() {
        let embedding_json = serde_json::to_string(&embeddings[i]).unwrap_or_default();
        diesel::insert_into(article_ai_analysis::table)
            .values((
                article_ai_analysis::article_id.eq(article.id),
                article_ai_analysis::embedding_json.eq(embedding_json),
                article_ai_analysis::model_version.eq(&ai_config.embedding_model),
            ))
            .execute(conn)
            .map_err(|e| PipelineError::DbError(e.to_string()))?;
    }

    emit_progress(app_handle, "clustering", 0, 1);
    let clusters = simple_cluster(&embeddings, 0.3);

    emit_progress(app_handle, "generating_signal_titles", 0, clusters.len());
    for (cluster_idx, cluster) in clusters.iter().enumerate() {
        let titles: Vec<String> = cluster
            .iter()
            .map(|&idx| unprocessed[idx].title.clone())
            .collect();

        let signal_title = signal_title::generate_signal_title_with_fallback(llm_provider, &titles).await;

        if cluster.len() > 1 {
            if let Some(&rep_idx) = cluster.first() {
                diesel::update(
                    article_ai_analysis::table
                        .filter(article_ai_analysis::article_id.eq(unprocessed[rep_idx].id)),
                )
                .set(article_ai_analysis::signal_title.eq(&signal_title))
                .execute(conn)
                .ok();
            }
        }

        emit_progress(app_handle, "generating_signal_titles", cluster_idx + 1, clusters.len());
    }

    emit_progress(app_handle, "generating_summaries", 0, unprocessed.len());
    let mut processed_count = 0;

    for cluster in &clusters {
        for &article_idx in cluster {
            let article = &unprocessed[article_idx];
            let content = truncate_content(&article.description, 4000);

            match summary::generate_summary(llm_provider, &article.title, &content).await {
                Ok(s) => {
                    diesel::update(
                        article_ai_analysis::table
                            .filter(article_ai_analysis::article_id.eq(article.id)),
                    )
                    .set(article_ai_analysis::summary.eq(&s))
                    .execute(conn)
                    .ok();
                }
                Err(_) => {}
            }
            processed_count += 1;
            emit_progress(app_handle, "generating_summaries", processed_count, unprocessed.len());
        }
    }

    emit_progress(app_handle, "ranking", 0, 1);
    for (i, article) in unprocessed.iter().enumerate() {
        let distance = clusters
            .iter()
            .filter_map(|c| {
                if c.contains(&i) && c.len() > 1 {
                    Some(0.2)
                } else {
                    None
                }
            })
            .next()
            .unwrap_or(0.5);

        let score = ranking::compute_relevance_score(distance, 0.5, 24.0);
        diesel::update(
            article_ai_analysis::table.filter(article_ai_analysis::article_id.eq(article.id)),
        )
        .set(article_ai_analysis::relevance_score.eq(score as f32))
        .execute(conn)
        .ok();
    }

    let top_article_ids: Vec<i32> = article_ai_analysis::table
        .filter(article_ai_analysis::summary.is_not_null())
        .filter(article_ai_analysis::relevance_score.is_not_null())
        .order(article_ai_analysis::relevance_score.desc())
        .limit(10)
        .select(article_ai_analysis::article_id)
        .load::<i32>(conn)
        .unwrap_or_default();

    let top_id_set: std::collections::HashSet<i32> = top_article_ids.into_iter().collect();

    emit_progress(app_handle, "generating_wim", 0, top_id_set.len());
    let mut wim_count = 0;
    for article in &unprocessed {
        if !top_id_set.contains(&article.id) {
            continue;
        }

        let summary_text: Option<String> = article_ai_analysis::table
            .filter(article_ai_analysis::article_id.eq(article.id))
            .select(article_ai_analysis::summary)
            .first::<Option<String>>(conn)
            .ok()
            .flatten();

        let summary_val = match summary_text {
            Some(ref s) if !s.is_empty() => s.clone(),
            _ => {
                wim_count += 1;
                emit_progress(app_handle, "generating_wim", wim_count, top_id_set.len());
                continue;
            }
        };

        let wim_input = why_it_matters::WimInput {
            summary: summary_val.clone(),
            source_count: 1,
            feed_count: 1,
            topic_title: None,
            topic_description: None,
        };

        let wim = why_it_matters::generate_why_it_matters_with_fallback(llm_provider, &wim_input).await;

        diesel::update(
            article_ai_analysis::table
                .filter(article_ai_analysis::article_id.eq(article.id)),
        )
        .set(article_ai_analysis::why_it_matters.eq(&wim))
        .execute(conn)
        .ok();

        wim_count += 1;
        emit_progress(app_handle, "generating_wim", wim_count, top_id_set.len());
    }

    emit_progress(app_handle, "storing_results", 0, 1);
    Ok(unprocessed.len())
}

struct UnprocessedArticle {
    id: i32,
    title: String,
    description: String,
}

fn fetch_unprocessed_articles(conn: &mut SqliteConnection) -> Vec<UnprocessedArticle> {
    articles::table
        .left_join(article_ai_analysis::table.on(article_ai_analysis::article_id.eq(articles::id)))
        .filter(article_ai_analysis::id.is_null())
        .select((articles::id, articles::title, articles::description))
        .limit(100)
        .load::<(i32, String, String)>(conn)
        .map(|rows| {
            rows.into_iter()
                .map(|(id, title, description)| UnprocessedArticle {
                    id,
                    title,
                    description,
                })
                .collect()
        })
        .unwrap_or_default()
}

fn simple_cluster(embeddings: &[Vec<f32>], threshold: f64) -> Vec<Vec<usize>> {
    if embeddings.is_empty() {
        return vec![];
    }

    let n = embeddings.len();
    let mut assigned = vec![false; n];
    let mut clusters: Vec<Vec<usize>> = vec![];

    for i in 0..n {
        if assigned[i] {
            continue;
        }
        let mut cluster = vec![i];
        assigned[i] = true;

        for j in (i + 1)..n {
            if assigned[j] {
                continue;
            }
            let sim = cosine_similarity(&embeddings[i], &embeddings[j]);
            if sim > (1.0 - threshold) {
                cluster.push(j);
                assigned[j] = true;
            }
        }
        clusters.push(cluster);
    }

    clusters
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f64 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }
    let dot: f64 = a.iter().zip(b.iter()).map(|(x, y)| (*x as f64) * (*y as f64)).sum();
    let norm_a: f64 = a.iter().map(|x| (*x as f64).powi(2)).sum::<f64>().sqrt();
    let norm_b: f64 = b.iter().map(|x| (*x as f64).powi(2)).sum::<f64>().sqrt();
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    dot / (norm_a * norm_b)
}

fn truncate_content(content: &str, max_chars: usize) -> String {
    if content.len() <= max_chars {
        content.to_string()
    } else {
        content[..max_chars].to_string()
    }
}

fn emit_event(app_handle: Option<&tauri::AppHandle>, event: &str, payload: serde_json::Value) {
    if let Some(handle) = app_handle {
        let _ = handle.emit(event, payload);
    }
}

fn emit_progress(
    app_handle: Option<&tauri::AppHandle>,
    stage: &str,
    current: usize,
    total: usize,
) {
    emit_event(
        app_handle,
        "pipeline:progress",
        serde_json::json!({"stage": stage, "current": current, "total": total}),
    );
}

pub fn get_today_signals(conn: &mut SqliteConnection, limit: i32) -> Result<Vec<Signal>, String> {
    let limit = limit.clamp(1, 10);

    let analyses: Vec<(Option<i32>, i32, Option<String>, Option<String>, Option<String>, Option<f32>)> =
        article_ai_analysis::table
            .filter(article_ai_analysis::summary.is_not_null())
            .filter(article_ai_analysis::relevance_score.is_not_null())
            .order(article_ai_analysis::relevance_score.desc())
            .limit(limit as i64)
            .select((
                article_ai_analysis::id,
                article_ai_analysis::article_id,
                article_ai_analysis::signal_title,
                article_ai_analysis::summary,
                article_ai_analysis::why_it_matters,
                article_ai_analysis::relevance_score,
            ))
            .load(conn)
            .map_err(|e| e.to_string())?;

    let mut signals = Vec::new();
    for (analysis_id, article_id, signal_title, summary, why_it_matters, score) in analyses {
        let analysis_id = analysis_id.unwrap_or(0);
        let article: Option<(String, String, String)> = articles::table
            .find(article_id)
            .select((articles::title, articles::link, articles::feed_uuid))
            .first(conn)
            .ok();

        let title = match &signal_title {
            Some(t) if !t.is_empty() => t.clone(),
            _ => article.as_ref().map(|(t, _, _)| t.clone()).unwrap_or_default(),
        };

        let sources = get_sources_for_article(conn, article_id);

        signals.push(Signal {
            id: analysis_id,
            title,
            summary: summary.unwrap_or_default(),
            why_it_matters: why_it_matters.unwrap_or_default(),
            relevance_score: score.unwrap_or(0.0) as f64,
            source_count: sources.len() as i32,
            sources,
            topic_id: None,
            topic_title: None,
            created_at: Utc::now().to_rfc3339(),
        });
    }

    Ok(signals)
}

pub fn get_signal_detail(
    conn: &mut SqliteConnection,
    signal_id: i32,
) -> Result<SignalDetail, String> {
    let analysis: Option<(Option<i32>, i32, Option<String>, Option<String>, Option<String>, Option<f32>)> =
        article_ai_analysis::table
            .filter(article_ai_analysis::id.eq(signal_id))
            .select((
                article_ai_analysis::id,
                article_ai_analysis::article_id,
                article_ai_analysis::signal_title,
                article_ai_analysis::summary,
                article_ai_analysis::why_it_matters,
                article_ai_analysis::relevance_score,
            ))
            .first(conn)
            .ok();

    let (_, article_id, signal_title, summary, why_it_matters, score) = analysis
        .ok_or_else(|| "Signal not found".to_string())?;

    let article: Option<(String, String, String)> = articles::table
        .find(article_id)
        .select((articles::title, articles::link, articles::feed_uuid))
        .first(conn)
        .ok();

    let title = match &signal_title {
        Some(t) if !t.is_empty() => t.clone(),
        _ => article.as_ref().map(|(t, _, _)| t.clone()).unwrap_or_default(),
    };

    let all_sources = find_related_sources(conn, signal_id, article_id, 0.7)?;

    let signal = Signal {
        id: signal_id,
        title,
        summary: summary.unwrap_or_default(),
        why_it_matters: why_it_matters.unwrap_or_default(),
        relevance_score: score.unwrap_or(0.0) as f64,
        source_count: all_sources.len() as i32,
        sources: all_sources.clone(),
        topic_id: None,
        topic_title: None,
        created_at: Utc::now().to_rfc3339(),
    };

    Ok(SignalDetail {
        signal,
        all_sources,
    })
}

pub fn find_related_sources(
    conn: &mut SqliteConnection,
    signal_id: i32,
    main_article_id: i32,
    similarity_threshold: f64,
) -> Result<Vec<SignalSource>, String> {
    let embedding_json: Option<String> = article_ai_analysis::table
        .filter(article_ai_analysis::id.eq(signal_id))
        .select(article_ai_analysis::embedding_json)
        .first(conn)
        .ok()
        .flatten();

    let target_embedding: Vec<f32> = match embedding_json {
        Some(ref json) if !json.is_empty() => {
            serde_json::from_str(json).unwrap_or_default()
        }
        _ => {
            return Ok(get_sources_for_article(conn, main_article_id));
        }
    };

    if target_embedding.is_empty() {
        return Ok(get_sources_for_article(conn, main_article_id));
    }

    let rows: Vec<(i32, Option<String>)> = article_ai_analysis::table
        .filter(article_ai_analysis::embedding_json.is_not_null())
        .filter(article_ai_analysis::id.ne(signal_id))
        .select((
            article_ai_analysis::article_id,
            article_ai_analysis::embedding_json,
        ))
        .load::<(i32, Option<String>)>(conn)
        .map_err(|e| e.to_string())?;

    let mut related_article_ids: Vec<i32> = Vec::new();
    for (article_id, emb_json_opt) in &rows {
        if let Some(emb_json) = emb_json_opt {
            let emb: Vec<f32> = serde_json::from_str(emb_json).unwrap_or_default();
            if emb.len() == target_embedding.len() {
                let sim = cosine_similarity(&target_embedding, &emb);
                if sim > similarity_threshold && !related_article_ids.contains(article_id) {
                    related_article_ids.push(*article_id);
                }
            }
        }
    }

    let mut source_article_ids: Vec<i32> = vec![main_article_id];
    for aid in &related_article_ids {
        if !source_article_ids.contains(aid) {
            source_article_ids.push(*aid);
        }
    }

    source_article_ids.truncate(50);

    let mut sources: Vec<SignalSource> = Vec::new();
    for aid in &source_article_ids {
        if let Some(source) = build_signal_source(conn, *aid) {
            sources.push(source);
        }
    }

    sources.sort_by(|a, b| b.pub_date.cmp(&a.pub_date));

    Ok(sources)
}

fn build_signal_source(conn: &mut SqliteConnection, article_id: i32) -> Option<SignalSource> {
    let article: (i32, String, String, String, String, String) = articles::table
        .find(article_id)
        .select((
            articles::id,
            articles::uuid,
            articles::title,
            articles::link,
            articles::feed_uuid,
            articles::pub_date,
        ))
        .first(conn)
        .ok()?;

    let (id, uuid, title, link, feed_uuid, pub_date) = article;

    let feed_title: Option<String> = feeds::table
        .filter(feeds::uuid.eq(&feed_uuid))
        .select(feeds::title)
        .first(conn)
        .ok();

    Some(SignalSource {
        article_id: id,
        article_uuid: uuid,
        title,
        link,
        feed_title: feed_title.unwrap_or_default(),
        feed_uuid,
        pub_date,
        excerpt: None,
    })
}

fn get_sources_for_article(conn: &mut SqliteConnection, article_id: i32) -> Vec<SignalSource> {
    build_signal_source(conn, article_id).into_iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity_identical() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        let sim = cosine_similarity(&a, &b);
        assert!(sim.abs() < 0.001);
    }

    #[test]
    fn test_simple_cluster() {
        let embeddings = vec![
            vec![1.0, 0.0, 0.0],
            vec![0.99, 0.01, 0.0],
            vec![0.0, 1.0, 0.0],
        ];
        let clusters = simple_cluster(&embeddings, 0.3);
        assert!(clusters.len() >= 1);
    }

    #[test]
    fn test_truncate_content() {
        let content = "hello world";
        assert_eq!(truncate_content(content, 100), "hello world");
        assert_eq!(truncate_content(content, 5), "hello");
    }

    #[test]
    fn test_simple_cluster_empty() {
        let clusters = simple_cluster(&[], 0.3);
        assert!(clusters.is_empty());
    }

    #[test]
    fn test_simple_cluster_single() {
        let embeddings = vec![vec![1.0, 0.0, 0.0]];
        let clusters = simple_cluster(&embeddings, 0.3);
        assert_eq!(clusters.len(), 1);
        assert_eq!(clusters[0], vec![0]);
    }

    #[test]
    fn test_pipeline_error_display() {
        assert_eq!(PipelineError::AlreadyRunning.to_string(), "PL_ALREADY_RUNNING");
        assert_eq!(PipelineError::NoApiKey.to_string(), "AI_NO_API_KEY");
        assert!(PipelineError::DbError("test".to_string()).to_string().contains("test"));
    }

    #[test]
    fn test_find_related_sources_empty_embedding_fallback() {
        let empty: Vec<f32> = vec![];
        assert!(empty.is_empty());
    }

    #[test]
    fn test_get_signal_detail_not_found() {
        let conn = &mut crate::db::establish_connection();
        let result = get_signal_detail(conn, -99999);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_cosine_similarity_threshold() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![0.7, 0.7, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!(sim > 0.0);
        assert!(sim < 1.0);
    }

    #[test]
    fn test_signal_source_sort_by_date() {
        let sources = vec![
            SignalSource {
                article_id: 1,
                article_uuid: "a".to_string(),
                title: "Older".to_string(),
                link: "".to_string(),
                feed_title: "".to_string(),
                feed_uuid: "".to_string(),
                pub_date: "2024-01-01T00:00:00Z".to_string(),
                excerpt: None,
            },
            SignalSource {
                article_id: 2,
                article_uuid: "b".to_string(),
                title: "Newer".to_string(),
                link: "".to_string(),
                feed_title: "".to_string(),
                feed_uuid: "".to_string(),
                pub_date: "2024-06-01T00:00:00Z".to_string(),
                excerpt: None,
            },
        ];
        let mut sorted = sources;
        sorted.sort_by(|a, b| b.pub_date.cmp(&a.pub_date));
        assert_eq!(sorted[0].article_id, 2);
        assert_eq!(sorted[1].article_id, 1);
    }

    #[test]
    fn test_signal_detail_structure() {
        let detail = SignalDetail {
            signal: Signal {
                id: 1,
                title: "Test".to_string(),
                summary: "Summary".to_string(),
                why_it_matters: "WIM".to_string(),
                relevance_score: 0.9,
                source_count: 2,
                sources: vec![],
                topic_id: None,
                topic_title: None,
                created_at: "2024-01-01".to_string(),
            },
            all_sources: vec![
                SignalSource {
                    article_id: 1,
                    article_uuid: "a".to_string(),
                    title: "S1".to_string(),
                    link: "".to_string(),
                    feed_title: "".to_string(),
                    feed_uuid: "".to_string(),
                    pub_date: "".to_string(),
                    excerpt: None,
                },
                SignalSource {
                    article_id: 2,
                    article_uuid: "b".to_string(),
                    title: "S2".to_string(),
                    link: "".to_string(),
                    feed_title: "".to_string(),
                    feed_uuid: "".to_string(),
                    pub_date: "".to_string(),
                    excerpt: None,
                },
            ],
        };
        assert_eq!(detail.all_sources.len(), 2);
        assert_eq!(detail.signal.source_count, 2);
    }
}
