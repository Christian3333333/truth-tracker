import { describe, expect, it } from "vitest";
import {
  consumePendingReport,
  createMemoryStorage,
  getBackendUrl,
  persistReport,
  readPersistedReport,
  setBackendUrl,
  setVerificationStatus,
} from "@/extension/lib/storage";
import { SAN_MIGUEL_REPORT } from "@/tests/fixtures/san-miguel";
import { DEFAULT_BACKEND_URL } from "@/extension/lib/types";

describe("extension storage", () => {
  it("defaults backend URL to localhost and persists overrides", async () => {
    const storage = createMemoryStorage();
    expect(await getBackendUrl(storage)).toBe(DEFAULT_BACKEND_URL);

    await setBackendUrl(storage, "http://127.0.0.1:4000/");
    expect(await getBackendUrl(storage)).toBe("http://127.0.0.1:4000");
  });

  it("persists verificationReport for service worker ↔ content script handoff", async () => {
    const storage = createMemoryStorage();
    await persistReport(storage, SAN_MIGUEL_REPORT);
    await setVerificationStatus(storage, "idle");

    const loaded = await readPersistedReport(storage);
    expect(loaded).toEqual(SAN_MIGUEL_REPORT);

    const pending = await consumePendingReport(storage);
    expect(pending).toEqual(SAN_MIGUEL_REPORT);
    expect(await consumePendingReport(storage)).toBeNull();
  });
});
