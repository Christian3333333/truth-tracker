import type {
  ClassifyInput,
  SearchHit,
  VerificationDeps,
  VerificationReport,
} from "@/lib/verification/types";
import { verificationReportSchema } from "@/lib/verification/schema";

export class VerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerificationError";
  }
}

export async function runVerification(
  input: { transcript?: string; audioBase64?: string },
  deps: VerificationDeps,
): Promise<VerificationReport> {
  let transcript = input.transcript?.trim();

  if (!transcript && input.audioBase64?.trim()) {
    transcript = (await deps.transcribe(input.audioBase64)).trim();
  }

  if (!transcript) {
    throw new VerificationError(
      "Se requiere transcript o audioBase64 para iniciar la verificación.",
    );
  }

  const claims = await deps.extractClaims(transcript);
  const evidence = await Promise.all(
    claims.map(async (claim) => ({
      claim,
      hits: await deps.searchEvidence(claim),
    })),
  );

  const report = await deps.classifyReport({
    transcript,
    claims,
    evidence,
  });

  return verificationReportSchema.parse(report);
}

export function createMockSearchHits(query: string): SearchHit[] {
  return [
    {
      title: `Resultado para ${query}`,
      url: "https://example.com/search",
      content: "Evidencia simulada.",
    },
  ];
}

export type { ClassifyInput, VerificationDeps, VerificationReport };
