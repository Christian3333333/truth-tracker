import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createVerifyHandler } from "@/app/api/verify/route";
import type { VerificationDeps } from "@/lib/verification/types";
import {
  SAN_MIGUEL_REPORT,
  SAN_MIGUEL_TRANSCRIPT,
} from "@/tests/fixtures/san-miguel";

function createMockDeps(
  overrides: Partial<VerificationDeps> = {},
): VerificationDeps {
  return {
    transcribe: vi.fn(async () => SAN_MIGUEL_TRANSCRIPT),
    extractClaims: vi.fn(async () => [
      "3000 extorsiones en San Miguel",
      "asaltos por venezolanos en moto",
      "instalar más cámaras",
      "sacar más policías",
    ]),
    searchEvidence: vi.fn(async (query) => [
      {
        title: `Resultado para ${query}`,
        url: "https://example.com/search",
        content: "Evidencia simulada para pruebas.",
      },
    ]),
    classifyReport: vi.fn(async () => SAN_MIGUEL_REPORT),
    ...overrides,
  };
}

async function postVerify(
  handler: ReturnType<typeof createVerifyHandler>,
  body: unknown,
) {
  const request = new NextRequest("http://localhost:3000/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return handler(request);
}

describe("POST /api/verify", () => {
  it("returns 400 when body is empty or missing transcript and audio", async () => {
    const POST = createVerifyHandler(() => createMockDeps());

    const emptyResponse = await postVerify(POST, {});
    expect(emptyResponse.status).toBe(400);
    expect(await emptyResponse.json()).toMatchObject({
      error: expect.stringContaining("transcript"),
    });

    const blankResponse = await postVerify(POST, {
      transcript: "   ",
      audioBase64: "",
    });
    expect(blankResponse.status).toBe(400);
  });

  it("returns VerificationReport with all sections for San Miguel transcript", async () => {
    const deps = createMockDeps();
    const POST = createVerifyHandler(() => deps);

    const response = await postVerify(POST, {
      transcript: SAN_MIGUEL_TRANSCRIPT,
    });

    expect(response.status).toBe(200);
    const report = await response.json();

    expect(report.correcta.length).toBeGreaterThan(0);
    expect(report.falsa.length).toBeGreaterThan(0);
    expect(report.sin_evidencia.length).toBeGreaterThan(0);
    expect(report.selectiva.resultado).toMatch(/^(Sí|No)$/);
    expect(report.selectiva.explicacion).toBeTruthy();
    expect(report.analisis_medidas.medidas_propuestas.length).toBeGreaterThan(
      0,
    );
    expect(typeof report.analisis_medidas.efectivas).toBe("boolean");
    expect(report.analisis_medidas.razon).toBeTruthy();
    expect(report.analisis_medidas.fuentes.length).toBeGreaterThan(0);

    expect(deps.extractClaims).toHaveBeenCalledWith(SAN_MIGUEL_TRANSCRIPT);
    expect(deps.classifyReport).toHaveBeenCalledOnce();
  });

  it("transcribes audio via Deepgram path when transcript is absent", async () => {
    const deps = createMockDeps();
    const POST = createVerifyHandler(() => deps);

    const response = await postVerify(POST, {
      audioBase64: "ZGF0YQ==",
    });

    expect(response.status).toBe(200);
    expect(deps.transcribe).toHaveBeenCalledWith("ZGF0YQ==");
    expect(deps.extractClaims).toHaveBeenCalledWith(SAN_MIGUEL_TRANSCRIPT);

    const report = await response.json();
    expect(report.sin_evidencia.some((item: { afirmacion: string }) =>
      item.afirmacion.toLowerCase().includes("venezol"),
    )).toBe(true);
  });
});
