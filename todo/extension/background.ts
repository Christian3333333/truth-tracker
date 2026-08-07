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
import { runManualVerification } from "./lib/verify-flow";

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

async function handleManualVerify(
  transcript: string,
  reelUrl?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const backendUrl = await getBackendUrl(storage);
  await notifyUi(createStatusChangedMessage("verifying"));

  try {
    await runManualVerification({
      storage,
      transcript,
      backendUrl,
      reelUrl,
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) return;

  if (message.type === MessageType.MANUAL_VERIFY) {
    void handleManualVerify(message.transcript, message.reelUrl).then(
      sendResponse,
    );
    return true;
  }

  if (message.type === MessageType.TRIGGER_VERIFY) {
    void notifyActiveInstagram(createOpenManualModalMessage()).then(() =>
      sendResponse({ ok: true }),
    );
    return true;
  }
});
