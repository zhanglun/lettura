import { useEffect, useState } from "react";

/**
 * 防抖 Hook，延迟执行函数直到调用停止指定的毫秒数
 *
 * @template T - 防抖值的类型
 *
 * @param {T} value - 需要防抖的值
 * @param {number} delay - 延迟时间（毫秒）
 *
 * @returns {T} 防抖后的值
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 *
 * return (
 *   <input
 *     type="text"
 *     value={searchTerm}
 *     onChange={(e) => setSearchTerm(e.target.value)}
 *     placeholder="搜索..."
 *   />
 * );
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
