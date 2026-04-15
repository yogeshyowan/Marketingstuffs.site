import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Play, Pause, Square, Download, RefreshCw, Sparkles, Loader2,
  Volume2, Sliders, ChevronDown, Check, Copy, Wand2, Radio, Music2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";

const VOICE_PRESETS = [
  { id: "professional", label: "Professional",  emoji: "💼", desc: "Clear, authoritative tone", rate: 0.9,  pitch: 1.0 },
  { id: "friendly",     label: "Friendly",      emoji: "😊", desc: "Warm, conversational",     rate: 1.0,  pitch: 1.1 },
  { id: "energetic",    label: "Energetic",      emoji: "⚡", desc: "Fast, dynamic & pumped",   rate: 1.2,  pitch: 1.15 },
  { id: "calm",         label: "Calm & Deep",   emoji: "🌊", desc: "Relaxed, deep narration",  rate: 0.8,  pitch: 0.85 },
  { id: "news",         label: "News Anchor",   emoji: "📺", desc: "Formal broadcast style",   rate: 0.95, pitch: 0.95 },
  { id: "storyteller",  label: "Storyteller",   emoji: "📖", desc: "Expressive & dramatic",    rate: 0.85, pitch: 1.05 },
];

const USE_CASES = [
  { id: "blog",     label: "Blog Post",      emoji: "✍️",  sample: "Welcome to our blog post. Today we're exploring the most effective marketing strategies for 2025 that will transform your business growth." },
  { id: "ad",       label: "Ad Script",      emoji: "📣",  sample: "Tired of boring ads that nobody clicks? Marketingstuffs AI creates compelling content that converts. Try it free today." },
  { id: "podcast",  label: "Podcast Intro",  emoji: "🎙️", sample: "Welcome back to The Growth Show — the podcast where we break down what's actually working in digital marketing right now." },
  { id: "explainer",label: "Explainer",      emoji: "🎯",  sample: "Here's how AI is transforming content creation: instead of spending hours writing, you describe what you need and our AI delivers professional content in seconds." },
  { id: "youtube",  label: "YouTube Script", emoji: "🎬",  sample: "What's up everyone! Today I'm going to show you exactly how to grow your channel from zero to ten thousand subscribers in just 90 days." },
  { id: "ebook",    label: "E-Book Narration",emoji: "📚",  sample: "Chapter One: The New Rules of Digital Marketing. The landscape has changed dramatically. Businesses that adapt will thrive; those that don't, won't." },
];

export default function VoiceGeneratorSection() {
  const [text, setText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(VOICE_PRESETS[0]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [wavePhase, setWavePhase] = useState(0);
  const animRef = useRef<number>(0);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
      setVoices(v);
      if (v.length > 0) setSelectedVoice(v[0]);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      const animate = () => {
        setWavePhase(p => p + 0.15);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, isPaused]);

  function applyPreset(preset: typeof VOICE_PRESETS[0]) {
    setSelectedPreset(preset);
    setSpeed(preset.rate);
    setPitch(preset.pitch);
  }

  function handlePlay() {
    if (!text.trim()) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (selectedVoice) utter.voice = selectedVoice;
      utter.rate = speed;
      utter.pitch = pitch;
      utter.volume = 1;
      utter.onstart = () => { setIsPlaying(true); setIsGenerating(false); };
      utter.onend = () => { setIsPlaying(false); setIsPaused(false); };
      utter.onerror = () => { setIsPlaying(false); setIsGenerating(false); };
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
      deductCredits(CREDIT_COSTS.tool_short.cost);
    }, 600);
  }

  function handlePause() {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }

  const bars = Array.from({ length: 40 }, (_, i) => {
    const h = isPlaying && !isPaused
      ? 20 + 60 * Math.abs(Math.sin(wavePhase + i * 0.4)) * Math.abs(Math.sin(i * 0.8))
      : 4;
    return h;
  });

  return (
    <section id="ai-voice" className="py-24 relative overflow-hidden">
      <div className="absolute left-0 top-1/3 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute right-0 bottom-1/4 w-[400px] h-[400px] bg-pink-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="container px-4 mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium mb-5">
            <Mic className="w-4 h-4" />
            AI Voice Studio
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
            Turn Text Into <span className="text-violet-400">Natural Voice</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Convert any text to professional-quality voiceovers. Perfect for videos, podcasts, ads, and e-learning content.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_340px] gap-6">
          {/* Left: Main editor */}
          <div className="space-y-5">
            {/* Use case quick fills */}
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Quick Fill — Use Case</p>
              <div className="flex flex-wrap gap-2">
                {USE_CASES.map(uc => (
                  <button key={uc.id} onClick={() => { setText(uc.sample); setCharCount(uc.sample.length); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/8 text-white/60 hover:text-white hover:border-white/15 transition-all">
                    <span>{uc.emoji}</span> {uc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text area */}
            <div className="glass-card rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-white/80">Your Script</label>
                <span className={`text-xs font-mono ${charCount > 4000 ? "text-red-400" : "text-white/30"}`}>
                  {charCount} / 5000 chars
                </span>
              </div>
              <textarea
                className="w-full bg-black/40 border border-white/8 rounded-xl p-4 text-white placeholder:text-white/20 h-44 focus:outline-none focus:border-violet-500/30 resize-none text-sm leading-relaxed"
                placeholder="Type or paste your script here. Our AI voice will read it naturally with proper pauses, emphasis, and intonation..."
                value={text}
                maxLength={5000}
                onChange={e => { setText(e.target.value); setCharCount(e.target.value.length); }}
              />

              {/* Waveform visualizer */}
              <div className="mt-4 flex items-center justify-center gap-0.5 h-14 overflow-hidden">
                {bars.map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.05, ease: "linear" }}
                    className="w-1 rounded-full bg-gradient-to-t from-violet-600 to-pink-400 opacity-80"
                    style={{ minHeight: 3 }}
                  />
                ))}
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-3 mt-4">
                <Button onClick={handlePlay} disabled={!text.trim() || isGenerating}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold h-11 rounded-xl">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Preparing voice...</>
                    : isPaused ? <><Play className="w-4 h-4 mr-2" fill="white" />Resume</>
                    : isPlaying ? <><Play className="w-4 h-4 mr-2" fill="white" />Playing...</>
                    : <><Play className="w-4 h-4 mr-2" fill="white" />Play Voice</>}
                </Button>
                <Button onClick={handlePause} disabled={!isPlaying || isPaused}
                  variant="outline" className="h-11 px-4 border-white/10 rounded-xl hover:bg-white/5 text-white/60">
                  <Pause className="w-4 h-4" />
                </Button>
                <Button onClick={handleStop} disabled={!isPlaying && !isPaused}
                  variant="outline" className="h-11 px-4 border-white/10 rounded-xl hover:bg-white/5 text-white/60">
                  <Square className="w-4 h-4" />
                </Button>
                <Button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  variant="outline" className="h-11 px-4 border-white/10 rounded-xl hover:bg-white/5 text-white/60">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            {/* Voice Presets */}
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Voice Persona</p>
              <div className="grid grid-cols-2 gap-2">
                {VOICE_PRESETS.map(p => (
                  <button key={p.id} onClick={() => applyPreset(p)}
                    className={`p-2.5 rounded-xl text-xs font-medium transition-all border text-left ${selectedPreset.id === p.id ? "border-violet-500/40 bg-violet-500/10 text-violet-400" : "border-white/8 text-white/50 hover:border-white/15 hover:text-white"}`}>
                    <div className="text-lg mb-1">{p.emoji}</div>
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice selector */}
            {voices.length > 0 && (
              <div className="glass-card rounded-2xl border border-white/10 p-4">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Browser Voice</p>
                <select
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/30"
                  value={selectedVoice?.name ?? ""}
                  onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value) ?? null)}>
                  {voices.map(v => <option key={v.name} value={v.name}>{v.name.replace("Microsoft ", "").replace("Google ", "")}</option>)}
                </select>
              </div>
            )}

            {/* Speed & Pitch */}
            <div className="glass-card rounded-2xl border border-white/10 p-4 space-y-4">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Fine-Tune</p>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-white/60">Speed</span>
                  <span className="text-violet-400 font-mono">{speed.toFixed(1)}x</span>
                </div>
                <input type="range" min="0.5" max="2.0" step="0.05" value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-violet-500" />
                <div className="flex justify-between text-[10px] text-white/20 mt-1">
                  <span>Slow</span><span>Normal</span><span>Fast</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-white/60">Pitch</span>
                  <span className="text-violet-400 font-mono">{pitch.toFixed(2)}</span>
                </div>
                <input type="range" min="0.5" max="2.0" step="0.05" value={pitch}
                  onChange={e => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-violet-500" />
                <div className="flex justify-between text-[10px] text-white/20 mt-1">
                  <span>Low</span><span>Normal</span><span>High</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Estimated</p>
              <div className="space-y-2">
                {[
                  { label: "Reading time", val: charCount > 0 ? `~${Math.ceil(charCount / (200 * speed))} min` : "—" },
                  { label: "Word count", val: charCount > 0 ? `${text.trim().split(/\s+/).filter(Boolean).length} words` : "—" },
                  { label: "Audio length", val: charCount > 0 ? `~${Math.ceil(charCount / (14 * speed))} sec` : "—" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-xs">
                    <span className="text-white/40">{s.label}</span>
                    <span className="text-white/80 font-medium">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features row */}
        <div className="max-w-4xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: "🗣️", title: "Natural Voices", desc: "Human-like intonation & pauses" },
            { emoji: "⚡", title: "Instant Playback", desc: "No waiting, play in real-time" },
            { emoji: "🌐", title: "Multiple Accents", desc: "US, UK, Australian & more" },
            { emoji: "🎙️", title: "Any Content", desc: "Blogs, ads, podcasts, courses" },
          ].map(f => (
            <div key={f.title} className="glass-card rounded-xl border border-white/8 p-4 text-center">
              <div className="text-2xl mb-2">{f.emoji}</div>
              <div className="text-sm font-semibold text-white/80">{f.title}</div>
              <div className="text-xs text-white/40 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
