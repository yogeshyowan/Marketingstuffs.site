import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Minimize2, Maximize2, Volume2, VolumeX, Loader2, ChevronRight, Zap } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

type Status = "idle" | "listening" | "processing" | "speaking";
type HistoryEntry = { role: "user" | "assistant"; content: string };

interface ActionLog {
  id: number;
  ts: string;
  label: string;
  transcript: string;
  result: string;
  intent: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const SECTION_MAP: Record<string, string> = {
  "blog-writer": "#blog-writer",
  "website-developer": "#website-developer",
  "social-media-section": "#social-media-section",
  "email-marketing": "#email-marketing",
  "ad-campaigns": "#ad-campaigns",
  "ai-image": "#ai-image",
  "ai-video": "#ai-video",
  "ai-voice": "#ai-voice",
  "yt-growstuffs": "#yt-growstuffs",
  "writing-tools": "#writing-tools",
  "sms-marketing": "#sms-marketing",
};

function getStatusColor(s: Status) {
  if (s === "listening") return "bg-red-500";
  if (s === "processing") return "bg-yellow-500";
  if (s === "speaking") return "bg-blue-500";
  return "bg-zinc-500";
}

function getStatusLabel(s: Status) {
  if (s === "listening") return "Listening…";
  if (s === "processing") return "Processing…";
  if (s === "speaking") return "Speaking…";
  return "Idle — tap mic to start";
}

function truncate(s: string, max = 180) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export default function VoiceAgent() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [muted, setMuted] = useState(false);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [error, setError] = useState("");

  const recogRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const listeningRef = useRef(false);
  const logIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const supported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // ── Speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (muted || !text) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 1;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.startsWith("en-IN")) ||
      voices.find(v => v.lang.startsWith("en-GB")) ||
      voices.find(v => v.lang.startsWith("en"));
    if (pref) u.voice = pref;
    u.onend = () => { setStatus("idle"); onDone?.(); };
    u.onerror = () => { setStatus("idle"); onDone?.(); };
    synthRef.current = u;
    setStatus("speaking");
    window.speechSynthesis.speak(u);
  }, [muted]);

  // ── Start listening ────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!supported || listeningRef.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = "en-IN";
    recog.continuous = false;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      listeningRef.current = true;
      setStatus("listening");
      setInterimTranscript("");
      setError("");
    };

    recog.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimTranscript(interim);
      if (final.trim()) {
        setTranscript(final.trim());
        setInterimTranscript("");
        handleTranscript(final.trim());
      }
    };

    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      listeningRef.current = false;
      if (e.error === "no-speech" || e.error === "aborted") {
        setStatus("idle");
      } else {
        setError(`Mic error: ${e.error}`);
        setStatus("idle");
      }
    };

    recog.onend = () => {
      listeningRef.current = false;
      if (status === "listening") setStatus("idle");
    };

    recogRef.current = recog;
    try { recog.start(); } catch { /* ignore */ }
  }, [supported, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop listening ─────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    listeningRef.current = false;
    try { recogRef.current?.stop(); } catch { /* ignore */ }
    recogRef.current = null;
    setStatus("idle");
    setInterimTranscript("");
  }, []);

  // ── Handle transcript ──────────────────────────────────────────────────────
  const handleTranscript = useCallback(async (text: string) => {
    stopListening();
    setStatus("processing");
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE_URL}ai/voice-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, history: history.slice(-6) }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as {
        intent: string;
        params: Record<string, unknown>;
        spokenResponse: string;
        result: string;
        executed: boolean;
        actionLabel: string;
      };

      // Navigate if needed
      if (data.intent === "navigate" && data.params?.section) {
        const anchor = SECTION_MAP[String(data.params.section)];
        if (anchor) {
          const el = document.querySelector(anchor);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      // Update history
      setHistory(prev => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: data.spokenResponse },
      ].slice(-12));

      // Log action
      const id = ++logIdRef.current;
      const spoken = data.spokenResponse || "Done!";
      const fullResult = data.result?.trim() || "";
      setLogs(prev => [{
        id,
        ts: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        label: data.actionLabel || data.intent,
        transcript: text,
        result: fullResult,
        intent: data.intent,
      }, ...prev].slice(0, 10));

      // Speak response then auto-listen
      speak(spoken, () => {
        if (open && !muted) setTimeout(() => startListening(), 600);
      });

    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg.slice(0, 120));
      setStatus("idle");
      speak("Sorry, something went wrong. Please try again.", () => {
        if (open) setTimeout(() => startListening(), 800);
      });
    }
  }, [history, muted, open, speak, startListening, stopListening]);

  // ── Toggle agent ───────────────────────────────────────────────────────────
  function toggleOpen() {
    if (!open) {
      setOpen(true);
      setMinimized(false);
      setError("");
      setTimeout(() => startListening(), 400);
    } else {
      stopListening();
      window.speechSynthesis.cancel();
      setOpen(false);
      setStatus("idle");
    }
  }

  function toggleMic() {
    if (status === "listening") {
      stopListening();
    } else if (status === "idle") {
      startListening();
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      window.speechSynthesis.cancel();
      abortRef.current?.abort();
    };
  }, [stopListening]);

  if (!supported) return null;

  const isActive = status === "listening" || status === "processing" || status === "speaking";

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={toggleOpen}
        title={open ? "Close Voice Agent" : "Open Voice Agent"}
        className={`
          fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
          transition-all duration-300 border-2
          ${open
            ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            : "bg-gradient-to-br from-violet-600 to-purple-700 border-violet-400 hover:from-violet-500 hover:to-purple-600"
          }
          ${status === "listening" ? "ring-4 ring-red-500/40 animate-pulse" : ""}
          ${status === "speaking" ? "ring-4 ring-blue-500/40" : ""}
        `}
      >
        {open
          ? <X className="w-5 h-5 text-zinc-300" />
          : <Mic className="w-5 h-5 text-white" />
        }
      </button>

      {/* Agent Panel */}
      {open && (
        <div className={`
          fixed bottom-24 right-6 z-[9998] w-80 rounded-2xl shadow-2xl border border-zinc-800
          bg-zinc-950/95 backdrop-blur-xl flex flex-col overflow-hidden
          transition-all duration-300
          ${minimized ? "h-14" : "h-[460px]"}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(status)} ${status === "listening" ? "animate-ping" : ""}`} />
              <span className="text-xs font-semibold text-zinc-200 tracking-wide">
                Voice Agent
              </span>
              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                {getStatusLabel(status)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMuted(m => !m)} title={muted ? "Unmute" : "Mute"}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setMinimized(m => !m)} title={minimized ? "Expand" : "Minimize"}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!minimized && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Live transcription area */}
              <div className="px-4 py-3 min-h-[80px] flex flex-col justify-center border-b border-zinc-800/50">
                {status === "listening" && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex gap-0.5">
                      {[0, 1, 2, 3].map(i => (
                        <span key={i} className="w-0.5 bg-red-500 rounded-full animate-bounce"
                          style={{ height: `${8 + (i % 2) * 6}px`, animationDelay: `${i * 80}ms` }} />
                      ))}
                    </span>
                    <span className="text-[10px] text-red-400 font-medium tracking-wide uppercase">Live</span>
                  </div>
                )}
                {status === "processing" && (
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                    <span className="text-[10px] text-yellow-400 font-medium tracking-wide uppercase">Thinking</span>
                  </div>
                )}
                {status === "speaking" && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map(i => (
                        <span key={i} className="w-0.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ height: `${6 + (i % 3) * 5}px`, animationDelay: `${i * 60}ms` }} />
                      ))}
                    </span>
                    <span className="text-[10px] text-blue-400 font-medium tracking-wide uppercase">Speaking</span>
                  </div>
                )}
                <p className={`text-sm leading-relaxed ${interimTranscript ? "text-zinc-400 italic" : "text-zinc-200"}`}>
                  {interimTranscript || transcript || (
                    <span className="text-zinc-600 text-xs">
                      {status === "idle"
                        ? 'Say "Write a blog about fitness" or "Go to Email Marketing"…'
                        : ""}
                    </span>
                  )}
                </p>
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
              </div>

              {/* Mic button */}
              <div className="flex items-center justify-center py-3 border-b border-zinc-800/50 shrink-0">
                <button
                  onClick={toggleMic}
                  disabled={status === "processing" || status === "speaking"}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${status === "listening"
                      ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                      : "bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
                    }
                  `}
                >
                  {status === "listening"
                    ? <MicOff className="w-5 h-5 text-white" />
                    : status === "processing"
                      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                      : <Mic className="w-5 h-5 text-white" />
                  }
                </button>
              </div>

              {/* Action log */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {logs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 text-center">
                    <Zap className="w-6 h-6 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-600">Your actions will appear here</p>
                  </div>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800/50 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-zinc-300 truncate">{log.label}</p>
                        <p className="text-[10px] text-zinc-500 truncate">"{log.transcript}"</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] text-zinc-600">{log.ts}</span>
                        <ChevronRight className={`w-3 h-3 text-zinc-600 transition-transform ${expandedLog === log.id ? "rotate-90" : ""}`} />
                      </div>
                    </button>
                    {expandedLog === log.id && log.result && (
                      <div className="px-3 pb-3 border-t border-zinc-800">
                        <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap leading-relaxed mt-2 font-sans max-h-32 overflow-y-auto">
                          {truncate(log.result, 400)}
                        </pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(log.result);
                          }}
                          className="mt-1.5 text-[9px] text-violet-400 hover:text-violet-300 font-medium"
                        >
                          Copy result
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick commands */}
              <div className="px-3 pb-3 pt-2 border-t border-zinc-800 shrink-0">
                <p className="text-[9px] text-zinc-600 mb-1.5 uppercase tracking-wider font-medium">Quick commands</p>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Write a blog post",
                    "YouTube script",
                    "Instagram post",
                    "Email campaign",
                    "Ad script",
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => { setTranscript(cmd); handleTranscript(cmd); }}
                      disabled={isActive}
                      className="text-[9px] text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-full px-2 py-0.5 transition-colors disabled:opacity-40"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
