const DEFAULT_PORT = "3456";

function baseUrl() {
  const port = window.localStorage.getItem("port") || DEFAULT_PORT;
  return `http://127.0.0.1:${port}/api`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string, params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  return apiFetch<T>(`${path}${query.size ? `?${query}` : ""}`);
}

export function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string, params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  return apiFetch<T>(`${path}${query.size ? `?${query}` : ""}`, {
    method: "DELETE",
  });
}
