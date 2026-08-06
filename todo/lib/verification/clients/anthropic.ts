import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  buildClassifyPrompt,
  buildExtractClaimsPrompt,
  CLASSIFY_REPORT_SYSTEM,
  EXTRACT_CLAIMS_SYSTEM,
} from "@/lib/verification/prompts";
import { verificationReportSchema } from "@/lib/verification/schema";
import type { ClassifyInput, VerificationReport } from "@/lib/verification/types";

const claimsSchema = z.array(z.string().min(1));

function parseJsonFromText<T>(text: string, schema: z.ZodType<T>): T {
  const trimmed = text.trim();
  const jsonText =
    trimmed.startsWith("```") ?
      trimmed.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    : trimmed;

  return schema.parse(JSON.parse(jsonText));
}

export interface LlmClient {
  extractClaims(transcript: string): Promise<string[]>;
  classifyReport(input: ClassifyInput): Promise<VerificationReport>;
}

export function createAnthropicLlmClient(apiKey: string): LlmClient {
  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";

  async function complete(system: string, user: string): Promise<string> {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("La respuesta del LLM no contiene texto.");
    }

    return textBlock.text;
  }

  return {
    async extractClaims(transcript) {
      const text = await complete(
        EXTRACT_CLAIMS_SYSTEM,
        buildExtractClaimsPrompt(transcript),
      );
      return parseJsonFromText(text, claimsSchema);
    },

    async classifyReport(input) {
      const text = await complete(
        CLASSIFY_REPORT_SYSTEM,
        buildClassifyPrompt(input),
      );
      return parseJsonFromText(text, verificationReportSchema);
    },
  };
}
