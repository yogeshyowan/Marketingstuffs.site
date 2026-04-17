import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, X, Volume2, VolumeX, Copy, Check, MicOff } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api/";
type Status = "idle" | "listening" | "processing" | "speaking";
interface Result { label: string; text: string; }

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const SECTION_MAP: Record<string, string> = {
  "blog-writer": "#blog-writer", "website-developer": "#website-developer",
  "social-media-section": "#social-media-section", "email-marketing": "#email-marketing",
  "ad-campaigns": "#ad-campaigns", "ai-image": "#ai-image", "ai-video": "#ai-video",
  "ai-voice": "#ai-voice", "yt-growstuffs": "#yt-growstuffs",
  "writing-tools": "#writing-tools", "sms-marketing": "#sms-marketing",
};

const CSS = `
@keyframes va-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
@keyframes va-pulse   { 0%,100%{transform:scale(1.03)} 50%{transform:scale(1.12)} }
@keyframes va-spin    { to{transform:rotate(360deg)} }
@keyframes va-ring    { 0%{transform:scale(1);opacity:.65} 100%{transform:scale(2.4);opacity:0} }
@keyframes va-wave    { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.0);opacity:0} }
@keyframes va-slideup { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes va-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
`;

export default function VoiceAgent() {
  const [open, setOpen]         = useState(false);
  const [status, setStatus]     = useState<Status>("idle");
  const [muted, setMuted]       = useState(false);
  const [userSaid, setUserSaid] = useState("");
  const [interim, setInterim]   = useState("");
  const [aiSaid, setAiSaid]     = useState("Ready. What do you need?");
  const [result, setResult]     = useState<Result | null>(null);
  const [copied, setCopied]     = useState(false);
  const [micError, setMicError] = useState("");

  const statusRef    = useRef<Status>("idle");
  const openRef      = useRef(false);
  const mutedRef     = useRef(false);
  const historyRef   = useRef<Array<{ role: string; content: string }>>([]);
  const recogRef     = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const abortRef     = useRef<AbortController | null>(null);
  const handleRef    = useRef<(t: string) => void>(() => {});
  const startRef     = useRef<() => void>(() => {});

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const supported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById("va-css")) {
      const s = document.createElement("style");
      s.id = "va-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Warm up voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const h = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", h);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", h);
  }, []);

  // ── TTS ───────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!text) { onDone?.(); return; }
    if (mutedRef.current) { setStatus("idle"); onDone?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1.0; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pick = voices.find(v => v.lang === "en-IN")
              || voices.find(v => v.lang.startsWith("en-IN"))
              || voices.find(v => v.lang.startsWith("en-GB"))
              || voices.find(v => v.lang.startsWith("en"));
    if (pick) u.voice = pick;
    let fired = false;
    const done = () => { if (!fired) { fired = true; setStatus("idle"); onDone?.(); } };
    u.onend = done; u.onerror = done;
    // Fallback: don't wait forever — estimate reading time + 1s buffer
    const ms = Math.max(1500, text.split(/\s+/).length * 380) + 1000;
    setTimeout(done, ms);
    setStatus("speaking");
    window.speechSynthesis.speak(u);
  }, []);

  // ── STT ───────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!supported || listeningRef.current) return;
    if (statusRef.current === "processing" || statusRef.current === "speaking") return;

    setMicError("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "en-IN"; r.continuous = false; r.interimResults = true;

    r.onstart  = () => { listeningRef.current = true; setStatus("listening"); setInterim(""); };
    r.onresult = (e: SpeechRecognitionEvent) => {
      let tmp = "", fin = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else tmp += e.results[i][0].transcript;
      }
      setInterim(tmp);
      if (fin.trim()) { setInterim(""); handleRef.current(fin.trim()); }
    };
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      listeningRef.current = false;
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setMicError("Mic access denied. Please allow microphone in your browser.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setMicError(`Mic error: ${e.error}`);
      }
      setStatus("idle");
    };
    r.onend = () => { listeningRef.current = false; if (statusRef.current === "listening") setStatus("idle"); };
    recogRef.current = r;
    try { r.start(); } catch { /* already started */ }
  }, [supported]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    try { recogRef.current?.stop(); recogRef.current?.abort(); } catch { /* ok */ }
    recogRef.current = null;
  }, []);

  useEffect(() => { startRef.current = startListening; }, [startListening]);

  // ── AI call ───────────────────────────────────────────────────────────────
  const handleTranscript = useCallback(async (text: string) => {
    stopListening();
    setStatus("processing");
    setInterim("");
    setUserSaid(text);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE_URL}ai/voice-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, history: historyRef.current }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const d = await res.json() as {
        intent: string; params: Record<string, unknown>;
        spokenResponse: string; result: string; executed: boolean; actionLabel: string;
      };

      // Navigate if needed
      if (d.intent === "navigate" && d.params?.section) {
        const a = SECTION_MAP[String(d.params.section)];
        if (a) document.querySelector(a)?.scrollIntoView({ behavior: "smooth" });
      }

      const spoken  = d.spokenResponse || "Done!";
      const content = d.result?.trim()  || "";

      historyRef.current = [...historyRef.current,
        { role: "user",      content: text },
        { role: "assistant", content: spoken },
      ].slice(-12);

      setAiSaid(spoken);
      if (content) setResult({ label: d.actionLabel || d.intent, text: content });

      speak(spoken, () => { if (openRef.current) setTimeout(() => startRef.current(), 500); });

    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      const msg = "Sorry, couldn't reach the server. Tap the mic and try again.";
      setAiSaid(msg); setStatus("idle");
      speak(msg, () => { if (openRef.current) setTimeout(() => startRef.current(), 600); });
    }
  }, [speak, stopListening]);

  useEffect(() => { handleRef.current = handleTranscript; }, [handleTranscript]);

  // ── Open/close ────────────────────────────────────────────────────────────
  const openAgent = () => {
    setOpen(true); setStatus("idle");
    setUserSaid(""); setInterim(""); setMicError("");
    // Start listening immediately — don't wait for TTS
    setTimeout(() => startRef.current(), 200);
    // Speak greeting in parallel (non-blocking)
    setTimeout(() => {
      if (!mutedRef.current) speak("Ready. What would you like to create?");
    }, 100);
  };

  const closeAgent = () => {
    stopListening(); window.speechSynthesis.cancel();
    setOpen(false); setStatus("idle"); setInterim("");
    abortRef.current?.abort();
  };

  // Tap orb to toggle mic
  const tapOrb = () => {
    if (status === "listening") { stopListening(); setStatus("idle"); }
    else if (status === "idle") startRef.current();
  };

  useEffect(() => () => {
    stopListening(); window.speechSynthesis.cancel(); abortRef.current?.abort();
  }, [stopListening]);

  if (!supported) return null;

  // ── Orb visuals ───────────────────────────────────────────────────────────
  const orbColor =
    status === "listening"  ? "radial-gradient(circle at 38% 35%, #f87171, #dc2626, #991b1b)" :
    status === "processing" ? "radial-gradient(circle at 38% 35%, #fcd34d, #f59e0b, #b45309)" :
    status === "speaking"   ? "radial-gradient(circle at 38% 35%, #93c5fd, #3b82f6, #1e40af)" :
                              "radial-gradient(circle at 38% 35%, #c4b5fd, #7c3aed, #3b0764)";

  const orbAnim =
    status === "listening" ? "va-pulse 0.55s ease-in-out infinite" :
    status === "speaking"  ? "va-pulse 0.85s ease-in-out infinite" :
    status === "idle"      ? "va-breathe 3.2s ease-in-out infinite" : "none";

  const glowColor =
    status === "listening"  ? "#ef444466" :
    status === "processing" ? "#f59e0b55" :
    status === "speaking"   ? "#3b82f666" : "#7c3aed44";

  const ringKeyframe = status === "listening" ? "va-ring" : status === "speaking" ? "va-wave" : null;
  const ringBorder   = status === "listening" ? "#f87171" : "#60a5fa";

  const statusLabel =
    status === "listening"  ? "Listening…" :
    status === "processing" ? "Thinking…"  :
    status === "speaking"   ? "Speaking…"  : "Tap orb to speak";

  const statusColor =
    status === "listening"  ? "#f87171" :
    status === "processing" ? "#fbbf24" :
    status === "speaking"   ? "#60a5fa" : "#6b7280";

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={open ? closeAgent : openAgent}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border-2 transition-all duration-300"
        style={{
          background: open ? "#18181b" : "linear-gradient(135deg,#7c3aed,#4c1d95)",
          borderColor: open ? "#3f3f46" : "#8b5cf6",
        }}
        title={open ? "Close voice agent" : "Voice agent"}
      >
        {open ? <X className="w-5 h-5 text-zinc-300" /> : <Mic className="w-5 h-5 text-white" />}
        {!open && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-950" />}
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center select-none"
          style={{ background: "rgba(4,4,12,0.97)", backdropFilter: "blur(20px)" }}>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5">
            <span className="text-[11px] font-semibold text-zinc-600 tracking-[0.2em] uppercase">AI Assistant</span>
            <div className="flex gap-2">
              <button onClick={() => setMuted(m => !m)}
                className="p-2 rounded-full text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={closeAgent}
                className="p-2 rounded-full text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI response */}
          <div className="w-full max-w-sm text-center px-8 mb-12 min-h-[56px]" key={aiSaid}>
            <p className="text-zinc-200 text-base font-light leading-relaxed"
              style={{ animation: "va-fadein 0.4s ease-out" }}>
              {aiSaid}
            </p>
          </div>

          {/* Orb */}
          <div className="relative flex items-center justify-center" style={{ width: 224, height: 224 }}>
            {/* Expanding rings */}
            {ringKeyframe && [0, 400, 800].map(delay => (
              <div key={delay} className="absolute rounded-full" style={{
                width: 224, height: 224,
                border: `1.5px solid ${ringBorder}`,
                animation: `${ringKeyframe} 1.4s ease-out ${delay}ms infinite`,
              }} />
            ))}

            {/* Spinning loader ring (processing) */}
            {status === "processing" && (
              <div className="absolute rounded-full" style={{
                width: 200, height: 200,
                border: "3px solid transparent",
                borderTopColor: "#fbbf24",
                borderRightColor: "#fbbf2433",
                animation: "va-spin 0.9s linear infinite",
              }} />
            )}

            {/* Main orb — tap to toggle mic */}
            <button onClick={tapOrb} className="relative rounded-full flex items-center justify-center"
              style={{
                width: 160, height: 160,
                background: orbColor,
                animation: orbAnim,
                boxShadow: `0 0 48px ${glowColor}, 0 0 96px ${glowColor}55`,
              }}>
              {/* Icon inside orb */}
              {status === "processing" ? (
                <div className="flex gap-1.5 items-center">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="w-1 rounded-full bg-white/80"
                      style={{ height: `${10 + (i%2)*8}px`, animation: `va-breathe 0.6s ${i*120}ms ease-in-out infinite` }} />
                  ))}
                </div>
              ) : status === "speaking" ? (
                <div className="flex gap-1.5 items-end">
                  {[8,13,9,14,10,12,8].map((h, i) => (
                    <div key={i} className="w-1 rounded-full bg-white/90"
                      style={{ height: `${h}px`, animation: `va-breathe 0.5s ${i*80}ms ease-in-out infinite alternate` }} />
                  ))}
                </div>
              ) : status === "listening" ? (
                <div className="flex gap-1.5 items-end">
                  {[6,11,8,14,7,10,6].map((h, i) => (
                    <div key={i} className="w-1 rounded-full bg-white/90"
                      style={{ height: `${h}px`, animation: `va-pulse 0.4s ${i*60}ms ease-in-out infinite alternate` }} />
                  ))}
                </div>
              ) : (
                <Mic className="w-10 h-10 text-white/90" style={{ filter: "drop-shadow(0 2px 12px rgba(255,255,255,.4))" }} />
              )}
            </button>
          </div>

          {/* Status + transcript */}
          <div className="mt-8 flex flex-col items-center gap-3 min-h-[60px]">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: statusColor }}>
              {statusLabel}
            </p>
            {micError ? (
              <div className="flex items-center gap-2 text-red-400 text-xs text-center max-w-xs">
                <MicOff className="w-3.5 h-3.5 shrink-0" />
                {micError}
              </div>
            ) : (interim || userSaid) && (
              <p className="text-zinc-500 text-sm italic text-center max-w-xs leading-relaxed" key={interim || userSaid}
                style={{ animation: "va-fadein 0.3s ease-out" }}>
                "{interim || userSaid}"
              </p>
            )}
          </div>

          {/* Result sheet */}
          {result && (
            <div className="absolute bottom-0 left-0 right-0 max-h-[45vh] flex flex-col rounded-t-3xl border-t border-zinc-800/80 bg-zinc-950"
              style={{ animation: "va-slideup 0.3s cubic-bezier(.16,1,.3,1)" }}>
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span className="text-xs font-bold text-zinc-300">{result.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { navigator.clipboard.writeText(result.text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-200 font-medium transition-colors">
                    {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                  <button onClick={() => setResult(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="w-8 h-1 rounded-full bg-zinc-800 mx-auto mb-2" />
              <div className="flex-1 overflow-y-auto px-5 pb-4">
                <pre className="text-zinc-300 text-[13px] font-sans whitespace-pre-wrap leading-relaxed">{result.text}</pre>
              </div>
              <p className="text-center text-[10px] text-zinc-700 pb-3 px-4">
                Say "make it shorter" · "change tone to casual" · "add a call to action" · "copy it"
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
