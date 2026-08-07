import { describe, expect, it } from "vitest";
import { buildSidePanelHtml } from "@/extension/lib/render-report";
import { SAN_MIGUEL_REPORT } from "@/tests/fixtures/san-miguel";

describe("buildSidePanelHtml", () => {
  it("renders Soft Atelier Glow sections with category badges and source links", () => {
    const html = buildSidePanelHtml(SAN_MIGUEL_REPORT);

    expect(html).toContain('data-tt-category="correcta"');
    expect(html).toContain('data-tt-category="falsa"');
    expect(html).toContain('data-tt-category="sin_evidencia"');
    expect(html).toContain('data-tt-category="selectiva"');
    expect(html).toContain('data-tt-category="analisis_medidas"');

    expect(html).toContain("tt-badge--correcta");
    expect(html).toContain("tt-badge--falsa");
    expect(html).toContain("tt-badge--sin-evidencia");
    expect(html).toContain("tt-badge--selectiva");
    expect(html).toContain("tt-badge--medidas");

    expect(html).toContain("Correcta");
    expect(html).toContain("Falsa");
    expect(html).toContain("Sin evidencia");
    expect(html).toContain("Selectiva");
    expect(html).toContain("Análisis de medidas");
    expect(html).toContain("tt-brand");

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
