import { getToken } from "./token";

export interface ApiClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  delete<T>(path: string, init?: RequestInit): Promise<T>;
}

export function createClient(baseUrl: string): ApiClient {
  const base = baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${base}${path.startsWith("/") ? path : "/" + path}`;
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  return {
    get: (path, init) => request(path, { ...init, method: "GET" }),
    post: (path, body, init) => request(path, { ...init, method: "POST", body: body ? JSON.stringify(body) : undefined }),
    put: (path, body, init) => request(path, { ...init, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
    patch: (path, body, init) => request(path, { ...init, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
    delete: (path, init) => request(path, { ...init, method: "DELETE" }),
  };
}

export default createClient(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");