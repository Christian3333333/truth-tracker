interface StartAudioCaptureMessage {
  type: "START_AUDIO_CAPTURE";
  streamId: string;
  durationMs: number;
}

function isStartAudioCaptureMessage(
  value: unknown,
): value is StartAudioCaptureMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<StartAudioCaptureMessage>;
  return (
    message.type === "START_AUDIO_CAPTURE" &&
    typeof message.streamId === "string" &&
    typeof message.durationMs === "number"
  );
}

function blobToBase64(blob: Blob): Promise<string> {
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

async function captureAudio(
  streamId: string,
  durationMs: number,
): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    } as MediaTrackConstraints,
    video: false,
  });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  source.connect(context.destination);
  const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  const chunks: Blob[] = [];

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  const result = new Promise<string>((resolve, reject) => {
    recorder.addEventListener("stop", () => {
      void blobToBase64(new Blob(chunks, { type: recorder.mimeType }))
        .then(resolve)
        .catch(reject);
    });
    recorder.addEventListener("error", () => {
      reject(new Error("La grabación del audio del reel falló."));
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

  void captureAudio(message.streamId, message.durationMs)
    .then((audioBase64) => sendResponse({ audioBase64 }))
    .catch((error: unknown) => {
      sendResponse({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo capturar el audio del reel.",
      });
    });
  return true;
});
