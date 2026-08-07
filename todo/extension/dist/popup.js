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
function createTriggerVerifyMessage() {
  return { type: MessageType.TRIGGER_VERIFY };
}
function isExtensionMessage(value) {
  if (!value || typeof value !== "object") return false;
  const type = value.type;
  return type === MessageType.MANUAL_VERIFY || type === MessageType.AUTO_VERIFY || type === MessageType.TRIGGER_VERIFY || type === MessageType.REPORT_READY || type === MessageType.OPEN_MANUAL_MODAL || type === MessageType.STATUS_CHANGED || type === MessageType.VERIFY_ERROR;
}

// extension/lib/types.ts
var DEFAULT_BACKEND_URL = "http://localhost:3000";
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
async function getBackendUrl(storage2) {
  const result = await storage2.get(STORAGE_KEYS.backendUrl);
  const value = result[STORAGE_KEYS.backendUrl];
  if (typeof value === "string" && value.trim()) {
    return value.replace(/\/+$/, "");
  }
  return DEFAULT_BACKEND_URL;
}
async function setBackendUrl(storage2, url) {
  await storage2.set({
    [STORAGE_KEYS.backendUrl]: url.replace(/\/+$/, "")
  });
}

// extension/popup.ts
var storage = chromeSessionStorage();
var urlInput = document.getElementById("backend-url");
var verifyBtn = document.getElementById("verify-btn");
var statusEl = document.getElementById("status");
function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}
async function init() {
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
  setStatus("Activando verificaci\xF3n\u2026", "loading");
  verifyBtn.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage(
      createTriggerVerifyMessage()
    );
    if (response && response.ok === false) {
      setStatus(String(response.error ?? "No se pudo activar"), "error");
      return;
    }
    setStatus(
      "Modal abierto en Instagram. Pega el gui\xF3n; el panel aparecer\xE1 al terminar.",
      "idle"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al activar";
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
    setStatus("Verificando\u2026", "loading");
  }
});
void init();
//# sourceMappingURL=popup.js.map
