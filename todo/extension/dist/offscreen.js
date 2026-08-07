// extension/offscreen.ts
function isStartAudioCaptureMessage(value) {
  if (!value || typeof value !== "object") return false;
  const message = value;
  return message.type === "START_AUDIO_CAPTURE" && typeof message.streamId === "string" && typeof message.durationMs === "number";
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("No se pudo codificar el audio capturado."));
        return;
      }
      resolve(dataUrl.split(",", 2)[1] ?? "");
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}
async function captureAudio(streamId, durationMs) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  source.connect(context.destination);
  const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  const chunks = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  const result = new Promise((resolve, reject) => {
    recorder.addEventListener("stop", () => {
      void blobToBase64(new Blob(chunks, { type: recorder.mimeType })).then(resolve).catch(reject);
    });
    recorder.addEventListener("error", () => {
      reject(new Error("La grabaci\xF3n del audio del reel fall\xF3."));
    });
  });
  recorder.start();
  window.setTimeout(() => recorder.stop(), durationMs);
  try {
    return await result;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    source.disconnect();
    await context.close();
  }
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isStartAudioCaptureMessage(message)) return;
  void captureAudio(message.streamId, message.durationMs).then((audioBase64) => sendResponse({ audioBase64 })).catch((error) => {
    sendResponse({
      error: error instanceof Error ? error.message : "No se pudo capturar el audio del reel."
    });
  });
  return true;
});
//# sourceMappingURL=offscreen.js.map
