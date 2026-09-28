/**
 * 轻量路由足迹：壳层逐次路由记录，供 esc / 返回键「回到上一页」。
 *
 * 只压栈不弹栈：返回导航本身也会被记录，离开页被重新压到栈顶，
 * 因此栈顶永远是「进入当前页之前所在的页面」，peek 即所得。
 */
const trail: string[] = [];

export function recordNav(key: string): void {
  if (trail[trail.length - 1] === key) return;
  trail.push(key);
  if (trail.length > 64) trail.shift();
}

/** 当前页之前最近的一次路由；没有足迹（如启动直达）返回 undefined */
export function lastNavFrom(key: string): string | undefined {
  for (let i = trail.length - 1; i >= 0; i--) {
    if (trail[i] !== key) return trail[i];
  }
  return undefined;
}
