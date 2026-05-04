use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use diesel::prelude::*;
use log::{debug, error, info, warn};

use crate::core::config;
use crate::db;
use crate::feed::channel;
use crate::models;
use crate::schema;

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

  pub async fn start(&self) {
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
      let mut interval = tokio::time::interval(Duration::from_secs(interval_secs));

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

        match Self::get_all_feeds() {
          Ok(feeds) => {
            debug!("Found {} feeds to sync", feeds.len());

            let semaphore = Arc::new(tokio::sync::Semaphore::new(threads));
            let mut tasks = Vec::new();

            for feed in feeds {
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
              let failed_feeds = failed_feeds.clone();

              tasks.push(tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();

                debug!("Syncing feed: {}", feed_uuid);

                match channel::sync_articles(feed_uuid.clone()).await {
                  result => {
                    if let Some((_, _, error_msg)) = result.get(&feed_uuid) {
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
                    }
                  }
                }
              }));
            }

            for task in tasks {
              if let Err(e) = task.await {
                error!("Task failed: {}", e);
              }
            }

            info!("Sync cycle completed");

            crate::ai::pipeline::spawn_pipeline_if_configured(None);
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
pub async fn start_scheduler() {
  info!("start_scheduler command called");
  GLOBAL_SCHEDULER.start().await;
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
