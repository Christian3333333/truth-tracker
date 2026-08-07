export interface TranscriptionClient {
  transcribe(audioBase64: string): Promise<string>;
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
      }>;
    }>;
  };
}

export function createDeepgramTranscriptionClient(
  apiKey: string,
): TranscriptionClient {
  return {
    async transcribe(audioBase64) {
      const audioBuffer = Buffer.from(audioBase64, "base64");

      // Caller should send WAV (or another format Deepgram accepts) as base64.
      const response = await fetch(
        "https://api.deepgram.com/v1/listen?language=es&model=nova-2&smart_format=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "audio/wav",
          },
          body: audioBuffer,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Deepgram transcription failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as DeepgramResponse;
      const transcript =
        data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();

      if (!transcript) {
        throw new Error("Deepgram no devolvió una transcripción.");
      }

      return transcript;
    },
  };
}
