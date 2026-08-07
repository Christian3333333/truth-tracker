import { postVerify as defaultPostVerify } from "./verify-client";
import {
  persistReport,
  setVerificationStatus,
  type ExtensionStorage,
} from "./storage";
import type { VerificationReport, VerifyRequestBody } from "./types";

export interface VerifyFlowDeps {
  storage: ExtensionStorage;
  body: VerifyRequestBody;
  backendUrl: string;
  postVerify?: (
    backendUrl: string,
    body: VerifyRequestBody,
  ) => Promise<VerificationReport>;
  notifyReportReady: (report: VerificationReport) => Promise<void>;
}

export async function runVerification(
  deps: VerifyFlowDeps,
): Promise<VerificationReport> {
  const postVerify = deps.postVerify ?? defaultPostVerify;
  await setVerificationStatus(deps.storage, "verifying");

  try {
    const report = await postVerify(deps.backendUrl, {
      ...deps.body,
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

export async function runManualVerification(
  deps: Omit<VerifyFlowDeps, "body"> & { transcript: string; reelUrl?: string },
): Promise<VerificationReport> {
  const { transcript, reelUrl, ...flowDeps } = deps;
  return runVerification({
    ...flowDeps,
    body: { transcript, reelUrl },
  });
}
