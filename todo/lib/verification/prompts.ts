export const EXTRACT_CLAIMS_SYSTEM = `Eres un analista de fact-checking. Extrae afirmaciones verificables del guión de un reel.
Responde SOLO con JSON válido: un array de strings en español, sin markdown.
Cada string debe ser una afirmación concreta que pueda verificarse con fuentes públicas.`;

export function buildExtractClaimsPrompt(transcript: string): string {
  return `Guión del reel:\n"""${transcript}"""\n\nExtrae las afirmaciones verificables como JSON array de strings.`;
}

export const CLASSIFY_REPORT_SYSTEM = `Eres un verificador de hechos en español. Clasifica afirmaciones usando la evidencia proporcionada.
Responde SOLO con JSON válido que cumpla este esquema:
{
  "correcta": [{ "afirmacion": string, "fuente": string, "url"?: string }],
  "falsa": [{ "afirmacion": string, "fuente": string, "explicacion": string, "url"?: string }],
  "sin_evidencia": [{ "afirmacion": string, "nota": string }],
  "selectiva": { "resultado": "Sí" | "No", "explicacion": string },
  "analisis_medidas": {
    "medidas_propuestas": string[],
    "efectivas": boolean,
    "razon": string,
    "fuentes": string[]
  }
}
Reglas:
- Afirmaciones sin fuentes confiables van en sin_evidencia, NO en falsa.
- El informe debe estar completo aunque falte evidencia para algunas afirmaciones.
- Todo el texto debe estar en español.`;

export function buildClassifyPrompt(input: {
  transcript: string;
  claims: string[];
  evidence: Array<{ claim: string; hits: Array<{ title: string; url: string; content: string }> }>;
}): string {
  const evidenceBlock = input.evidence
    .map(
      ({ claim, hits }) =>
        `Afirmación: ${claim}\nEvidencia:\n${hits
          .map(
            (hit, index) =>
              `${index + 1}. ${hit.title} (${hit.url})\n${hit.content}`,
          )
          .join("\n") || "Sin resultados"}`,
    )
    .join("\n\n");

  return `Guión completo:\n"""${input.transcript}"""\n\nAfirmaciones extraídas:\n${input.claims.map((claim, index) => `${index + 1}. ${claim}`).join("\n")}\n\nEvidencia de búsqueda:\n${evidenceBlock}\n\nGenera el informe de verificación JSON.`;
}
