import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

type LoadMessage = { type: "load" };
type TranscribeMessage = { type: "transcribe"; audio: Float32Array };
type InboundMessage = LoadMessage | TranscribeMessage;

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!transcriberPromise) {
    // Xenova/whisper-base only ships a legacy single "quantized" ONNX export,
    // which trips a missing-scale bug in onnxruntime-web on some platforms
    // ("TransposeDQWeightsForMatMulNBits"). Full precision has no quantized
    // MatMul nodes, so it sidesteps the bug entirely.
    transcriberPromise = pipeline("automatic-speech-recognition", "Xenova/whisper-base", {
      dtype: "fp32",
      progress_callback: (progress: unknown) => {
        self.postMessage({ type: "progress", progress });
      },
    }) as Promise<AutomaticSpeechRecognitionPipeline>;
  }
  return transcriberPromise;
}

self.onmessage = async (event: MessageEvent<InboundMessage>) => {
  const data = event.data;

  if (data.type === "load") {
    try {
      await getTranscriber();
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", message: (err as Error).message });
    }
    return;
  }

  if (data.type === "transcribe") {
    try {
      const transcriber = await getTranscriber();
      const result = await transcriber(data.audio, {
        language: "russian",
        task: "transcribe",
      });
      const text = Array.isArray(result) ? result[0]?.text ?? "" : result.text;
      self.postMessage({ type: "result", text });
    } catch (err) {
      self.postMessage({ type: "error", message: (err as Error).message });
    }
  }
};
