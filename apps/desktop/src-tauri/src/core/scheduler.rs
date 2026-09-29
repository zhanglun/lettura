use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use diesel::prelude::*;
use log::{debug, error, info, warn};
use tauri::Emitter;

use crate::core::config;
use crate::db;
use crate::feed::channel;
use crate::models;
use crate::schema;

/// 单源同步完成的事件名：前端据此刷新未读/订阅树，
/// 不再纯靠 HTTP 轮询感知后台同步（慢源尤其需要）。
pub const SYNC_COMPLETED_EVENT: &str = "sync://completed";

#[derive(Clone, serde::Serialize)]
struct SyncCompletedEvent {
  uuid: String,
  title: String,
  inserted: usize,
  error: String,
}

#[derive(Debug, Clone)]
pub enum SchedulerState {
  Running,
  Stopped,
}

#[derive(Debug)]
pub struct Scheduler {
  state: Arc<Mutex<SchedulerState>>,
  interval: u64,
  failed_feeds: Arc<Mutex<HashMap<String, (u32, u64)>>>,
}

impl Scheduler {
  pub fn new() -> Self {
    Scheduler {
      state: Arc::new(Mutex::new(SchedulerState::Stopped)),
      interval: 0,
      failed_feeds: Arc::new(Mutex::new(HashMap::new())),
    }
  }

  pub fn init() -> Self {
    let scheduler = Self::new();
    info!("Scheduler initialized");
    scheduler
  }

  pub async fn start(&self, app: tauri::AppHandle) {
    let mut state = self.state.lock().unwrap();
    if let SchedulerState::Running = *state {
      warn!("Scheduler is already running");
      return;
    }
    *state = SchedulerState::Running;
    drop(state);

    info!("Starting scheduler");

    let user_config = config::get_user_config();
    let interval_secs = user_config.update_interval;

    if interval_secs == 0 {
      warn!("Sync interval is 0, scheduler will not run automatically");
      return;
    }

    let state = self.state.clone();
    let failed_feeds = self.failed_feeds.clone();

    tokio::spawn(async move {
      // 到期驱动的 tick：每分钟醒来查一次"谁到期了"。
      // 单源节奏 = feeds.sync_interval（源级，>0 时生效，慢源如邮件用大间隔）
      // 否则回落全局 update_interval。
      let mut interval = tokio::time::interval(Duration::from_secs(60));

      loop {
        {
          let state = state.lock().unwrap();
          if let SchedulerState::Stopped = *state {
            info!("Scheduler stopped");
            break;
          }
        }

        interval.tick().await;

        let user_config = config::get_user_config();

        if !user_config.background_sync {
          debug!("Background sync disabled, skipping tick");
          continue;
        }

        let threads = user_config.threads.max(1) as usize;
        let now = chrono::Local::now().naive_local();

        match Self::get_all_feeds() {
          Ok(feeds) => {
            let due: Vec<models::Feed> = feeds
              .into_iter()
              .filter(|feed| Self::is_due(feed, user_config.update_interval, now))
              .collect();
            debug!("Found {} due feeds to sync", due.len());

            let semaphore = Arc::new(tokio::sync::Semaphore::new(threads));
            let mut tasks = Vec::new();

            for feed in due {
              let should_skip = {
                let mut failed = failed_feeds.lock().unwrap();
                if let Some((_, backoff_until)) = failed.get(&feed.uuid) {
                  let now = chrono::Utc::now().timestamp_millis() as u64;
                  if now < *backoff_until {
                    debug!("Feed {} is in backoff period, skipping", feed.uuid);
                    true
                  } else {
                    failed.remove(&feed.uuid);
                    false
                  }
                } else {
                  false
                }
              };

              if should_skip {
                continue;
              }

              let semaphore = semaphore.clone();
              let feed_uuid = feed.uuid.clone();
              let feed_title = feed.title.clone();
              let failed_feeds = failed_feeds.clone();
              let app = app.clone();

              tasks.push(tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();

                debug!("Syncing feed: {}", feed_uuid);

                let result = channel::sync_articles(feed_uuid.clone()).await;

                if let Some((_, inserted, error_msg)) = result.get(&feed_uuid) {
                  if !error_msg.is_empty() {
                    error!("Failed to sync feed {}: {}", feed_uuid, error_msg);

                    let mut failed = failed_feeds.lock().unwrap();
                    let (count, _) = failed.get(&feed_uuid).unwrap_or(&(0, 0));
                    let new_count = count + 1;
                    let backoff_ms = Self::calculate_backoff(new_count);

                    let now = chrono::Utc::now().timestamp_millis() as u64;
                    failed.insert(feed_uuid.clone(), (new_count, now + backoff_ms));

                    warn!(
                      "Feed {} failed {} times, backoff for {}ms",
                      feed_uuid, new_count, backoff_ms
                    );
                  }

                  let _ = app.emit(
                    SYNC_COMPLETED_EVENT,
                    SyncCompletedEvent {
                      uuid: feed_uuid,
                      title: feed_title,
                      inserted: *inserted,
                      error: error_msg.clone(),
                    },
                  );
                }
              }));
            }

            for task in tasks {
              if let Err(e) = task.await {
                error!("Task failed: {}", e);
              }
            }

            info!("Sync cycle completed");
          }
          Err(e) => {
            error!("Failed to get feeds: {}", e);
          }
        }
      }
    });

    info!("Scheduler started successfully");
  }

  pub fn stop(&self) {
    let mut state = self.state.lock().unwrap();
    if let SchedulerState::Stopped = *state {
      warn!("Scheduler is already stopped");
      return;
    }
    *state = SchedulerState::Stopped;
    info!("Scheduler stop requested");
  }

  pub fn is_running(&self) -> bool {
    let state = self.state.lock().unwrap();
    matches!(*state, SchedulerState::Running)
  }

  fn get_all_feeds() -> Result<Vec<models::Feed>, String> {
    let mut connection = crate::db::establish_connection();
    let feeds = crate::schema::feeds::dsl::feeds
      .load::<models::Feed>(&mut connection)
      .map_err(|e| format!("Failed to load feeds: {}", e))?;

    Ok(feeds)
  }

  /// 单源到期判定：sync_interval（源级，>0 时生效）优先，否则全局 update_interval。
  /// last_sync_date 是 Local 时间的 "YYYY-MM-DD HH:MM:SS" 串（update_health_status 写入），
  /// 解析失败（从未同步）视为到期。
  fn is_due(feed: &models::Feed, default_interval_secs: u64, now: chrono::NaiveDateTime) -> bool {
    let interval = if feed.sync_interval > 0 {
      feed.sync_interval as u64
    } else {
      default_interval_secs
    };
    if interval == 0 {
      return false;
    }

    match chrono::NaiveDateTime::parse_from_str(&feed.last_sync_date, "%Y-%m-%d %H:%M:%S") {
      Ok(last) => (now - last).num_seconds() >= interval as i64,
      Err(_) => true,
    }
  }

  fn calculate_backoff(failure_count: u32) -> u64 {
    const BASE_MS: u64 = 1000;
    const MAX_MS: u64 = 3600000;

    let backoff = BASE_MS * 2_u64.pow(failure_count.min(12));
    backoff.min(MAX_MS)
  }
}

static GLOBAL_SCHEDULER: once_cell::sync::Lazy<Scheduler> =
  once_cell::sync::Lazy::new(|| Scheduler::init());

#[tauri::command]
pub async fn start_scheduler(app: tauri::AppHandle) {
  info!("start_scheduler command called");
  GLOBAL_SCHEDULER.start(app).await;
}

#[tauri::command]
pub fn stop_scheduler() {
  info!("stop_scheduler command called");
  GLOBAL_SCHEDULER.stop();
}

#[tauri::command]
pub fn is_scheduler_running() -> bool {
  GLOBAL_SCHEDULER.is_running()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_calculate_backoff() {
    assert_eq!(Scheduler::calculate_backoff(0), 1000);
    assert_eq!(Scheduler::calculate_backoff(1), 2000);
    assert_eq!(Scheduler::calculate_backoff(2), 4000);
    assert_eq!(Scheduler::calculate_backoff(3), 8000);
    assert_eq!(Scheduler::calculate_backoff(10), 1024000);
    assert_eq!(Scheduler::calculate_backoff(20), 3600000);
  }

  fn feed_with(last_sync_date: &str, sync_interval: i32) -> models::Feed {
    models::Feed {
      id: 1,
      uuid: "u".into(),
      title: "t".into(),
      link: String::new(),
      feed_url: String::new(),
      origin: "native".into(),
      description: String::new(),
      pub_date: String::new(),
      updated: String::new(),
      logo: String::new(),
      health_status: 0,
      failure_reason: String::new(),
      sort: 0,
      sync_interval,
      last_sync_date: last_sync_date.into(),
      create_date: String::new(),
      update_date: String::new(),
      source_id: None,
      carrier: "text".into(),
      provider: "rss".into(),
      account_uuid: None,
      source_config: None,
      unread_count: 0,
    }
  }

  #[test]
  fn test_is_due() {
    let now =
      chrono::NaiveDateTime::parse_from_str("2026-09-27 12:00:00", "%Y-%m-%d %H:%M:%S").unwrap();

    // 从未同步 → 到期
    assert!(Scheduler::is_due(&feed_with("", 0), 1800, now));
    assert!(Scheduler::is_due(&feed_with("not-a-date", 0), 1800, now));

    // 全局节奏：29 分钟前同步过（< 30min）→ 未到期；31 分钟前 → 到期
    assert!(!Scheduler::is_due(
      &feed_with("2026-09-27 11:31:00", 0),
      1800,
      now
    ));
    assert!(Scheduler::is_due(
      &feed_with("2026-09-27 11:29:00", 0),
      1800,
      now
    ));

    // 源级 sync_interval 覆盖全局：10 分钟节奏，5 分钟前同步过 → 未到期
    assert!(!Scheduler::is_due(
      &feed_with("2026-09-27 11:55:00", 600),
      1800,
      now
    ));
    assert!(Scheduler::is_due(
      &feed_with("2026-09-27 11:49:00", 600),
      1800,
      now
    ));

    // 全局 update_interval=0（关闭自动同步）且无源级节奏 → 永不到期
    assert!(!Scheduler::is_due(&feed_with("", 0), 0, now));
  }

  #[test]
  fn test_scheduler_initialization() {
    let scheduler = Scheduler::new();
    assert!(!scheduler.is_running());
  }

  #[test]
  fn test_scheduler_state() {
    let scheduler = Scheduler::new();
    assert!(!scheduler.is_running());
    scheduler.stop();
    assert!(!scheduler.is_running());
  }
}
