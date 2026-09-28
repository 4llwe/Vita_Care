const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_URL =
  typeof window === "undefined"
    ? process.env.API_URL ?? PUBLIC_API_URL
    : PUBLIC_API_URL;
const REFRESH_GENERATION_KEY = "vitacare-refresh-generation";

export type ApiOptions = {
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
  _retried?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

function friendly(status: number, payload: any) {
  const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
  if (typeof message === "string" && message.length < 240) return message;
  if (status === 401) return "Sesi Anda telah berakhir. Silakan masuk kembali.";
  if (status === 403) return "Anda tidak memiliki izin untuk tindakan ini.";
  if (status === 404) return "Data yang diminta tidak ditemukan.";
  if (status >= 500) return "Layanan sedang mengalami gangguan. Silakan coba lagi.";
  return "Permintaan tidak dapat diproses.";
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function refreshGeneration(): number {
  try {
    return Number(window.localStorage.getItem(REFRESH_GENERATION_KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

function markRefreshComplete(): void {
  try {
    window.localStorage.setItem(
      REFRESH_GENERATION_KEY,
      String(refreshGeneration() + 1),
    );
  } catch {
    // Web Locks/session validation remain the fallback.
  }
}

async function performRefresh(): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  return response.ok;
}

async function sessionIsActive(): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });
  return response.ok;
}

type RefreshLock = { id: "refresh"; owner: string; until: number };

function openRefreshLockDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vitacare-auth", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("locks", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  });
}

function acquireRefreshLock(db: IDBDatabase, owner: string, until: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let acquired = false;
    const transaction = db.transaction("locks", "readwrite");
    const store = transaction.objectStore("locks");
    const read = store.get("refresh");
    read.onsuccess = () => {
      const current = read.result as RefreshLock | undefined;
      if (!current || current.until <= Date.now()) {
        store.put({ id: "refresh", owner, until });
        acquired = true;
      }
    };
    transaction.oncomplete = () => resolve(acquired);
    transaction.onerror = () => reject(transaction.error ?? new Error("Refresh lock failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Refresh lock aborted"));
  });
}

function releaseRefreshLock(db: IDBDatabase, owner: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("locks", "readwrite");
    const store = transaction.objectStore("locks");
    const read = store.get("refresh");
    read.onsuccess = () => {
      if ((read.result as RefreshLock | undefined)?.owner === owner) store.delete("refresh");
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Refresh lock release failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Refresh lock release aborted"));
  });
}

function waitForRefreshNotice(channel: BroadcastChannel | null, timeoutMs: number): Promise<boolean | null> {
  if (!channel) return Promise.resolve(null);
  const activeChannel = channel;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      activeChannel.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);
    function onMessage(event: MessageEvent<{ type?: string; ok?: boolean }>) {
      if (event.data?.type !== "refresh-complete") return;
      window.clearTimeout(timer);
      activeChannel.removeEventListener("message", onMessage);
      resolve(event.data.ok === true);
    }
    activeChannel.addEventListener("message", onMessage);
  });
}

async function refreshWithFallback(observedGeneration: number): Promise<boolean> {
  const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("vitacare-auth");
  const owner = crypto.randomUUID();
  const lockUntil = Date.now() + 15_000;
  let db: IDBDatabase | null = null;

  try {
    db = await openRefreshLockDb();
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (await acquireRefreshLock(db, owner, lockUntil)) {
        if (refreshGeneration() > observedGeneration) return true;
        if (await sessionIsActive()) return true;
        const ok = await performRefresh();
        if (ok) markRefreshComplete();
        channel?.postMessage({ type: "refresh-complete", ok });
        return ok;
      }
      const notice = await waitForRefreshNotice(channel, 100);
      if (notice !== null) return notice;
      await wait(50 + Math.floor(Math.random() * 50));
    }
    return false;
  } finally {
    if (db) await releaseRefreshLock(db, owner).catch(() => undefined);
    db?.close();
    channel?.close();
  }
}

async function refreshOnce(observedGeneration: number): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  const locks = (navigator as unknown as {
    locks?: { request: <T>(name: string, callback: () => Promise<T>) => Promise<T> };
  }).locks;

  refreshPromise = locks
    ? locks.request("vitacare-refresh", async () => {
        if (refreshGeneration() > observedGeneration) return true;
        if (await sessionIsActive()) return true;
        const ok = await performRefresh();
        if (ok) markRefreshComplete();
        return ok;
      })
    : refreshWithFallback(observedGeneration);

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const observedRefreshGeneration = refreshGeneration();
  const response = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
  });

  if (response.status === 401 && !options.token && !options._retried && path !== "/auth/refresh") {
    if (await refreshOnce(observedRefreshGeneration)) return api<T>(path, { ...options, _retried: true });
  }
  if (!response.ok) throw new Error(friendly(response.status, await response.json().catch(() => null)));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export { API_URL };
