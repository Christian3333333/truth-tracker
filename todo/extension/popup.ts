import {
  createTriggerVerifyMessage,
  MessageType,
  isExtensionMessage,
} from "./lib/messages";
import {
  chromeSessionStorage,
  getBackendUrl,
  setBackendUrl,
} from "./lib/storage";
import { DEFAULT_BACKEND_URL } from "./lib/types";

const storage = chromeSessionStorage();

const urlInput = document.getElementById("backend-url") as HTMLInputElement;
const verifyBtn = document.getElementById("verify-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;

function setStatus(text: string, kind: "idle" | "loading" | "error"): void {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

async function init(): Promise<void> {
  urlInput.value = await getBackendUrl(storage);
}

urlInput.addEventListener("change", () => {
  void setBackendUrl(storage, urlInput.value.trim() || DEFAULT_BACKEND_URL);
});

urlInput.addEventListener("blur", () => {
  void setBackendUrl(storage, urlInput.value.trim() || DEFAULT_BACKEND_URL);
});

verifyBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim() || DEFAULT_BACKEND_URL;
  await setBackendUrl(storage, url);
  setStatus("Activando verificación…", "loading");
  verifyBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage(
      createTriggerVerifyMessage(),
    );
    if (response && response.ok === false) {
      setStatus(String(response.error ?? "No se pudo activar"), "error");
      return;
    }
    setStatus(
      "Modal abierto en Instagram. Pega el guión; el panel aparecerá al terminar.",
      "idle",
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al activar";
    setStatus(message, "error");
  } finally {
    verifyBtn.disabled = false;
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (!isExtensionMessage(message)) return;
  if (message.type === MessageType.VERIFY_ERROR) {
    setStatus(message.error, "error");
  }
  if (message.type === MessageType.REPORT_READY) {
    setStatus("Informe listo en el panel de Instagram.", "idle");
  }
  if (message.type === MessageType.STATUS_CHANGED && message.status === "verifying") {
    setStatus("Verificando…", "loading");
  }
});

void init();
