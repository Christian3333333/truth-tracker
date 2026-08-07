import { postVerify as defaultPostVerify } from "./verify-client";
import {
  persistReport,
  setVerificationStatus,
  type ExtensionStorage,
} from "./storage";
import type { VerificationReport, VerifyRequestBody } from "./types";

export interface VerifyFlowDeps {
  storage: ExtensionStorage;
  transcript: string;
  backendUrl: string;
  reelUrl?: string;
  postVerify?: (
    backendUrl: string,
    body: VerifyRequestBody,
  ) => Promise<VerificationReport>;
  notifyReportReady: (report: VerificationReport) => Promise<void>;
}

export async function runManualVerification(
  deps: VerifyFlowDeps,
): Promise<VerificationReport> {
  const postVerify = deps.postVerify ?? defaultPostVerify;
  await setVerificationStatus(deps.storage, "verifying");

  try {
    const report = await postVerify(deps.backendUrl, {
      transcript: deps.transcript,
      reelUrl: deps.reelUrl,
    });
    await persistReport(deps.storage, report);
    await setVerificationStatus(deps.storage, "idle");
    await deps.notifyReportReady(report);
    return report;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error de verificación";
    await setVerificationStatus(deps.storage, "error", message);
    throw error;
  }
}
