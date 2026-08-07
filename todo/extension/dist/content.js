// extension/lib/render-report.ts
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function sourceLink(label, url) {
  const safeLabel = escapeHtml(label);
  if (!url) {
    return `<span class="tt-source">${safeLabel}</span>`;
  }
  return `<a class="tt-source" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
}
function renderCorrecta(items) {
  const rows = items.map(
    (item) => `
      <article class="tt-claim">
        <p class="tt-claim-text">${escapeHtml(item.afirmacion)}</p>
        <p class="tt-claim-meta">Fuente: ${sourceLink(item.fuente, item.url)}</p>
      </article>`
  ).join("");
  return `<section class="tt-section"><h2>Correcta</h2>${rows || "<p>Ninguna</p>"}</section>`;
}
function renderFalsa(items) {
  const rows = items.map(
    (item) => `
      <article class="tt-claim">
        <p class="tt-claim-text">${escapeHtml(item.afirmacion)}</p>
        <p class="tt-claim-meta">${escapeHtml(item.explicacion)}</p>
        <p class="tt-claim-meta">Fuente: ${sourceLink(item.fuente, item.url)}</p>
      </article>`
  ).join("");
  return `<section class="tt-section"><h2>Falsa</h2>${rows || "<p>Ninguna</p>"}</section>`;
}
function renderSinEvidencia(items) {
  const rows = items.map(
    (item) => `
      <article class="tt-claim">
        <p class="tt-claim-text">${escapeHtml(item.afirmacion)}</p>
        <p class="tt-claim-meta">${escapeHtml(item.nota)}</p>
      </article>`
  ).join("");
  return `<section class="tt-section"><h2>Sin evidencia</h2>${rows || "<p>Ninguna</p>"}</section>`;
}
function renderSelectiva(selectiva) {
  return `<section class="tt-section">
    <h2>Selectiva</h2>
    <p class="tt-claim-text"><strong>${escapeHtml(selectiva.resultado)}</strong></p>
    <p class="tt-claim-meta">${escapeHtml(selectiva.explicacion)}</p>
  </section>`;
}
function measureSourceItem(value) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return `<li>${sourceLink(trimmed, trimmed)}</li>`;
  }
  return `<li><span class="tt-source">${escapeHtml(value)}</span></li>`;
}
function renderMedidas(analisis) {
  const medidas = analisis.medidas_propuestas.map((m) => `<li>${escapeHtml(m)}</li>`).join("");
  const fuentes = analisis.fuentes.map(measureSourceItem).join("");
  return `<section class="tt-section">
    <h2>An\xE1lisis de medidas</h2>
    <ul>${medidas}</ul>
    <p class="tt-claim-text">Efectivas: ${analisis.efectivas ? "S\xED" : "No"}</p>
    <p class="tt-claim-meta">${escapeHtml(analisis.razon)}</p>
    <p class="tt-claim-meta">Fuentes:</p>
    <ul>${fuentes}</ul>
  </section>`;
}
function buildSidePanelHtml(report) {
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

// extension/lib/caption-extraction.ts
var MIN_TRANSCRIPT_LENGTH = 20;
function normalizeCaption(value) {
  return value.replace(/\s+/g, " ").trim();
}
function selectCaptionCandidate(candidates) {
  const normalized = candidates.map(normalizeCaption).filter(Boolean);
  const caption = normalized.reduce(
    (longest, candidate) => candidate.length > longest.length ? candidate : longest,
    ""
  );
  return caption.length >= MIN_TRANSCRIPT_LENGTH ? caption : null;
}

// extension/lib/messages.ts
var MessageType = {
  MANUAL_VERIFY: "MANUAL_VERIFY",
  AUTO_VERIFY: "AUTO_VERIFY",
  TRIGGER_VERIFY: "TRIGGER_VERIFY",
  REPORT_READY: "REPORT_READY",
  OPEN_MANUAL_MODAL: "OPEN_MANUAL_MODAL",
  STATUS_CHANGED: "STATUS_CHANGED",
  VERIFY_ERROR: "VERIFY_ERROR"
};
function createManualVerifyMessage(transcript, reelUrl) {
  return { type: MessageType.MANUAL_VERIFY, transcript, reelUrl };
}
function createAutoVerifyMessage(reelUrl, transcript) {
  return { type: MessageType.AUTO_VERIFY, reelUrl, transcript };
}
function isExtensionMessage(value) {
  if (!value || typeof value !== "object") return false;
  const type = value.type;
  return type === MessageType.MANUAL_VERIFY || type === MessageType.AUTO_VERIFY || type === MessageType.TRIGGER_VERIFY || type === MessageType.REPORT_READY || type === MessageType.OPEN_MANUAL_MODAL || type === MessageType.STATUS_CHANGED || type === MessageType.VERIFY_ERROR;
}

// extension/lib/types.ts
var STORAGE_KEYS = {
  backendUrl: "backendUrl",
  verificationReport: "verificationReport",
  verificationStatus: "verificationStatus",
  verificationError: "verificationError",
  panelPending: "panelPending"
};

// extension/lib/storage.ts
function chromeSessionStorage() {
  return {
    get(keys) {
      return chrome.storage.session.get(keys);
    },
    set(items) {
      return chrome.storage.session.set(items);
    }
  };
}
async function consumePendingReport(storage2) {
  const result = await storage2.get([
    STORAGE_KEYS.verificationReport,
    STORAGE_KEYS.panelPending
  ]);
  if (result[STORAGE_KEYS.panelPending] !== true) return null;
  const report = result[STORAGE_KEYS.verificationReport];
  if (!report || typeof report !== "object") return null;
  await storage2.set({ [STORAGE_KEYS.panelPending]: false });
  return report;
}

// extension/content.ts
var ROOT_ID = "truth-tracker-root";
var MODAL_ID = "truth-tracker-modal";
var PANEL_ID = "truth-tracker-panel";
var STATUS_ID = "truth-tracker-status";
var storage = chromeSessionStorage();
function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    document.documentElement.appendChild(root);
  }
  return root;
}
function showStatus(text, kind) {
  const root = ensureRoot();
  let el = document.getElementById(STATUS_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = STATUS_ID;
    el.className = "tt-status";
    root.appendChild(el);
  }
  el.dataset.kind = kind;
  el.textContent = text;
  el.hidden = false;
}
function hideStatus() {
  const el = document.getElementById(STATUS_ID);
  if (el) el.hidden = true;
}
function closeModal() {
  document.getElementById(MODAL_ID)?.remove();
}
function closeSidePanel() {
  document.getElementById(PANEL_ID)?.remove();
  hideStatus();
}
function openManualModal() {
  closeModal();
  const root = ensureRoot();
  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.className = "tt-modal-backdrop";
  modal.innerHTML = `
    <div class="tt-modal" role="dialog" aria-modal="true" aria-labelledby="tt-modal-title">
      <h2 id="tt-modal-title">Pegar gui\xF3n del reel</h2>
      <p class="tt-modal-help">La extracci\xF3n autom\xE1tica no est\xE1 disponible. Pega el gui\xF3n y verifica.</p>
      <textarea id="tt-transcript" rows="8" placeholder="Pega aqu\xED el gui\xF3n del reel\u2026"></textarea>
      <div class="tt-modal-actions">
        <button type="button" id="tt-cancel" class="tt-btn tt-btn-secondary">Cancelar</button>
        <button type="button" id="tt-submit" class="tt-btn tt-btn-primary">Verificar texto</button>
      </div>
    </div>
  `;
  root.appendChild(modal);
  modal.querySelector("#tt-cancel")?.addEventListener("click", () => {
    closeModal();
  });
  modal.querySelector("#tt-submit")?.addEventListener("click", () => {
    const textarea = modal.querySelector(
      "#tt-transcript"
    );
    const transcript = textarea?.value.trim() ?? "";
    if (!transcript) {
      showStatus("Escribe o pega un gui\xF3n antes de verificar.", "error");
      return;
    }
    closeModal();
    showStatus("Verificando\u2026", "loading");
    void chrome.runtime.sendMessage(
      createManualVerifyMessage(transcript, location.href)
    );
  });
}
function openSidePanel(report) {
  closeSidePanel();
  hideStatus();
  const root = ensureRoot();
  const panel = document.createElement("aside");
  panel.id = PANEL_ID;
  panel.className = "tt-side-panel";
  panel.innerHTML = buildSidePanelHtml(report);
  root.appendChild(panel);
  panel.querySelector("[data-tt-close]")?.addEventListener("click", () => {
    closeSidePanel();
  });
}
function mountFloatingButton() {
  const root = ensureRoot();
  let fab = document.getElementById("truth-tracker-fab");
  const video = findActiveReelVideo();
  if (!video) {
    fab?.remove();
    return;
  }
  if (!fab) {
    fab = document.createElement("button");
    fab.id = "truth-tracker-fab";
    fab.type = "button";
    fab.className = "tt-fab";
    fab.textContent = "Verificar";
    fab.addEventListener("click", () => {
      void handleVerifyFromReel(fab);
    });
    root.appendChild(fab);
  }
  const rect = video.getBoundingClientRect();
  fab.style.right = `${Math.max(16, window.innerWidth - rect.right + 16)}px`;
  fab.style.bottom = `${Math.max(16, window.innerHeight - rect.bottom + 16)}px`;
}
function findActiveReelVideo() {
  const videos = Array.from(document.querySelectorAll("video"));
  return videos.reduce((active, video) => {
    const rect = video.getBoundingClientRect();
    const visibleWidth = Math.max(
      0,
      Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0)
    );
    const visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
    );
    const visibleArea = visibleWidth * visibleHeight;
    const activeRect = active?.getBoundingClientRect();
    const activeArea = activeRect ? Math.max(
      0,
      Math.min(activeRect.right, window.innerWidth) - Math.max(activeRect.left, 0)
    ) * Math.max(
      0,
      Math.min(activeRect.bottom, window.innerHeight) - Math.max(activeRect.top, 0)
    ) : 0;
    return visibleArea > activeArea ? video : active;
  }, null);
}
function tryExtractCaptionsFromDom(video) {
  const reelRoot = video.closest("article") ?? video.parentElement;
  if (!reelRoot) return null;
  const candidates = Array.from(
    reelRoot.querySelectorAll(
      '[aria-label*="caption" i], [aria-label*="audio" i], [aria-label*="subt" i]'
    ),
    (element) => element.textContent?.trim() || element.getAttribute("aria-label") || ""
  );
  return selectCaptionCandidate(candidates);
}
async function handleVerifyFromReel(fab) {
  const video = findActiveReelVideo();
  if (!video) {
    showStatus("No se encontr\xF3 un reel activo. Int\xE9ntalo de nuevo.", "error");
    return;
  }
  const transcript = tryExtractCaptionsFromDom(video);
  fab.disabled = true;
  fab.textContent = "Extrayendo\u2026";
  showStatus(
    transcript ? "Gui\xF3n encontrado. Verificando\u2026" : "No hay captions disponibles. Capturando audio\u2026",
    "loading"
  );
  try {
    await chrome.runtime.sendMessage(
      createAutoVerifyMessage(location.href, transcript ?? void 0)
    );
  } catch {
    fab.disabled = false;
    fab.textContent = "Verificar";
    showStatus("No se pudo extraer el gui\xF3n. Puedes pegarlo manualmente.", "error");
    openManualModal();
  }
}
chrome.runtime.onMessage.addListener((message) => {
  if (!isExtensionMessage(message)) return;
  if (message.type === MessageType.OPEN_MANUAL_MODAL) {
    openManualModal();
    return;
  }
  if (message.type === MessageType.REPORT_READY) {
    openSidePanel(message.report);
    return;
  }
  if (message.type === MessageType.STATUS_CHANGED) {
    const fab = document.getElementById(
      "truth-tracker-fab"
    );
    if (message.status === "extracting") {
      showStatus("Extrayendo gui\xF3n\u2026", "loading");
      if (fab) {
        fab.disabled = true;
        fab.textContent = "Extrayendo\u2026";
      }
    }
    if (message.status === "verifying") {
      showStatus("Verificando\u2026", "loading");
      if (fab) fab.textContent = "Verificando\u2026";
    }
    return;
  }
  if (message.type === MessageType.VERIFY_ERROR) {
    const fab = document.getElementById(
      "truth-tracker-fab"
    );
    if (fab) {
      fab.disabled = false;
      fab.textContent = "Verificar";
    }
    showStatus(message.error, "error");
  }
});
mountFloatingButton();
window.addEventListener("scroll", mountFloatingButton, { passive: true });
new MutationObserver(mountFloatingButton).observe(document.documentElement, {
  childList: true,
  subtree: true
});
void consumePendingReport(storage).then((report) => {
  if (report) openSidePanel(report);
});
export {
  openManualModal,
  openSidePanel
};
//# sourceMappingURL=content.js.map
