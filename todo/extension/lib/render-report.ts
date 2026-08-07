import type {
  CorrectClaim,
  FalseClaim,
  MeasuresAnalysis,
  SelectiveAnalysis,
  UnverifiableClaim,
  VerificationReport,
} from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sourceLink(label: string, url?: string): string {
  const safeLabel = escapeHtml(label);
  if (!url) {
    return `<span class="tt-source">${safeLabel}</span>`;
  }
  return `<a class="tt-source" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
}

function renderCorrecta(items: CorrectClaim[]): string {
  const rows = items
    .map(
      (item) => `
      <article class="tt-claim">
        <p class="tt-claim-text">${escapeHtml(item.afirmacion)}</p>
        <p class="tt-claim-meta">Fuente: ${sourceLink(item.fuente, item.url)}</p>
      </article>`,
    )
    .join("");
  return `<section class="tt-section"><h2>Correcta</h2>${rows || "<p>Ninguna</p>"}</section>`;
}

function renderFalsa(items: FalseClaim[]): string {
  const rows = items
    .map(
      (item) => `
      <article class="tt-claim">
        <p class="tt-claim-text">${escapeHtml(item.afirmacion)}</p>
        <p class="tt-claim-meta">${escapeHtml(item.explicacion)}</p>
        <p class="tt-claim-meta">Fuente: ${sourceLink(item.fuente, item.url)}</p>
      </article>`,
    )
    .join("");
  return `<section class="tt-section"><h2>Falsa</h2>${rows || "<p>Ninguna</p>"}</section>`;
}

function renderSinEvidencia(items: UnverifiableClaim[]): string {
  const rows = items
    .map(
      (item) => `
      <article class="tt-claim">
        <p class="tt-claim-text">${escapeHtml(item.afirmacion)}</p>
        <p class="tt-claim-meta">${escapeHtml(item.nota)}</p>
      </article>`,
    )
    .join("");
  return `<section class="tt-section"><h2>Sin evidencia</h2>${rows || "<p>Ninguna</p>"}</section>`;
}

function renderSelectiva(selectiva: SelectiveAnalysis): string {
  return `<section class="tt-section">
    <h2>Selectiva</h2>
    <p class="tt-claim-text"><strong>${escapeHtml(selectiva.resultado)}</strong></p>
    <p class="tt-claim-meta">${escapeHtml(selectiva.explicacion)}</p>
  </section>`;
}

function measureSourceItem(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return `<li>${sourceLink(trimmed, trimmed)}</li>`;
  }
  return `<li><span class="tt-source">${escapeHtml(value)}</span></li>`;
}

function renderMedidas(analisis: MeasuresAnalysis): string {
  const medidas = analisis.medidas_propuestas
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("");
  const fuentes = analisis.fuentes.map(measureSourceItem).join("");
  return `<section class="tt-section">
    <h2>Análisis de medidas</h2>
    <ul>${medidas}</ul>
    <p class="tt-claim-text">Efectivas: ${analisis.efectivas ? "Sí" : "No"}</p>
    <p class="tt-claim-meta">${escapeHtml(analisis.razon)}</p>
    <p class="tt-claim-meta">Fuentes:</p>
    <ul>${fuentes}</ul>
  </section>`;
}

/** Builds inner HTML for the Instagram side panel (P3). */
export function buildSidePanelHtml(report: VerificationReport): string {
  return `
    <header class="tt-panel-header">
      <h1>Truth Tracker</h1>
      <button type="button" class="tt-close" data-tt-close="true" aria-label="Cerrar">Cerrar</button>
    </header>
    <div class="tt-panel-body">
      ${renderCorrecta(report.correcta)}
      ${renderFalsa(report.falsa)}
      ${renderSinEvidencia(report.sin_evidencia)}
      ${renderSelectiva(report.selectiva)}
      ${renderMedidas(report.analisis_medidas)}
    </div>
  `;
}
