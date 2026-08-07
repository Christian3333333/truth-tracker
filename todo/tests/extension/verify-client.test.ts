import { describe, expect, it, vi } from "vitest";
import { postVerify } from "@/extension/lib/verify-client";
import {
  SAN_MIGUEL_REPORT,
  SAN_MIGUEL_TRANSCRIPT,
} from "@/tests/fixtures/san-miguel";

describe("postVerify", () => {
  it("POSTs transcript to backend /api/verify and returns VerificationReport", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(SAN_MIGUEL_REPORT, { status: 200 }),
    );

    const report = await postVerify(
      "http://localhost:3000",
      { transcript: SAN_MIGUEL_TRANSCRIPT },
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/api/verify",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: SAN_MIGUEL_TRANSCRIPT }),
      }),
    );
    expect(report.correcta.length).toBeGreaterThan(0);
    expect(report.falsa.length).toBeGreaterThan(0);
    expect(report.sin_evidencia.length).toBeGreaterThan(0);
    expect(report.selectiva.resultado).toMatch(/^(Sí|No)$/);
    expect(report.analisis_medidas.medidas_propuestas.length).toBeGreaterThan(
      0,
    );
  });

  it("throws a clear error when backend responds non-OK", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: "backend caído" }, { status: 503 }),
    );

    await expect(
      postVerify("http://localhost:3000", { transcript: "x" }, fetchImpl),
    ).rejects.toThrow(/503|backend|error/i);
  });
});
