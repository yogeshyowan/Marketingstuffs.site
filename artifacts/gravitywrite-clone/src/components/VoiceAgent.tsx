import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, X, Volume2, VolumeX, Copy, Check } from "lucide-react";

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

// ── CSS animations injected once ──────────────────────────────────────────────
const STYLE = `
@keyframes orb-idle   { 0%,100%{transform:scale(1);opacity:.9}   50%{transform:scale(1.06);opacity:1} }
@keyframes orb-listen { 0%,100%{transform:scale(1.04)} 50%{transform:scale(1.10)} }
@keyframes orb-think  { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
@keyframes ring-out   { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.2);opacity:0} }
@keyframes ring-speak { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.9);opacity:0} }
@keyframes slide-up   { 0%{transform:translateY(100%);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes fade-in    { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes txt-fade   { 0%{opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
`;

function injectStyle() {
  if (document.getElementById("va-style")) return;
  const el = document.createElement("style");
  el.id = "va-style"; el.textContent = STYLE;
  document.head.appendChild(el);
}

export default function VoiceAgent() {
  const [open, setOpen]         = useState(false);
  const [status, setStatus]     = useState<Status>("idle");
  const [muted, setMuted]       = useState(false);
  const [userSaid, setUserSaid] = useState("");
  const [aiSaid, setAiSaid]     = useState("Hi! Tell me what you need. I can write blog posts, social media captions, YouTube scripts, emails, ads — just say the word.");
  const [interim, setInterim]   = useState("");
  const [result, setResult]     = useState<Result | null>(null);
  const [copied, setCopied]     = useState(false);

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

  const supported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => { injectStyle(); }, []);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (mutedRef.current || !text) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1.05; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === "en-IN")
           || voices.find(v => v.lang.startsWith("en-IN"))
           || voices.find(v => v.lang.startsWith("en-GB"))
           || voices.find(v => v.lang.startsWith("en"));
    if (v) u.voice = v;
    let done = false;
    const finish = () => { if (!done) { done = true; setStatus("idle"); onDone?.(); } };
    u.onend = finish; u.onerror = finish;
    setTimeout(finish, Math.max(2500, text.split(" ").length * 420 + 500));
    setStatus("speaking");
    window.speechSynthesis.speak(u);
  }, []);

  // ── STT ────────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!supported || listeningRef.current) return;
    if (statusRef.current === "processing" || statusRef.current === "speaking") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "en-IN"; r.continuous = false; r.interimResults = true;
    r.onstart  = () => { listeningRef.current = true; setStatus("listening"); setInterim(""); };
    r.onresult = (e: SpeechRecognitionEvent) => {
      let tmp = "", fin = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else tmp += t;
      }
      setInterim(tmp);
      if (fin.trim()) { setInterim(""); handleRef.current(fin.trim()); }
    };
    r.onerror  = () => { listeningRef.current = false; setStatus("idle"); };
    r.onend    = () => { listeningRef.current = false; if (statusRef.current === "listening") setStatus("idle"); };
    recogRef.current = r;
    try { r.start(); } catch { /* ignore */ }
  }, [supported]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    try { recogRef.current?.stop(); recogRef.current?.abort(); } catch { /* ignore */ }
    recogRef.current = null;
  }, []);

  useEffect(() => { startRef.current = startListening; }, [startListening]);

  // ── Core handle ────────────────────────────────────────────────────────────
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
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as {
        intent: string; params: Record<string, unknown>;
        spokenResponse: string; result: string; executed: boolean; actionLabel: string;
      };

      if (data.intent === "navigate" && data.params?.section) {
        const a = SECTION_MAP[String(data.params.section)];
        if (a) document.querySelector(a)?.scrollIntoView({ behavior: "smooth" });
      }

      const spoken = data.spokenResponse || "Done!";
      const content = data.result?.trim() || "";

      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: text },
        { role: "assistant", content: spoken + (content ? ` [${data.actionLabel}]` : "") },
      ].slice(-12);

      setAiSaid(spoken);
      if (content) setResult({ label: data.actionLabel || data.intent, text: content });

      speak(spoken, () => { if (openRef.current) setTimeout(() => startRef.current(), 600); });

    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      const errMsg = "Sorry, something went wrong. Please try again.";
      setAiSaid(errMsg);
      setStatus("idle");
      speak(errMsg, () => { if (openRef.current) setTimeout(() => startRef.current(), 800); });
    }
  }, [speak, stopListening]);

  useEffect(() => { handleRef.current = handleTranscript; }, [handleTranscript]);

  // ── Open / close ────────────────────────────────────────────────────────────
  const openAgent = () => {
    setOpen(true); setStatus("idle"); setUserSaid(""); setInterim("");
    setTimeout(() => {
      speak(aiSaid, () => setTimeout(() => startRef.current(), 400));
    }, 300);
  };
  const closeAgent = () => {
    stopListening(); window.speechSynthesis.cancel();
    setOpen(false); setStatus("idle"); setInterim("");
    abortRef.current?.abort();
  };

  useEffect(() => {
    return () => { stopListening(); window.speechSynthesis.cancel(); abortRef.current?.abort(); };
  }, [stopListening]);

  // ── Orb style ───────────────────────────────────────────────────────────────
  const orbGrad =
    status === "listening"  ? "radial-gradient(circle at 40% 40%, #f87171, #ef4444, #b91c1c)" :
    status === "processing" ? "radial-gradient(circle at 40% 40%, #fbbf24, #f59e0b, #d97706)" :
    status === "speaking"   ? "radial-gradient(circle at 40% 40%, #60a5fa, #3b82f6, #1d4ed8)" :
                              "radial-gradient(circle at 40% 40%, #a78bfa, #7c3aed, #4c1d95)";

  const orbAnim =
    status === "listening"  ? "orb-listen 0.6s ease-in-out infinite" :
    status === "processing" ? "none" :
    status === "speaking"   ? "orb-listen 0.8s ease-in-out infinite" :
                              "orb-idle 3s ease-in-out infinite";

  const ringColor =
    status === "listening" ? "#ef4444" : status === "speaking" ? "#3b82f6" : "#7c3aed";
  const ringAnim  = status === "listening" ? "ring-out 1.2s ease-out infinite" :
                    status === "speaking"  ? "ring-speak 1.6s ease-out infinite" : "none";

  if (!supported) return null;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={open ? closeAgent : openAgent}
        className={`
          fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
          border-2 transition-all duration-300
          ${open
            ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            : "bg-gradient-to-br from-violet-600 to-purple-800 border-violet-400 hover:scale-110 active:scale-95"
          }
        `}
        title={open ? "Close voice agent" : "Open voice agent"}
      >
        {open ? <X className="w-5 h-5 text-zinc-300" /> : <Mic className="w-5 h-5 text-white" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-950" />
        )}
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center"
          style={{ background: "rgba(5,5,15,0.96)", backdropFilter: "blur(16px)" }}>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" style={{
                boxShadow: "0 0 6px #7c3aed",
                animation: status === "listening" ? "orb-idle 0.8s infinite" : "orb-idle 2s infinite"
              }} />
              <span className="text-xs font-semibold text-zinc-400 tracking-widest uppercase">
                AI Assistant
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setMuted(m => !m)}
                className="p-2 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={closeAgent}
                className="p-2 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI response text */}
          <div className="w-full max-w-md text-center mb-10 px-8 min-h-[60px]">
            {aiSaid && (
              <p className="text-zinc-200 text-lg font-light leading-relaxed"
                style={{ animation: "fade-in 0.4s ease-out forwards" }}>
                {aiSaid}
              </p>
            )}
          </div>

          {/* ── ORB ────────────────────────────────────────────────────────── */}
          <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
            {/* Ring 1 */}
            <div className="absolute rounded-full" style={{
              width: 220, height: 220,
              border: `1.5px solid ${ringColor}`,
              animation: ringAnim,
              animationDelay: "0s",
              opacity: ringAnim === "none" ? 0 : undefined,
            }} />
            {/* Ring 2 */}
            <div className="absolute rounded-full" style={{
              width: 220, height: 220,
              border: `1.5px solid ${ringColor}`,
              animation: ringAnim,
              animationDelay: "0.4s",
              opacity: ringAnim === "none" ? 0 : undefined,
            }} />
            {/* Ring 3 */}
            <div className="absolute rounded-full" style={{
              width: 220, height: 220,
              border: `1px solid ${ringColor}`,
              animation: ringAnim,
              animationDelay: "0.8s",
              opacity: ringAnim === "none" ? 0 : undefined,
            }} />

            {/* Processing spinner ring */}
            {status === "processing" && (
              <div className="absolute rounded-full" style={{
                width: 200, height: 200,
                border: "3px solid transparent",
                borderTopColor: "#f59e0b",
                borderRightColor: "#f59e0b44",
                animation: "orb-think 1s linear infinite",
              }} />
            )}

            {/* Main orb */}
            <button
              onClick={() => {
                if (status === "listening") { stopListening(); setStatus("idle"); }
                else if (status === "idle") startRef.current();
              }}
              className="relative rounded-full flex items-center justify-center cursor-pointer"
              style={{
                width: 160, height: 160,
                background: orbGrad,
                animation: orbAnim,
                boxShadow: `0 0 40px ${ringColor}55, 0 0 80px ${ringColor}22`,
              }}
            >
              {status === "processing" ? (
                <div className="flex gap-1.5 items-end">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="w-1 rounded-full bg-white/80"
                      style={{ height: `${10 + (i % 2) * 8}px`, animation: `ring-out 0.8s ease-in-out ${i*0.15}s infinite alternate` }} />
                  ))}
                </div>
              ) : status === "speaking" ? (
                <div className="flex gap-1.5 items-end">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="w-1 rounded-full bg-white/90"
                      style={{ height: `${8 + (i % 3) * 7}px`, animation: `ring-speak 0.7s ease-in-out ${i*0.1}s infinite alternate` }} />
                  ))}
                </div>
              ) : (
                <Mic className="w-10 h-10 text-white/90"
                  style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }} />
              )}
            </button>
          </div>

          {/* Status / transcript below orb */}
          <div className="mt-8 min-h-[48px] flex flex-col items-center gap-2">
            <p className="text-sm font-medium tracking-wider uppercase" style={{
              color: status === "listening" ? "#f87171" :
                     status === "processing" ? "#fbbf24" :
                     status === "speaking" ? "#60a5fa" : "#6b7280"
            }}>
              {status === "listening" ? "Listening…" :
               status === "processing" ? "Thinking…" :
               status === "speaking" ? "Speaking…" : "Tap orb to speak"}
            </p>
            {(interim || userSaid) && (
              <p className="text-zinc-500 text-sm italic max-w-xs text-center leading-relaxed"
                style={{ animation: "txt-fade 3s ease forwards" }}>
                "{interim || userSaid}"
              </p>
            )}
          </div>

          {/* ── Generated result sheet ─────────────────────────────────────── */}
          {result && (
            <div className="absolute bottom-0 left-0 right-0 max-h-[42vh] flex flex-col rounded-t-3xl border-t border-zinc-800 bg-zinc-950/98"
              style={{ animation: "slide-up 0.35s cubic-bezier(.16,1,.3,1) forwards" }}>
              {/* Sheet header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span className="text-xs font-semibold text-zinc-300 tracking-wide">{result.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.text);
                      setCopied(true); setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-200 font-medium transition-colors">
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                  <button onClick={() => setResult(null)}
                    className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Drag handle */}
              <div className="flex justify-center pb-1">
                <div className="w-8 h-1 rounded-full bg-zinc-800" />
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 pb-6">
                <pre className="text-zinc-300 text-[13px] font-sans whitespace-pre-wrap leading-relaxed">
                  {result.text}
                </pre>
              </div>
              <p className="text-center text-[10px] text-zinc-700 pb-3">
                Say "copy it" · "make it shorter" · "change the tone" · "close"
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
