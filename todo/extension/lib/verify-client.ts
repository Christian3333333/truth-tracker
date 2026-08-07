import type { VerificationReport, VerifyRequestBody } from "./types";

export type FetchLike = typeof fetch;

function normalizeBackendUrl(backendUrl: string): string {
  return backendUrl.replace(/\/+$/, "");
}

export async function postVerify(
  backendUrl: string,
  body: VerifyRequestBody,
  fetchImpl: FetchLike = fetch,
): Promise<VerificationReport> {
  const url = `${normalizeBackendUrl(backendUrl)}/api/verify`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const payload = (await response.json()) as { error?: string };
      detail = payload.error ? `: ${payload.error}` : "";
    } catch {
      // ignore parse errors
    }
    throw new Error(`Error de verificación (${response.status})${detail}`);
  }

  return (await response.json()) as VerificationReport;
}
