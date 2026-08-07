import {
  DEFAULT_BACKEND_URL,
  STORAGE_KEYS,
  type VerificationReport,
  type VerificationStatus,
} from "./types";

export interface ExtensionStorage {
  get(keys: string | string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

/** In-memory storage for tests — same shape as chrome.storage.session. */
export function createMemoryStorage(
  initial: Record<string, unknown> = {},
): ExtensionStorage {
  const data = { ...initial };
  return {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys];
      const out: Record<string, unknown> = {};
      for (const key of list) {
        if (key in data) out[key] = data[key];
      }
      return out;
    },
    async set(items) {
      Object.assign(data, items);
    },
  };
}

export function chromeSessionStorage(): ExtensionStorage {
  return {
    get(keys) {
      return chrome.storage.session.get(keys);
    },
    set(items) {
      return chrome.storage.session.set(items);
    },
  };
}

export async function getBackendUrl(
  storage: ExtensionStorage,
): Promise<string> {
  const result = await storage.get(STORAGE_KEYS.backendUrl);
  const value = result[STORAGE_KEYS.backendUrl];
  if (typeof value === "string" && value.trim()) {
    return value.replace(/\/+$/, "");
  }
  return DEFAULT_BACKEND_URL;
}

export async function setBackendUrl(
  storage: ExtensionStorage,
  url: string,
): Promise<void> {
  await storage.set({
    [STORAGE_KEYS.backendUrl]: url.replace(/\/+$/, ""),
  });
}

export async function persistReport(
  storage: ExtensionStorage,
  report: VerificationReport,
): Promise<void> {
  await storage.set({
    [STORAGE_KEYS.verificationReport]: report,
    [STORAGE_KEYS.verificationStatus]: "idle" satisfies VerificationStatus,
    [STORAGE_KEYS.verificationError]: "",
    [STORAGE_KEYS.panelPending]: true,
  });
}

export async function readPersistedReport(
  storage: ExtensionStorage,
): Promise<VerificationReport | null> {
  const result = await storage.get(STORAGE_KEYS.verificationReport);
  const report = result[STORAGE_KEYS.verificationReport];
  if (!report || typeof report !== "object") return null;
  return report as VerificationReport;
}

export async function consumePendingReport(
  storage: ExtensionStorage,
): Promise<VerificationReport | null> {
  const result = await storage.get([
    STORAGE_KEYS.verificationReport,
    STORAGE_KEYS.panelPending,
  ]);
  if (result[STORAGE_KEYS.panelPending] !== true) return null;
  const report = result[STORAGE_KEYS.verificationReport];
  if (!report || typeof report !== "object") return null;
  await storage.set({ [STORAGE_KEYS.panelPending]: false });
  return report as VerificationReport;
}

export async function setVerificationStatus(
  storage: ExtensionStorage,
  status: VerificationStatus,
  error = "",
): Promise<void> {
  await storage.set({
    [STORAGE_KEYS.verificationStatus]: status,
    [STORAGE_KEYS.verificationError]: error,
  });
}
