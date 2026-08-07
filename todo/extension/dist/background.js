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
function createReportReadyMessage(report) {
  return { type: MessageType.REPORT_READY, report };
}
function createOpenManualModalMessage() {
  return { type: MessageType.OPEN_MANUAL_MODAL };
}
function createStatusChangedMessage(status) {
  return { type: MessageType.STATUS_CHANGED, status };
}
function createVerifyErrorMessage(error) {
  return { type: MessageType.VERIFY_ERROR, error };
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
async function persistReport(storage2, report) {
  await storage2.set({
    [STORAGE_KEYS.verificationReport]: report,
    [STORAGE_KEYS.verificationStatus]: "idle",
    [STORAGE_KEYS.verificationError]: "",
    [STORAGE_KEYS.panelPending]: true
  });
}
async function setVerificationStatus(storage2, status, error = "") {
  await storage2.set({
    [STORAGE_KEYS.verificationStatus]: status,
    [STORAGE_KEYS.verificationError]: error
  });
}

// extension/lib/verify-client.ts
function normalizeBackendUrl(backendUrl) {
  return backendUrl.replace(/\/+$/, "");
}
async function postVerify(backendUrl, body, fetchImpl = fetch) {
  const url = `${normalizeBackendUrl(backendUrl)}/api/verify`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = payload.error ? `: ${payload.error}` : "";
    } catch {
    }
    throw new Error(`Error de verificaci\xF3n (${response.status})${detail}`);
  }
  return await response.json();
}

// extension/lib/verify-flow.ts
async function runVerification(deps) {
  const postVerify2 = deps.postVerify ?? postVerify;
  await setVerificationStatus(deps.storage, "verifying");
  try {
    const report = await postVerify2(deps.backendUrl, {
      ...deps.body
    });
    await persistReport(deps.storage, report);
    await setVerificationStatus(deps.storage, "idle");
    await deps.notifyReportReady(report);
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de verificaci\xF3n";
    await setVerificationStatus(deps.storage, "error", message);
    throw error;
  }
}

// extension/background.ts
var storage = chromeSessionStorage();
async function broadcastExtension(message) {
  try {
    await chrome.runtime.sendMessage(message);
  } catch {
  }
}
async function sendToInstagramTabs(message) {
  const tabs = await chrome.tabs.query({
    url: ["https://www.instagram.com/*"]
  });
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id == null) return;
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
      }
    })
  );
}
async function notifyUi(message) {
  await broadcastExtension(message);
  await sendToInstagramTabs(message);
}
async function notifyActiveInstagram(message) {
  await broadcastExtension(message);
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: ["https://www.instagram.com/*"]
  });
  if (tab?.id != null) {
    try {
      await chrome.tabs.sendMessage(tab.id, message);
      return;
    } catch {
    }
  }
  await sendToInstagramTabs(message);
}
async function handleVerification(body) {
  const backendUrl = await getBackendUrl(storage);
  await notifyUi(createStatusChangedMessage("verifying"));
  try {
    await runVerification({
      storage,
      body,
      backendUrl,
      notifyReportReady: async (report) => {
        await notifyActiveInstagram(createReportReadyMessage(report));
      }
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de verificaci\xF3n";
    await notifyUi(createVerifyErrorMessage(message));
    return { ok: false, error: message };
  }
}
async function ensureOffscreenDocument() {
  try {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: "Grabar el audio del reel activo para transcribirlo."
    });
  } catch {
  }
}
async function captureActiveTabAudio() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: ["https://www.instagram.com/*"]
  });
  if (tab?.id == null) {
    throw new Error("Abre un reel de Instagram antes de verificar.");
  }
  await ensureOffscreenDocument();
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id
  });
  const response = await chrome.runtime.sendMessage({
    type: "START_AUDIO_CAPTURE",
    streamId,
    durationMs: 6e4
  });
  if (typeof response.audioBase64 === "string") return response.audioBase64;
  throw new Error(
    typeof response.error === "string" ? response.error : "No se pudo capturar el audio del reel."
  );
}
async function handleAutoVerify(transcript, reelUrl) {
  try {
    const body = transcript ? { transcript, reelUrl } : {
      audioBase64: await captureActiveTabAudio(),
      reelUrl
    };
    return await handleVerification(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al extraer el gui\xF3n";
    await notifyActiveInstagram(createVerifyErrorMessage(message));
    await notifyActiveInstagram(createOpenManualModalMessage());
    return { ok: false, error: message };
  }
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) return;
  if (message.type === MessageType.MANUAL_VERIFY) {
    void handleVerification({
      transcript: message.transcript,
      reelUrl: message.reelUrl
    }).then(
      sendResponse
    );
    return true;
  }
  if (message.type === MessageType.AUTO_VERIFY) {
    void handleAutoVerify(message.transcript, message.reelUrl).then(sendResponse);
    return true;
  }
  if (message.type === MessageType.TRIGGER_VERIFY) {
    void notifyActiveInstagram(createOpenManualModalMessage()).then(
      () => sendResponse({ ok: true })
    );
    return true;
  }
});
//# sourceMappingURL=background.js.map
