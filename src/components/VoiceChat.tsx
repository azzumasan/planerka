"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Square, Loader2, Sparkles, ListChecks, Check } from "lucide-react";
import { blobToMono16kPCM } from "@/lib/audio";
import { converseAction, extractPlanAction } from "@/lib/voiceActions";
import { createTaskAction } from "@/lib/actions";
import { TASK_CATEGORIES } from "@/lib/types";
import type { ChatMessage, DraftTask } from "@/lib/types";

type ModelState = "loading" | "ready" | "fallback" | "error";
type FlowState = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

type BrowserRecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type BrowserRecognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: BrowserRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type BrowserRecognizerConstructor = new () => BrowserRecognizer;

declare global {
  interface Window {
    SpeechRecognition?: BrowserRecognizerConstructor;
    webkitSpeechRecognition?: BrowserRecognizerConstructor;
  }
}

const OPENING_LINE = "Доброе утро. Как спалось и что сегодня в приоритете?";

function pickRussianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return voices.find((v) => v.lang?.toLowerCase().startsWith("ru")) ?? voices.find((v) => v.default);
}

export default function VoiceChat() {
  const workerRef = useRef<Worker | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognizerRef = useRef<BrowserRecognizer | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressFiles = useRef<Map<string, { loaded: number; total: number }>>(new Map());

  const [modelState, setModelState] = useState<ModelState>("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [flow, setFlow] = useState<FlowState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: OPENING_LINE }]);
  const [error, setError] = useState<string | null>(null);

  const [draftTasks, setDraftTasks] = useState<DraftTask[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [planPending, setPlanPending] = useState(false);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  function speak(text: string) {
    return new Promise<void>((resolve) => {
      if (!text) return resolve();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      const voice = pickRussianVoice(voicesRef.current);
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  async function handleTranscript(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setFlow("idle");
      return;
    }

    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setFlow("thinking");

    const reply = await converseAction(nextHistory);
    setMessages([...nextHistory, { role: "assistant", content: reply }]);

    setFlow("speaking");
    await speak(reply);
    setFlow("idle");
  }

  useEffect(() => {
    const worker = new Worker(new URL("../workers/whisper-worker.ts", import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === "ready") {
        setModelState("ready");
      } else if (data.type === "progress" && data.progress?.file && typeof data.progress.total === "number") {
        progressFiles.current.set(data.progress.file, {
          loaded: data.progress.loaded ?? 0,
          total: data.progress.total,
        });
        let loaded = 0;
        let total = 0;
        for (const f of progressFiles.current.values()) {
          loaded += f.loaded;
          total += f.total;
        }
        setLoadProgress(total > 0 ? Math.round((loaded / total) * 100) : 0);
      } else if (data.type === "result") {
        void handleTranscript(String(data.text ?? ""));
      } else if (data.type === "error") {
        console.error("Whisper worker failed:", data.message);
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
          setModelState("fallback");
          setError("Локальная модель распознавания не загрузилась — использую встроенное распознавание браузера.");
        } else {
          setModelState("error");
          setError("Не удалось загрузить распознавание речи. Проверь интернет и обнови страницу.");
        }
      }
    };

    worker.postMessage({ type: "load" });

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      worker.terminate();
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, flow]);

  async function startRecording() {
    setError(null);

    if (modelState === "fallback") {
      const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!Recognition) return;
      const recognizer = new Recognition();
      recognizer.lang = "ru-RU";
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.onresult = (event) => void handleTranscript(event.results[0][0].transcript);
      recognizer.onerror = () => {
        setError("Браузер не смог распознать речь. Проверь доступ к микрофону.");
        setFlow("idle");
      };
      recognizer.onend = () => setFlow((current) => (current === "recording" ? "idle" : current));
      recognizerRef.current = recognizer;
      recognizer.start();
      setFlow("recording");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setFlow("transcribing");
        try {
          const pcm = await blobToMono16kPCM(new Blob(chunksRef.current, { type: recorder.mimeType }));
          workerRef.current?.postMessage({ type: "transcribe", audio: pcm }, [pcm.buffer]);
        } catch {
          setError("Не получилось распознать запись. Попробуй ещё раз.");
          setFlow("idle");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setFlow("recording");
    } catch {
      setError("Нет доступа к микрофону. Разреши доступ в браузере и попробуй снова.");
    }
  }

  function stopRecording() {
    recognizerRef.current?.stop();
    recorderRef.current?.stop();
  }

  function handleMicClick() {
    if (flow === "recording") {
      stopRecording();
    } else if (flow === "idle" && (modelState === "ready" || modelState === "fallback")) {
      void startRecording();
    }
  }

  async function handleBuildPlan() {
    setPlanPending(true);
    const tasks = await extractPlanAction(messages);
    setDraftTasks(tasks);
    setSelected(new Set(tasks.map((_, i) => i)));
    setPlanPending(false);
  }

  async function handleAddSelected() {
    if (!draftTasks) return;
    setPlanPending(true);
    const today = new Date().toISOString().slice(0, 10);
    const toAdd = draftTasks.filter((_, i) => selected.has(i));
    for (const task of toAdd) {
      await createTaskAction({ ...task, description: null, due_date: today });
    }
    setAddedCount(toAdd.length);
    setDraftTasks(null);
    setPlanPending(false);
  }

  const canRecord = (modelState === "ready" || modelState === "fallback") && (flow === "idle" || flow === "recording");
  const userTurns = useMemo(() => messages.filter((m) => m.role === "user").length, [messages]);

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6 md:p-8 flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={handleMicClick}
          disabled={!canRecord}
          aria-label={flow === "recording" ? "Остановить запись" : "Начать запись"}
          className="relative flex h-24 w-24 items-center justify-center rounded-full transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              flow === "recording"
                ? "linear-gradient(135deg, #f8567e, #f5a83c)"
                : "linear-gradient(135deg, var(--violet), var(--cyan))",
          }}
        >
          {flow === "recording" && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(248, 86, 126, 0.4)" }}
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          {flow === "transcribing" || flow === "thinking" || modelState === "loading" ? (
            <Loader2 className="h-9 w-9 text-bg animate-spin" />
          ) : flow === "recording" ? (
            <Square className="h-8 w-8 text-bg" fill="currentColor" />
          ) : (
            <Mic className="h-9 w-9 text-bg" strokeWidth={2} />
          )}
        </button>

        <div className="text-center min-h-[24px]">
          {modelState === "loading" && (
            <p className="font-mono text-xs text-text-muted">
              Загружаю модель распознавания речи… {loadProgress}%
            </p>
          )}
          {modelState === "error" && <p className="text-sm text-rose">{error}</p>}
          {(modelState === "ready" || modelState === "fallback") && flow === "idle" && (
            <p className="text-sm text-text-muted">Нажми и говори</p>
          )}
          {flow === "recording" && <p className="text-sm text-rose font-medium">Слушаю…</p>}
          {flow === "transcribing" && <p className="text-sm text-text-muted">Распознаю речь…</p>}
          {flow === "thinking" && <p className="text-sm text-text-muted">Думаю…</p>}
          {flow === "speaking" && <p className="text-sm text-cyan">Говорю…</p>}
          {modelState !== "error" && error && <p className="text-sm text-rose mt-1">{error}</p>}
        </div>

        <p className="text-xs text-text-faint text-center max-w-sm">
          {modelState === "fallback"
            ? "Распознавание речи — через браузер (Whisper не загрузился). Разговор и план собирает Claude."
            : "Распознавание речи работает локально в браузере. Разговор и план собирает Claude."}
        </p>
      </div>

      <div ref={scrollRef} className="card p-5 max-h-[420px] overflow-y-auto flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "self-end bg-gradient-to-r from-violet to-cyan text-bg"
                : "self-start bg-bg-elevated-2 text-text"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      {userTurns > 0 && !draftTasks && addedCount === null && (
        <button
          type="button"
          onClick={handleBuildPlan}
          disabled={planPending || flow !== "idle"}
          className="self-start inline-flex items-center gap-2 rounded-lg bg-bg-elevated-2 border border-border px-4 py-2.5 text-sm font-semibold text-text hover:border-violet transition-colors disabled:opacity-50"
        >
          {planPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-violet" />}
          Сформировать план на день
        </button>
      )}

      <AnimatePresence>
        {draftTasks && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-4 w-4 text-violet" />
              <h3 className="font-display text-sm font-semibold text-text-muted">Задачи из разговора</h3>
            </div>

            {draftTasks.length === 0 ? (
              <p className="text-sm text-text-faint">
                Не нашёл конкретных задач в разговоре. Расскажи подробнее и попробуй снова.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {draftTasks.map((task, i) => {
                  const checked = selected.has(i);
                  const categoryLabel = TASK_CATEGORIES.find((c) => c.value === task.category)?.label;
                  return (
                    <label
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border-soft bg-bg-elevated-2/60 px-3 py-2.5 cursor-pointer"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          })
                        }
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                        style={{
                          borderColor: checked ? "var(--cyan)" : "var(--border)",
                          background: checked ? "linear-gradient(135deg, var(--violet), var(--cyan))" : "transparent",
                        }}
                      >
                        {checked && <Check className="h-3 w-3 text-bg" strokeWidth={3} />}
                      </button>
                      <span className="flex-1 text-sm text-text">{task.title}</span>
                      <span className="text-[11px] text-text-faint">{categoryLabel}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {draftTasks.length > 0 && (
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={planPending || selected.size === 0}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet to-cyan px-4 py-2.5 text-sm font-semibold text-bg disabled:opacity-50"
              >
                {planPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Добавить {selected.size > 0 ? `(${selected.size})` : ""} в задачи
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {addedCount !== null && (
        <div className="card p-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-soft">
            <Check className="h-4.5 w-4.5 text-cyan" />
          </span>
          <p className="text-sm text-text">
            Добавлено задач: {addedCount}. Посмотреть на странице{" "}
            <a href="/tasks" className="text-cyan underline underline-offset-2">
              Задачи и цели
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
