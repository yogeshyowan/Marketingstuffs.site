import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, X, Minimize2, Maximize2, Volume2, VolumeX,
  Loader2, Send, Copy, Check, ChevronDown, Zap,
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";

type Status = "idle" | "listening" | "processing" | "speaking";

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  text: string;
  result?: string;       // full generated content
  resultLabel?: string;  // e.g. "Blog Post"
  copied?: boolean;
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

let msgId = 0;
const nextId = () => ++msgId;

function StatusDot({ status }: { status: Status }) {
  const color =
    status === "listening" ? "bg-red-500" :
    status === "processing" ? "bg-yellow-400" :
    status === "speaking" ? "bg-blue-500" : "bg-zinc-600";
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color} ${status === "listening" ? "animate-ping" : ""}`} />
  );
}

function Waveform({ color }: { color: string }) {
  return (
    <span className="flex items-end gap-[2px] h-4">
      {[3, 6, 4, 8, 5, 7, 3].map((h, i) => (
        <span
          key={i}
          className={`w-[2px] rounded-full ${color} animate-bounce`}
          style={{ height: `${h}px`, animationDelay: `${i * 55}ms`, animationDuration: "0.7s" }}
        />
      ))}
    </span>
  );
}

export default function VoiceAgent() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [interimText, setInterimText] = useState("");
  const [muted, setMuted] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [typedInput, setTypedInput] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [voicesReady, setVoicesReady] = useState(false);

  // ── Refs to avoid stale closures ──────────────────────────────────────────
  const statusRef = useRef<Status>("idle");
  const openRef = useRef(false);
  const mutedRef = useRef(false);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const handleTranscriptRef = useRef<(t: string) => void>(() => {});
  const startListeningRef = useRef<() => void>(() => {});

  // keep refs in sync
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { statusRef.current = status; }, [status]);

  const supported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // ── Load voices ────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true);
    };
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);

  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, interimText]);

  // ── Speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (mutedRef.current || !text) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.05;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pref =
      voices.find(v => v.lang === "en-IN") ||
      voices.find(v => v.lang.startsWith("en-IN")) ||
      voices.find(v => v.lang.startsWith("en-GB")) ||
      voices.find(v => v.lang.startsWith("en"));
    if (pref) u.voice = pref;
    let fired = false;
    const done = () => { if (!fired) { fired = true; setStatus("idle"); onDone?.(); } };
    u.onend = done;
    u.onerror = done;
    // Safari sometimes doesn't fire onend — timeout fallback
    const words = text.split(" ").length;
    const ms = Math.max(2000, words * 450);
    setTimeout(done, ms + 500);
    setStatus("speaking");
    window.speechSynthesis.speak(u);
  }, []); // no deps — always uses mutedRef

  // ── Start listening ────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!supported || listeningRef.current) return;
    if (statusRef.current === "processing" || statusRef.current === "speaking") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = "en-IN";
    recog.continuous = false;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      listeningRef.current = true;
      setStatus("listening");
      setInterimText("");
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
      setInterimText(interim);
      if (final.trim()) {
        setInterimText("");
        // Use ref — always gets the latest version, no stale closure
        handleTranscriptRef.current(final.trim());
      }
    };

    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      listeningRef.current = false;
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(`Mic: ${e.error}. Use the text box below.`);
      }
      setStatus("idle");
    };

    recog.onend = () => {
      listeningRef.current = false;
      if (statusRef.current === "listening") setStatus("idle");
    };

    recogRef.current = recog;
    try { recog.start(); } catch { /* ignore duplicate starts */ }
  }, [supported]);

  // Expose via ref so callbacks can call the latest version
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ── Stop listening ─────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    listeningRef.current = false;
    try { recogRef.current?.stop(); recogRef.current?.abort(); } catch { /* ignore */ }
    recogRef.current = null;
  }, []);

  // ── Add message helper ─────────────────────────────────────────────────────
  const addMsg = (msg: Omit<ChatMsg, "id">) =>
    setMsgs(prev => [...prev, { ...msg, id: nextId() }]);

  const updateHistory = (user: string, assistant: string) => {
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: user },
      { role: "assistant", content: assistant },
    ].slice(-12);
  };

  // ── Handle transcript (stores in ref to prevent stale closures) ────────────
  const handleTranscript = useCallback(async (text: string) => {
    stopListening();
    setStatus("processing");
    setInterimText("");
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    addMsg({ role: "user", text });

    try {
      const res = await fetch(`${BASE_URL}ai/voice-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, history: historyRef.current }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json() as {
        intent: string;
        params: Record<string, unknown>;
        spokenResponse: string;
        result: string;
        executed: boolean;
        actionLabel: string;
      };

      // Navigate
      if (data.intent === "navigate" && data.params?.section) {
        const anchor = SECTION_MAP[String(data.params.section)];
        if (anchor) {
          const el = document.querySelector(anchor);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      const spoken = data.spokenResponse || "Done!";
      const result = data.result?.trim() || "";
      const label = data.actionLabel || "";

      updateHistory(text, spoken + (result ? ` [${label} generated]` : ""));

      // Show assistant reply with optional result
      addMsg({
        role: "assistant",
        text: spoken,
        result: result || undefined,
        resultLabel: label || undefined,
      });

      // Speak + auto-resume
      speak(spoken, () => {
        if (openRef.current) {
          setTimeout(() => startListeningRef.current(), 700);
        }
      });

    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg.slice(0, 100));
      addMsg({ role: "assistant", text: "Sorry, something went wrong. Please try again." });
      setStatus("idle");
      speak("Sorry, something went wrong. Please try again.", () => {
        if (openRef.current) setTimeout(() => startListeningRef.current(), 700);
      });
    }
  }, [speak, stopListening]);

  // Keep ref updated — this is the key fix for stale closures
  useEffect(() => { handleTranscriptRef.current = handleTranscript; }, [handleTranscript]);

  // ── Submit typed text ──────────────────────────────────────────────────────
  const submitText = useCallback(() => {
    const t = typedInput.trim();
    if (!t || status === "processing" || status === "speaking") return;
    setTypedInput("");
    handleTranscriptRef.current(t);
  }, [typedInput, status]);

  // ── Copy result ────────────────────────────────────────────────────────────
  const copyResult = (id: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Open / close ───────────────────────────────────────────────────────────
  const openAgent = () => {
    setOpen(true);
    setMinimized(false);
    setError("");
    if (msgs.length === 0) {
      setMsgs([{
        id: nextId(),
        role: "assistant",
        text: "Hi! I'm your AI marketing assistant. Tell me what you need — write a blog post, create an Instagram caption, draft an email, make a YouTube script, and more. What would you like to create?",
      }]);
    }
    setTimeout(() => startListeningRef.current(), 600);
  };

  const closeAgent = () => {
    stopListening();
    window.speechSynthesis.cancel();
    setOpen(false);
    setStatus("idle");
    setInterimText("");
  };

  const toggleMic = () => {
    if (status === "listening") {
      stopListening();
      setStatus("idle");
    } else if (status === "idle") {
      startListeningRef.current();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
      window.speechSynthesis.cancel();
      abortRef.current?.abort();
    };
  }, [stopListening]);

  if (!supported) return null;

  const busy = status === "processing" || status === "speaking";
  const statusLabel =
    status === "listening" ? "Listening…" :
    status === "processing" ? "Thinking…" :
    status === "speaking" ? "Speaking…" : "Tap mic or type";

  return (
    <>
      {/* Floating button */}
      <button
        onClick={open ? closeAgent : openAgent}
        title={open ? "Close AI Assistant" : "Open AI Voice Assistant"}
        className={`
          fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
          border-2 transition-all duration-200
          ${open
            ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            : "bg-gradient-to-br from-violet-600 to-purple-700 border-violet-400 hover:scale-105"
          }
          ${status === "listening" ? "ring-4 ring-red-400/50" : ""}
          ${status === "speaking" ? "ring-4 ring-blue-400/50" : ""}
        `}
      >
        {open
          ? <X className="w-5 h-5 text-zinc-300" />
          : <Mic className="w-5 h-5 text-white" />
        }
        {!open && status === "idle" && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-zinc-950" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className={`
          fixed bottom-24 right-6 z-[9998] w-[340px] rounded-2xl shadow-2xl border border-zinc-800
          bg-zinc-950 flex flex-col overflow-hidden transition-all duration-200
          ${minimized ? "h-14" : "h-[520px]"}
        `}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900 shrink-0">
            <StatusDot status={status} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-100 leading-none">AI Assistant</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{statusLabel}</p>
            </div>
            <button onClick={() => setMuted(m => !m)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
              title={muted ? "Unmute voice" : "Mute voice"}>
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setMinimized(m => !m)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
              {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!minimized && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {msgs.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`
                      max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed
                      ${msg.role === "user"
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                      }
                    `}>
                      {msg.text}
                    </div>

                    {/* Generated result card */}
                    {msg.role === "assistant" && msg.result && (
                      <div className="w-[85%] mt-1.5 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
                        <button
                          onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-violet-400" />
                            <span className="text-[10px] font-semibold text-violet-300">{msg.resultLabel}</span>
                          </div>
                          <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${expandedId === msg.id ? "rotate-180" : ""}`} />
                        </button>
                        {expandedId === msg.id && (
                          <div className="border-t border-zinc-800">
                            <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap font-sans px-3 py-2 max-h-40 overflow-y-auto leading-relaxed">
                              {msg.result}
                            </pre>
                            <div className="px-3 pb-2">
                              <button
                                onClick={() => copyResult(msg.id, msg.result!)}
                                className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-200 font-medium transition-colors"
                              >
                                {copiedId === msg.id
                                  ? <><Check className="w-3 h-3" /> Copied!</>
                                  : <><Copy className="w-3 h-3" /> Copy</>
                                }
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Interim text (live speech) */}
                {interimText && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-xs bg-violet-600/50 text-violet-200 italic border border-violet-500/30">
                      {interimText}
                    </div>
                  </div>
                )}

                {/* Processing indicator */}
                {status === "processing" && (
                  <div className="flex items-start">
                    <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                      <span className="text-[11px] text-zinc-400">Working on it…</span>
                    </div>
                  </div>
                )}

                {/* Speaking indicator */}
                {status === "speaking" && (
                  <div className="flex items-start">
                    <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                      <Waveform color="bg-blue-400" />
                      <span className="text-[11px] text-zinc-400">Speaking…</span>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-[10px] text-red-400 text-center px-2">{error}</p>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick command chips */}
              {msgs.length <= 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {["Write a blog post", "Instagram caption", "YouTube script", "Email campaign", "Facebook ad"].map(cmd => (
                    <button
                      key={cmd}
                      disabled={busy}
                      onClick={() => { setTypedInput(""); handleTranscriptRef.current(cmd); }}
                      className="text-[10px] text-zinc-400 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full px-2.5 py-1 transition-colors disabled:opacity-40"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              )}

              {/* Input row */}
              <div className="px-3 pb-3 pt-1 border-t border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  {/* Mic button */}
                  <button
                    onClick={toggleMic}
                    disabled={busy}
                    title={status === "listening" ? "Stop listening" : "Start listening"}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed
                      ${status === "listening"
                        ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                        : "bg-violet-600 hover:bg-violet-500"
                      }
                    `}
                  >
                    {status === "listening"
                      ? <Waveform color="bg-white" />
                      : status === "processing"
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : <Mic className="w-4 h-4 text-white" />
                    }
                  </button>

                  {/* Text input */}
                  <input
                    type="text"
                    value={typedInput}
                    onChange={e => setTypedInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitText()}
                    placeholder={status === "listening" ? "Listening…" : "Or type here…"}
                    disabled={busy}
                    className="flex-1 bg-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 outline-none border border-zinc-700 focus:border-violet-500 placeholder:text-zinc-600 disabled:opacity-50 transition-colors"
                  />

                  {/* Send button */}
                  <button
                    onClick={submitText}
                    disabled={!typedInput.trim() || busy}
                    className="w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

                {!voicesReady && !muted && (
                  <p className="text-[9px] text-zinc-600 mt-1 text-center">
                    Loading voices for speech output…
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
