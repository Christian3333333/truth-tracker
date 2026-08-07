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

function sectionHeading(
  category: string,
  label: string,
  badgeClass: string,
): string {
  return `<div class="tt-section-heading">
    <span class="tt-badge ${badgeClass}">${escapeHtml(category)}</span>
    <h2>${escapeHtml(label)}</h2>
  </div>`;
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
  return `<section class="tt-section tt-section--correcta" data-tt-category="correcta">
    ${sectionHeading("Correcta", "Información correcta", "tt-badge--correcta")}
    ${rows || '<p class="tt-empty">Ninguna</p>'}
  </section>`;
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
  return `<section class="tt-section tt-section--falsa" data-tt-category="falsa">
    ${sectionHeading("Falsa", "Información falsa", "tt-badge--falsa")}
    ${rows || '<p class="tt-empty">Ninguna</p>'}
  </section>`;
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
  return `<section class="tt-section tt-section--sin-evidencia" data-tt-category="sin_evidencia">
    ${sectionHeading("Sin evidencia", "Sin evidencia verificable", "tt-badge--sin-evidencia")}
    ${rows || '<p class="tt-empty">Ninguna</p>'}
  </section>`;
}

function renderSelectiva(selectiva: SelectiveAnalysis): string {
  return `<section class="tt-section tt-section--selectiva" data-tt-category="selectiva">
    ${sectionHeading("Selectiva", "Selectividad", "tt-badge--selectiva")}
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
  return `<section class="tt-section tt-section--medidas" data-tt-category="analisis_medidas">
    ${sectionHeading("Medidas", "Análisis de medidas", "tt-badge--medidas")}
    <ul class="tt-list">${medidas}</ul>
    <p class="tt-claim-text">Efectivas: ${analisis.efectivas ? "Sí" : "No"}</p>
    <p class="tt-claim-meta">${escapeHtml(analisis.razon)}</p>
    <p class="tt-claim-meta">Fuentes:</p>
    <ul class="tt-list tt-list--sources">${fuentes}</ul>
  </section>`;
}

/** Builds inner HTML for the Instagram side panel (P3 / Soft Atelier Glow). */
export function buildSidePanelHtml(report: VerificationReport): string {
  return `
    <header class="tt-panel-header">
      <h1 class="tt-brand">
        <span class="tt-brand-strong">Truth</span>
        <span class="tt-brand-mid">Tracker</span>
      </h1>
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
