import { describe, expect, it } from "vitest";
import { buildSidePanelHtml } from "@/extension/lib/render-report";
import { SAN_MIGUEL_REPORT } from "@/tests/fixtures/san-miguel";

describe("buildSidePanelHtml", () => {
  it("renders all VerificationReport sections with Spanish labels and source links", () => {
    const html = buildSidePanelHtml(SAN_MIGUEL_REPORT);

    expect(html).toContain("Correcta");
    expect(html).toContain("Falsa");
    expect(html).toContain("Sin evidencia");
    expect(html).toContain("Selectiva");
    expect(html).toContain("Análisis de medidas");

    expect(html).toContain(SAN_MIGUEL_REPORT.correcta[0].afirmacion);
    expect(html).toContain(SAN_MIGUEL_REPORT.falsa[0].explicacion);
    expect(html).toContain(SAN_MIGUEL_REPORT.sin_evidencia[0].nota);
    expect(html).toContain(SAN_MIGUEL_REPORT.selectiva.resultado);
    expect(html).toContain(
      SAN_MIGUEL_REPORT.analisis_medidas.medidas_propuestas[0],
    );

    expect(html).toContain('href="https://example.com/pnp-extorsion"');
    expect(html).toContain('href="https://example.com/mininterior-stats"');
    expect(html).toContain(
      'href="https://example.com/seguridad-urbana-lima-2024"',
    );
    expect(html).toContain('data-tt-close="true"');
  });
});
