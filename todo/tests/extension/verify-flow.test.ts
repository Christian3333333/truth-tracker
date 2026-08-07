import { describe, expect, it, vi } from "vitest";
import {
  runManualVerification,
  runVerification,
} from "@/extension/lib/verify-flow";
import {
  createMemoryStorage,
  readPersistedReport,
} from "@/extension/lib/storage";
import {
  SAN_MIGUEL_REPORT,
  SAN_MIGUEL_TRANSCRIPT,
} from "@/tests/fixtures/san-miguel";

describe("runManualVerification", () => {
  it("verifies transcript, persists report, and notifies content script", async () => {
    const storage = createMemoryStorage();
    const notifyReportReady = vi.fn(async () => undefined);
    const postVerify = vi.fn(async () => SAN_MIGUEL_REPORT);

    const report = await runManualVerification({
      storage,
      transcript: SAN_MIGUEL_TRANSCRIPT,
      backendUrl: "http://localhost:3000",
      postVerify,
      notifyReportReady,
    });

    expect(postVerify).toHaveBeenCalledWith("http://localhost:3000", {
      transcript: SAN_MIGUEL_TRANSCRIPT,
    });
    expect(await readPersistedReport(storage)).toEqual(SAN_MIGUEL_REPORT);
    expect(notifyReportReady).toHaveBeenCalledWith(SAN_MIGUEL_REPORT);
    expect(report).toEqual(SAN_MIGUEL_REPORT);
  });

  it("stores error status when verification fails", async () => {
    const storage = createMemoryStorage();

    await expect(
      runManualVerification({
        storage,
        transcript: "x",
        backendUrl: "http://localhost:3000",
        postVerify: async () => {
          throw new Error("backend caído");
        },
        notifyReportReady: async () => undefined,
      }),
    ).rejects.toThrow(/backend caído/);

    const state = await storage.get(["verificationStatus", "verificationError"]);
    expect(state.verificationStatus).toBe("error");
    expect(String(state.verificationError)).toMatch(/backend caído/);
  });

  it("sends captured audio to the verification endpoint", async () => {
    const storage = createMemoryStorage();
    const postVerify = vi.fn(async () => SAN_MIGUEL_REPORT);

    await runVerification({
      storage,
      body: { audioBase64: "YXVkaW8=", reelUrl: "https://instagram.com/reel/demo" },
      backendUrl: "http://localhost:3000",
      postVerify,
      notifyReportReady: async () => undefined,
    });

    expect(postVerify).toHaveBeenCalledWith("http://localhost:3000", {
      audioBase64: "YXVkaW8=",
      reelUrl: "https://instagram.com/reel/demo",
    });
  });
});
