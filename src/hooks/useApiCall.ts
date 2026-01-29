import { useState, useCallback } from "react";

/**
 * 通用的 API 调用 Hook，用于管理异步请求的 loading 状态和错误处理
 *
 * @template T - API 返回的数据类型
 * @template P - API 请求的参数类型
 *
 * @returns {UseApiCallReturn<T>} 包含 data、loading、error 和 execute 函数的对象
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useApiCall(
 *   async (id: string) => {
 *     return await request.get(`/articles/${id}`);
 *   }
 * );
 *
 * // 触发 API 调用
 * useEffect(() => {
 *   if (id) {
 *     execute(id);
 *   }
 * }, [id]);
 * ```
 */
export function useApiCall<T, P = void>(
  asyncFn: (params: P) => Promise<T>,
): {
  /** API 返回的数据 */
  data: T | null;
  /** 请求是否正在进行中 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 执行 API 调用的函数 */
  execute: (params: P) => Promise<void>;
  /** 重置状态（data、loading、error） */
  reset: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (params: P) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn(params);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [asyncFn],
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
