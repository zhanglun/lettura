//! 全局限速：B 站接口对请求节奏敏感，任何 API 请求之间强制 ≥3 秒间隔。
//! 实现是「上次请求时刻 + 循环重试」：先到先占档期，后来者睡满剩余间隔，
//! 醒来重查（防止并发任务同时通过）。

use std::sync::Mutex;
use std::time::{Duration, Instant};

use once_cell::sync::Lazy;

/// 请求最小间隔：拉动态和取 wbi 密钥都从这道闸走
const MIN_INTERVAL: Duration = Duration::from_secs(3);

/// 上一次请求（占档）的时刻；None = 从未请求过
static LAST_REQUEST: Lazy<Mutex<Option<Instant>>> = Lazy::new(|| Mutex::new(None));

/// 纯逻辑：可立即发则记录时刻并返回零；否则返回要等的时长且不动档期
/// （等醒来的循环重查决定谁先占位）。now 早于 last 视为时钟异常，放行。
fn reserve(last: &mut Option<Instant>, now: Instant) -> Duration {
  match *last {
    None => {
      *last = Some(now);
      Duration::ZERO
    }
    Some(t) => match now.checked_duration_since(t) {
      None => Duration::ZERO,
      Some(elapsed) if elapsed >= MIN_INTERVAL => {
        *last = Some(now);
        Duration::ZERO
      }
      Some(elapsed) => MIN_INTERVAL - elapsed,
    },
  }
}

/// 每次调 B 站 API 前调用：保证全局任意两次请求间隔 ≥3 秒
pub async fn pace() {
  loop {
    // Guard 在语句末即释放，不会跨 await 持锁
    let wait = reserve(&mut *LAST_REQUEST.lock().unwrap(), Instant::now());
    if wait.is_zero() {
      return;
    }
    tokio::time::sleep(wait).await;
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn first_request_passes_then_gap_enforced() {
    let t0 = Instant::now();
    let mut last = None;

    assert_eq!(reserve(&mut last, t0), Duration::ZERO);
    assert_eq!(last, Some(t0));

    // 2 秒后到达：还要等 1 秒，档期不动
    assert_eq!(
      reserve(&mut last, t0 + Duration::from_secs(2)),
      Duration::from_secs(1)
    );
    assert_eq!(last, Some(t0));

    // 满 3 秒：立即放行并记录新档期
    assert_eq!(
      reserve(&mut last, t0 + Duration::from_secs(3)),
      Duration::ZERO
    );
    assert_eq!(last, Some(t0 + Duration::from_secs(3)));
  }

  #[test]
  fn clock_backwards_is_treated_as_ready() {
    let t0 = Instant::now();
    let mut last = Some(t0 + Duration::from_secs(10));
    assert_eq!(reserve(&mut last, t0), Duration::ZERO);
  }
}
