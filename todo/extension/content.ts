import { buildSidePanelHtml } from "./lib/render-report";
import {
  createManualVerifyMessage,
  isExtensionMessage,
  MessageType,
} from "./lib/messages";
import { chromeSessionStorage, consumePendingReport } from "./lib/storage";
import type { VerificationReport } from "./lib/types";

const ROOT_ID = "truth-tracker-root";
const MODAL_ID = "truth-tracker-modal";
const PANEL_ID = "truth-tracker-panel";
const STATUS_ID = "truth-tracker-status";
const storage = chromeSessionStorage();

function ensureRoot(): HTMLElement {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    document.documentElement.appendChild(root);
  }
  return root;
}

function showStatus(text: string, kind: "info" | "error" | "loading"): void {
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

function hideStatus(): void {
  const el = document.getElementById(STATUS_ID);
  if (el) el.hidden = true;
}

function closeModal(): void {
  document.getElementById(MODAL_ID)?.remove();
}

function closeSidePanel(): void {
  document.getElementById(PANEL_ID)?.remove();
  hideStatus();
}

export function openManualModal(): void {
  closeModal();
  const root = ensureRoot();
  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.className = "tt-modal-backdrop";
  modal.innerHTML = `
    <div class="tt-modal" role="dialog" aria-modal="true" aria-labelledby="tt-modal-title">
      <h2 id="tt-modal-title">Pegar guión del reel</h2>
      <p class="tt-modal-help">La extracción automática no está disponible. Pega el guión y verifica.</p>
      <textarea id="tt-transcript" rows="8" placeholder="Pega aquí el guión del reel…"></textarea>
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
      "#tt-transcript",
    ) as HTMLTextAreaElement | null;
    const transcript = textarea?.value.trim() ?? "";
    if (!transcript) {
      showStatus("Escribe o pega un guión antes de verificar.", "error");
      return;
    }
    closeModal();
    showStatus("Verificando…", "loading");
    void chrome.runtime.sendMessage(
      createManualVerifyMessage(transcript, location.href),
    );
  });
}

export function openSidePanel(report: VerificationReport): void {
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

function mountFloatingButton(): void {
  const root = ensureRoot();
  if (document.getElementById("truth-tracker-fab")) return;
  const fab = document.createElement("button");
  fab.id = "truth-tracker-fab";
  fab.type = "button";
  fab.className = "tt-fab";
  fab.textContent = "Verificar";
  fab.addEventListener("click", () => {
    openManualModal();
  });
  root.appendChild(fab);
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
    if (message.status === "verifying") {
      showStatus("Verificando…", "loading");
    }
    return;
  }

  if (message.type === MessageType.VERIFY_ERROR) {
    showStatus(message.error, "error");
  }
});

mountFloatingButton();

void consumePendingReport(storage).then((report) => {
  if (report) openSidePanel(report);
});
