import {
  createOpenManualModalMessage,
  createReportReadyMessage,
  createStatusChangedMessage,
  createVerifyErrorMessage,
  isExtensionMessage,
  MessageType,
  type ExtensionMessage,
} from "./lib/messages";
import { chromeSessionStorage, getBackendUrl } from "./lib/storage";
import { runVerification } from "./lib/verify-flow";
import type { VerifyRequestBody } from "./lib/types";

const storage = chromeSessionStorage();

async function broadcastExtension(message: ExtensionMessage): Promise<void> {
  try {
    await chrome.runtime.sendMessage(message);
  } catch {
    // No other extension pages listening (e.g. popup closed).
  }
}

async function sendToInstagramTabs(message: ExtensionMessage): Promise<void> {
  const tabs = await chrome.tabs.query({
    url: ["https://www.instagram.com/*"],
  });
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id == null) return;
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
        // Tab may not have content script yet.
      }
    }),
  );
}

async function notifyUi(message: ExtensionMessage): Promise<void> {
  await broadcastExtension(message);
  await sendToInstagramTabs(message);
}

async function notifyActiveInstagram(
  message: ExtensionMessage,
): Promise<void> {
  await broadcastExtension(message);
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: ["https://www.instagram.com/*"],
  });
  if (tab?.id != null) {
    try {
      await chrome.tabs.sendMessage(tab.id, message);
      return;
    } catch {
      // fall through to broadcast tabs
    }
  }
  await sendToInstagramTabs(message);
}

async function handleVerification(
  body: VerifyRequestBody,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const backendUrl = await getBackendUrl(storage);
  await notifyUi(createStatusChangedMessage("verifying"));

  try {
    await runVerification({
      storage,
      body,
      backendUrl,
      notifyReportReady: async (report) => {
        await notifyActiveInstagram(createReportReadyMessage(report));
      },
    });
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error de verificación";
    await notifyUi(createVerifyErrorMessage(message));
    return { ok: false, error: message };
  }
}

async function ensureOffscreenDocument(): Promise<void> {
  try {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: "Grabar el audio del reel activo para transcribirlo.",
    });
  } catch {
    // Chrome rejects a second create request while the document already exists.
  }
}

async function captureActiveTabAudio(): Promise<string> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: ["https://www.instagram.com/*"],
  });
  if (tab?.id == null) {
    throw new Error("Abre un reel de Instagram antes de verificar.");
  }

  await ensureOffscreenDocument();
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id,
  });
  const response = (await chrome.runtime.sendMessage({
    type: "START_AUDIO_CAPTURE",
    streamId,
    durationMs: 60_000,
  })) as { audioBase64?: unknown; error?: unknown };

  if (typeof response.audioBase64 === "string") return response.audioBase64;
  throw new Error(
    typeof response.error === "string"
      ? response.error
      : "No se pudo capturar el audio del reel.",
  );
}

async function handleAutoVerify(
  transcript: string | undefined,
  reelUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const body: VerifyRequestBody = transcript
      ? { transcript, reelUrl }
      : {
          audioBase64: await captureActiveTabAudio(),
          reelUrl,
        };
    return await handleVerification(body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al extraer el guión";
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
      reelUrl: message.reelUrl,
    }).then(
      sendResponse,
    );
    return true;
  }

  if (message.type === MessageType.AUTO_VERIFY) {
    void handleAutoVerify(message.transcript, message.reelUrl).then(sendResponse);
    return true;
  }

  if (message.type === MessageType.TRIGGER_VERIFY) {
    void notifyActiveInstagram(createOpenManualModalMessage()).then(() =>
      sendResponse({ ok: true }),
    );
    return true;
  }
});
