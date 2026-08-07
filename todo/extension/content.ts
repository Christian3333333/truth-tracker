import { buildSidePanelHtml } from "./lib/render-report";
import { selectCaptionCandidate } from "./lib/caption-extraction";
import {
  createAutoVerifyMessage,
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
  let fab = document.getElementById("truth-tracker-fab") as HTMLButtonElement | null;
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
      void handleVerifyFromReel(fab!);
    });
    root.appendChild(fab);
  }

  const rect = video.getBoundingClientRect();
  fab.style.right = `${Math.max(16, window.innerWidth - rect.right + 16)}px`;
  fab.style.bottom = `${Math.max(16, window.innerHeight - rect.bottom + 16)}px`;
}

function findActiveReelVideo(): HTMLVideoElement | null {
  const videos = Array.from(document.querySelectorAll("video"));
  return videos.reduce<HTMLVideoElement | null>((active, video) => {
    const rect = video.getBoundingClientRect();
    const visibleWidth = Math.max(
      0,
      Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0),
    );
    const visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
    );
    const visibleArea = visibleWidth * visibleHeight;
    const activeRect = active?.getBoundingClientRect();
    const activeArea = activeRect
      ? Math.max(
          0,
          Math.min(activeRect.right, window.innerWidth) -
            Math.max(activeRect.left, 0),
        ) *
        Math.max(
          0,
          Math.min(activeRect.bottom, window.innerHeight) -
            Math.max(activeRect.top, 0),
        )
      : 0;
    return visibleArea > activeArea ? video : active;
  }, null);
}

function tryExtractCaptionsFromDom(video: HTMLVideoElement): string | null {
  const reelRoot = video.closest("article") ?? video.parentElement;
  if (!reelRoot) return null;

  const candidates = Array.from(
    reelRoot.querySelectorAll(
      '[aria-label*="caption" i], [aria-label*="audio" i], [aria-label*="subt" i]',
    ),
    (element) =>
      element.textContent?.trim() || element.getAttribute("aria-label") || "",
  );
  return selectCaptionCandidate(candidates);
}

async function handleVerifyFromReel(fab: HTMLButtonElement): Promise<void> {
  const video = findActiveReelVideo();
  if (!video) {
    showStatus("No se encontró un reel activo. Inténtalo de nuevo.", "error");
    return;
  }

  const transcript = tryExtractCaptionsFromDom(video);
  fab.disabled = true;
  fab.textContent = "Extrayendo…";
  showStatus(
    transcript
      ? "Guión encontrado. Verificando…"
      : "No hay captions disponibles. Capturando audio…",
    "loading",
  );

  try {
    await chrome.runtime.sendMessage(
      createAutoVerifyMessage(location.href, transcript ?? undefined),
    );
  } catch {
    fab.disabled = false;
    fab.textContent = "Verificar";
    showStatus("No se pudo extraer el guión. Puedes pegarlo manualmente.", "error");
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
      "truth-tracker-fab",
    ) as HTMLButtonElement | null;
    if (message.status === "extracting") {
      showStatus("Extrayendo guión…", "loading");
      if (fab) {
        fab.disabled = true;
        fab.textContent = "Extrayendo…";
      }
    }
    if (message.status === "verifying") {
      showStatus("Verificando…", "loading");
      if (fab) fab.textContent = "Verificando…";
    }
    return;
  }

  if (message.type === MessageType.VERIFY_ERROR) {
    const fab = document.getElementById(
      "truth-tracker-fab",
    ) as HTMLButtonElement | null;
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
  subtree: true,
});

void consumePendingReport(storage).then((report) => {
  if (report) openSidePanel(report);
});
