import { createAnthropicLlmClient } from "@/lib/verification/clients/anthropic";
import { createDeepgramTranscriptionClient } from "@/lib/verification/clients/deepgram";
import { createTavilySearchClient } from "@/lib/verification/clients/tavily";
import type { VerificationDeps } from "@/lib/verification/types";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

export function createDefaultDeps(): VerificationDeps {
  const llm = createAnthropicLlmClient(requireEnv("ANTHROPIC_API_KEY"));
  const search = createTavilySearchClient(requireEnv("TAVILY_API_KEY"));
  const transcription = createDeepgramTranscriptionClient(
    requireEnv("DEEPGRAM_API_KEY"),
  );

  return {
    transcribe: (audioBase64) => transcription.transcribe(audioBase64),
    extractClaims: (transcript) => llm.extractClaims(transcript),
    searchEvidence: (query) => search.search(query),
    classifyReport: (input) => llm.classifyReport(input),
  };
}
