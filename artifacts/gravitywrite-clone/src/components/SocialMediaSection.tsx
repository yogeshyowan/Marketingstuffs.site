import { useState, useEffect, useRef } from "react";
import { useGenerationGate } from "@/components/GenerationGate";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Plus, Calendar, BarChart2, Hash, Image as ImageIcon,
  Wrench, Loader2, Copy, Check, ChevronLeft, ChevronRight, Trash2,
  Clock, Send, Sparkles, Download, Upload, Zap,
  BookOpen, Edit3, CheckCircle2, AlertCircle, Link2, Search,
  ListOrdered, Users, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  campaignName: string;
  content: string;
  platforms: string[];
  tone: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor?: string;
  createdAt: string;
  hashtags?: string[];
}

interface HashtagSet {
  id: string;
  name: string;
  tags: string[];
}

interface MediaItem {
  id: string;
  name: string;
  dataUrl: string;
  addedAt: string;
}

type Tab = "accounts" | "create" | "calendar" | "dashboard" | "hashtags" | "tools" | "media" | "analytics";

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "Instagram", emoji: "📸", color: "#e1306c", bg: "#fce4ec" },
  { id: "Facebook",  emoji: "👥", color: "#1877f2", bg: "#e3f2fd" },
  { id: "LinkedIn",  emoji: "💼", color: "#0077b5", bg: "#e1f0fa" },
  { id: "X (Twitter)", emoji: "🐦", color: "#1d9bf0", bg: "#e8f5fd" },
  { id: "TikTok",    emoji: "🎵", color: "#010101", bg: "#f5f5f5" },
  { id: "Pinterest", emoji: "📌", color: "#e60023", bg: "#fce4ec" },
];

const TONES = [
  { id: "engaging",      emoji: "🔥", label: "Engaging" },
  { id: "professional",  emoji: "👔", label: "Professional" },
  { id: "humorous",      emoji: "😄", label: "Humorous" },
  { id: "inspirational", emoji: "✨", label: "Inspirational" },
  { id: "educational",   emoji: "🎓", label: "Educational" },
  { id: "urgent",        emoji: "⚡", label: "Urgent / FOMO" },
];

const CONTENT_TYPES = [
  { id: "announcement", emoji: "📢", label: "Announcement" },
  { id: "discount",     emoji: "🎁", label: "Sale / Discount" },
  { id: "product",      emoji: "✨", label: "Product Launch" },
  { id: "tip",          emoji: "💡", label: "Tip / How-To" },
  { id: "testimonial",  emoji: "⭐", label: "Success Story" },
  { id: "event",        emoji: "🎉", label: "Event" },
  { id: "behind",       emoji: "📸", label: "Behind the Scenes" },
  { id: "blog",         emoji: "📝", label: "Blog Post" },
];

const AI_TOOLS = [
  { id: "all-post",    emoji: "🌐", label: "All-in-One Post",        desc: "Generate posts for all platforms at once",            endpoint: "generate-social-post" },
  { id: "instagram",   emoji: "📸", label: "Instagram Caption",     desc: "Hook + story + CTA + 25 hashtags",                   endpoint: "instagram-caption" },
  { id: "hooks",       emoji: "🪝", label: "Hooks Generator",       desc: "6 different scroll-stopping opening hooks",           endpoint: "generate-hooks" },
  { id: "reply-fb",    emoji: "💬", label: "Facebook Responder",    desc: "Engaging replies to comments & messages",             endpoint: "generate-reply" },
  { id: "reply-tw",    emoji: "🐦", label: "Twitter / X Reply",     desc: "Witty, engaging responses to tweets",                endpoint: "generate-reply" },
  { id: "reply-li",    emoji: "💼", label: "LinkedIn Reply",        desc: "Professional replies for LinkedIn",                   endpoint: "generate-reply" },
  { id: "tiktok",      emoji: "🎵", label: "TikTok Caption",        desc: "Short punchy caption with trending hashtags",         endpoint: "tiktok-caption" },
  { id: "reel",        emoji: "🎬", label: "Reel Script",           desc: "Scene-by-scene 15/30/60s video script",              endpoint: "reel-script" },
  { id: "pinterest",   emoji: "📌", label: "Pinterest Tool",        desc: "SEO-rich pin title + description",                   endpoint: "pinterest-post" },
  { id: "repurpose",   emoji: "🔁", label: "Repurpose Content",     desc: "Adapt your post for a different platform",           endpoint: "repurpose-post" },
  { id: "calendar",    emoji: "📅", label: "Content Calendar",      desc: "4-week AI content plan for your brand",              endpoint: "content-calendar" },
];

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "accounts",  label: "Connect Accounts", icon: <Link2 size={16} /> },
  { id: "create",    label: "Create Post",      icon: <Plus size={16} /> },
  { id: "calendar",  label: "Calendar",         icon: <Calendar size={16} /> },
  { id: "dashboard", label: "Dashboard",        icon: <ListOrdered size={16} /> },
  { id: "hashtags",  label: "Hashtag Manager",  icon: <Hash size={16} /> },
  { id: "tools",     label: "AI Tools Hub",     icon: <Wrench size={16} /> },
  { id: "media",     label: "Media Library",    icon: <ImageIcon size={16} /> },
  { id: "analytics", label: "Analytics",        icon: <BarChart2 size={16} /> },
];

// ── SSE streaming helper ──────────────────────────────────────────────────────

async function streamAI(
  endpoint: string,
  body: Record<string, string | boolean | string[]>,
  onChunk: (t: string) => void,
  onDone: () => void,
  onError: (m: string) => void
) {
  const r = await fetch(`/api/ai/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!r.ok || !r.body) { onError("Network error – please try again."); return; }
  const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const ev = JSON.parse(line.slice(6));
        if (ev.error) { onError(ev.error); return; }
        if (ev.done)  { onDone(); return; }
        if (ev.content) onChunk(ev.content);
      } catch { /* skip */ }
    }
  }
}

// ── Storage hooks ─────────────────────────────────────────────────────────────

function useLS<T>(key: string, init: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ConnectedAccount { id: string; connected: boolean; handle: string; timezone: string }

export default function SocialMediaSection() {
  const [tab, setTab] = useState<Tab>("accounts");
  const [posts, setPosts] = useLS<Post[]>("growbiz_posts", []);
  const [hashtagSets, setHashtagSets] = useLS<HashtagSet[]>("growbiz_hashtags", []);
  const [media, setMedia] = useLS<MediaItem[]>("growbiz_media", []);
  const [accounts, setAccounts] = useLS<ConnectedAccount[]>("growbiz_accounts", 
    PLATFORMS.map(p => ({ id: p.id, connected: false, handle: "", timezone: "UTC-5" }))
  );

  const addPost = (p: Post) => setPosts(prev => [p, ...prev]);
  const deletePost = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));
  const updatePost = (id: string, changes: Partial<Post>) =>
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  const duplicatePost = (id: string) => {
    const orig = posts.find(p => p.id === id);
    if (!orig) return;
    addPost({ ...orig, id: crypto.randomUUID(), status: "draft", createdAt: new Date().toISOString(), campaignName: orig.campaignName + " (Copy)" });
  };

  const connectedCount = accounts.filter(a => a.connected).length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" id="social-media">
      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-pink-400" />
            <span className="text-white font-bold">Gravity Social</span>
            <span className="text-slate-500 text-sm">— Social Media Management</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{connectedCount} accounts connected</span>
            <span>{posts.filter(p => p.status === "published").length} published</span>
            <span>{posts.filter(p => p.status === "scheduled").length} scheduled</span>
            <span>{posts.filter(p => p.status === "draft").length} drafts</span>
          </div>
        </div>
      </div>

      {/* Phase indicator strip */}
      <div className="bg-slate-900/50 border-b border-slate-800/50 px-4 py-1.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 text-xs text-slate-600">
          {["1 Setup","2 Create","3 Schedule","4 Calendar","5 Dashboard","—","6 Media","7 Analytics"].map((p, i) => (
            <span key={i} className={i % 2 === 1 ? "text-slate-700" : ""}>{p}</span>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-pink-500 text-white font-medium" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              {t.icon} {t.label}
              {t.id === "accounts" && connectedCount > 0 && <span className="ml-1 bg-green-500 text-black text-xs px-1.5 rounded-full font-bold">{connectedCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === "accounts"  && <ConnectAccounts accounts={accounts} onUpdate={setAccounts} onNext={() => setTab("create")} />}
            {tab === "create"    && <CreatePost onSave={addPost} connectedPlatforms={accounts.filter(a => a.connected).map(a => a.id)} />}
            {tab === "calendar"  && <ContentCalendar posts={posts} onSchedule={addPost} />}
            {tab === "dashboard" && <PostDashboard posts={posts} onDelete={deletePost} onUpdate={updatePost} onDuplicate={duplicatePost} />}
            {tab === "hashtags"  && <HashtagMgr sets={hashtagSets} onUpdate={setHashtagSets} />}
            {tab === "tools"     && <AIToolsHub />}
            {tab === "media"     && <MediaLib items={media} onUpdate={setMedia} />}
            {tab === "analytics" && <Analytics posts={posts} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── CONNECT ACCOUNTS (Phase 1) ────────────────────────────────────────────────

const TIMEZONES = ["UTC-8 (PST)","UTC-7 (MST)","UTC-6 (CST)","UTC-5 (EST)","UTC+0 (GMT)","UTC+1 (CET)","UTC+5:30 (IST)","UTC+8 (CST/SGT)","UTC+9 (JST)","UTC+10 (AEST)"];

const PLATFORM_META: Record<string, {
  loginUrl: string; devUrl: string; color: string; gradient: string;
  authNote: string; handlePrefix: string;
}> = {
  "Instagram": {
    loginUrl: "https://www.instagram.com/accounts/login/",
    devUrl: "https://developers.facebook.com/apps/",
    color: "#e1306c",
    gradient: "from-purple-600 via-pink-500 to-orange-400",
    authNote: "Instagram publishing uses the Instagram Graph API via Facebook Developer App.",
    handlePrefix: "@",
  },
  "Facebook": {
    loginUrl: "https://www.facebook.com/login/",
    devUrl: "https://developers.facebook.com/apps/",
    color: "#1877f2",
    gradient: "from-blue-700 to-blue-500",
    authNote: "Facebook Pages API — requires a Facebook Developer app with pages_manage_posts permission.",
    handlePrefix: "fb.com/",
  },
  "LinkedIn": {
    loginUrl: "https://www.linkedin.com/login",
    devUrl: "https://www.linkedin.com/developers/apps",
    color: "#0077b5",
    gradient: "from-blue-600 to-sky-500",
    authNote: "LinkedIn requires a Developer App with w_member_social permission to publish posts.",
    handlePrefix: "in/",
  },
  "X (Twitter)": {
    loginUrl: "https://x.com/login",
    devUrl: "https://developer.twitter.com/en/portal/projects-and-apps",
    color: "#1d9bf0",
    gradient: "from-sky-500 to-blue-400",
    authNote: "X API v2 — requires a Developer App with Read & Write permissions.",
    handlePrefix: "@",
  },
  "TikTok": {
    loginUrl: "https://www.tiktok.com/login",
    devUrl: "https://developers.tiktok.com/",
    color: "#010101",
    gradient: "from-slate-900 to-slate-700",
    authNote: "TikTok for Developers — requires an app with video.publish scope.",
    handlePrefix: "@",
  },
  "Pinterest": {
    loginUrl: "https://www.pinterest.com/login/",
    devUrl: "https://developers.pinterest.com/apps/",
    color: "#e60023",
    gradient: "from-red-600 to-rose-500",
    authNote: "Pinterest API v5 — requires an app with boards:read and pins:write scope.",
    handlePrefix: "@",
  },
};

type ConnectState = "idle" | "window_open" | "confirming" | "connected";

function ConnectAccounts({
  accounts, onUpdate, onNext
}: {
  accounts: ConnectedAccount[];
  onUpdate: React.Dispatch<React.SetStateAction<ConnectedAccount[]>>;
  onNext: () => void;
}) {
  const [states, setStates] = useState<Record<string, ConnectState>>(() =>
    Object.fromEntries(accounts.map(a => [a.id, a.connected ? "connected" : "idle"]))
  );
  const [handles, setHandles] = useState<Record<string, string>>(() =>
    Object.fromEntries(accounts.map(a => [a.id, a.handle]))
  );
  const [timezones, setTimezones] = useState<Record<string, string>>(() =>
    Object.fromEntries(accounts.map(a => [a.id, a.timezone ?? "UTC-5 (EST)"]))
  );
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const setState = (id: string, s: ConnectState) =>
    setStates(prev => ({ ...prev, [id]: s }));

  const openLogin = (pl: typeof PLATFORMS[0]) => {
    const meta = PLATFORM_META[pl.id];
    window.open(meta.loginUrl, `connect_${pl.id}`, "width=520,height=680,scrollbars=yes,resizable=yes");
    setState(pl.id, "window_open");
  };

  const confirmConnected = (id: string) => {
    setState(id, "connected");
    onUpdate(prev => prev.map(a => a.id === id ? { ...a, connected: true, handle: handles[id] ?? "", timezone: timezones[id] ?? "UTC-5 (EST)" } : a));
  };

  const disconnect = (id: string) => {
    setState(id, "idle");
    onUpdate(prev => prev.map(a => a.id === id ? { ...a, connected: false, handle: "" } : a));
  };

  const connectedCount = Object.values(states).filter(s => s === "connected").length;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-xl mb-1">Phase 1 — Connect Your Accounts</h2>
        <p className="text-slate-400 text-sm">Log in to each platform below, authorize GravitySocial, then confirm here. Connected accounts are auto-selected when you create posts.</p>
      </div>

      {/* How OAuth works banner */}
      <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4">
        <button
          onClick={() => setShowHowItWorks(p => !p)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-blue-400">ℹ️</span>
            <span className="text-blue-300 text-sm font-medium">How account connections work</span>
          </div>
          <span className="text-blue-500 text-xs">{showHowItWorks ? "Hide ▲" : "Show ▼"}</span>
        </button>
        {showHowItWorks && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2 text-slate-400 text-xs">
            <p><span className="text-white font-medium">Step 1:</span> Click <em>"Log in to [Platform]"</em> — a login window opens on that platform's official site.</p>
            <p><span className="text-white font-medium">Step 2:</span> Sign in with your account and, if prompted, authorize GravitySocial to manage your posts.</p>
            <p><span className="text-white font-medium">Step 3:</span> Return here, enter your handle, and click <em>"Confirm Connection"</em>.</p>
            <div className="mt-3 p-3 bg-amber-950/40 border border-amber-800/30 rounded-lg">
              <p className="text-amber-300 font-medium text-xs mb-1">⚠️ For Direct Publishing (API access)</p>
              <p className="text-amber-400/80 text-xs">Automated publishing requires a registered Developer App on each platform with the correct OAuth scopes. Click <em>"Developer Docs →"</em> on any platform to set this up. Without API credentials, this tool manages your content planning — you copy and paste to publish.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Platform cards */}
      <div className="space-y-3">
        {PLATFORMS.map(pl => {
          const meta = PLATFORM_META[pl.id];
          const state = states[pl.id] ?? "idle";
          return (
            <div
              key={pl.id}
              className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${state === "connected" ? "border-green-600/50" : state === "window_open" || state === "confirming" ? "border-yellow-600/50" : "border-slate-800"}`}
            >
              {/* Card header */}
              <div className="flex items-center gap-4 p-4">
                {/* Platform icon with gradient bg */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl shrink-0`}>
                  {pl.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{pl.id}</p>
                  <p className="text-slate-500 text-xs">
                    {state === "connected"
                      ? <span className="text-green-400">✓ Connected{handles[pl.id] ? ` as ${meta.handlePrefix}${handles[pl.id]}` : ""}</span>
                      : state === "window_open"
                      ? <span className="text-yellow-400 animate-pulse">⏳ Waiting for authorization…</span>
                      : state === "confirming"
                      ? <span className="text-yellow-300">Enter your handle to confirm</span>
                      : "Not connected"}
                  </p>
                </div>

                {/* Action button */}
                <div className="flex items-center gap-2 shrink-0">
                  {state === "idle" && (
                    <button
                      onClick={() => openLogin(pl)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      <Link2 size={13} /> Log in to {pl.id} →
                    </button>
                  )}
                  {state === "window_open" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setState(pl.id, "confirming")}
                        className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                      >
                        <Check size={13} /> I've logged in →
                      </button>
                      <button onClick={() => setState(pl.id, "idle")} className="text-slate-500 hover:text-white text-xs px-2">Cancel</button>
                    </div>
                  )}
                  {state === "confirming" && (
                    <button
                      onClick={() => confirmConnected(pl.id)}
                      disabled={!handles[pl.id]}
                      className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                    >
                      <CheckCircle2 size={13} /> Confirm Connection
                    </button>
                  )}
                  {state === "connected" && (
                    <button
                      onClick={() => disconnect(pl.id)}
                      className="text-slate-500 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-800 transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded: handle + timezone + dev docs */}
              {(state === "confirming" || state === "connected") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-xs mb-1.5 block">Your {pl.id} username</label>
                      <div className="flex items-center bg-slate-800 border border-slate-600 rounded-xl overflow-hidden focus-within:border-pink-500 transition-colors">
                        <span className="text-slate-500 text-sm pl-3">{meta.handlePrefix}</span>
                        <input
                          className="flex-1 bg-transparent px-2 py-2 text-white text-sm placeholder-slate-500 focus:outline-none"
                          placeholder={`username`}
                          value={handles[pl.id] ?? ""}
                          onChange={e => setHandles(p => ({ ...p, [pl.id]: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs mb-1.5 block">Posting Time Zone</label>
                      <select
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                        value={timezones[pl.id] ?? "UTC-5 (EST)"}
                        onChange={e => {
                          setTimezones(p => ({ ...p, [pl.id]: e.target.value }));
                          if (state === "connected") onUpdate(prev => prev.map(a => a.id === pl.id ? { ...a, timezone: e.target.value } : a));
                        }}
                      >
                        {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2">
                    <p className="text-slate-500 text-xs">{meta.authNote}</p>
                    <a
                      href={meta.devUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap ml-3 flex items-center gap-0.5 transition-colors"
                    >
                      Developer Docs <span className="text-slate-600">↗</span>
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Idle: show login button + quick link */}
              {state === "idle" && (
                <div className="px-4 pb-3 flex items-center justify-between">
                  <p className="text-slate-600 text-xs">{meta.authNote}</p>
                  <a
                    href={meta.devUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500/60 hover:text-blue-400 text-xs whitespace-nowrap ml-3 transition-colors"
                  >
                    Developer Docs ↗
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status footer */}
      <div className={`rounded-2xl p-5 border transition-all ${connectedCount > 0 ? "bg-green-950/30 border-green-800/40" : "bg-slate-900 border-slate-800"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">
              {connectedCount === 0 ? "No accounts connected yet" : `${connectedCount} account${connectedCount > 1 ? "s" : ""} connected`}
            </p>
            {connectedCount > 0 && (
              <p className="text-slate-400 text-sm mt-0.5">
                {PLATFORMS.filter(p => states[p.id] === "connected").map(p => `${p.emoji} ${p.id}`).join("  ·  ")}
              </p>
            )}
          </div>
          <Button
            onClick={onNext}
            className={`font-bold px-5 ${connectedCount > 0 ? "bg-pink-600 hover:bg-pink-500" : "bg-slate-700 hover:bg-slate-600"}`}
          >
            {connectedCount > 0 ? "Start Creating →" : "Skip for now →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── CREATE POST ───────────────────────────────────────────────────────────────

function CreatePost({ onSave, connectedPlatforms = [] }: { onSave: (p: Post) => void; connectedPlatforms?: string[] }) {
  const { requestGeneration } = useGenerationGate();
  const defaultPlatforms = connectedPlatforms.length > 0 ? connectedPlatforms : ["Instagram", "LinkedIn"];
  const [campaignName, setCampaignName] = useState("");
  const [contentType, setContentType] = useState("announcement");
  const [summary, setSummary] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(defaultPlatforms);
  const [tone, setTone] = useState("engaging");
  const [scheduleDate, setScheduleDate] = useState("");
  const [queueMode, setQueueMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Record<string, string>>({});
  const [activePlatform, setActivePlatform] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedId, setSavedId] = useState("");

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const generate = async () => {
    if (!summary || !selectedPlatforms.length) return;
    setIsGenerating(true);
    setGeneratedPosts({});
    const topic = `Campaign: ${campaignName || "Untitled"}\nType: ${CONTENT_TYPES.find(c => c.id === contentType)?.label}\n${summary}`;
    try {
      const r = await fetch("/api/ai/generate-social-post", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platforms: selectedPlatforms, tone: TONES.find(t => t.id === tone)?.label ?? tone, includeEmojis: true, hashtagCount: 5, postLength: "medium" }),
      });
      const data = await r.json() as { posts?: Array<{ platform: string; content: string; hashtags: string[] }> };
      const map: Record<string, string> = {};
      data.posts?.forEach(p => { map[p.platform] = p.content + (p.hashtags?.length ? "\n\n" + p.hashtags.map(h => `#${h}`).join(" ") : ""); });
      setGeneratedPosts(map);
      setActivePlatform(selectedPlatforms[0]);
    } finally { setIsGenerating(false); }
  };

  const savePost = (status: Post["status"]) => {
    const post: Post = {
      id: crypto.randomUUID(), campaignName: campaignName || "Untitled Campaign",
      content: generatedPosts[activePlatform] ?? Object.values(generatedPosts)[0] ?? summary,
      platforms: selectedPlatforms, tone, status,
      scheduledFor: scheduleDate || undefined, createdAt: new Date().toISOString(),
    };
    onSave(post);
    const id = post.id; setSavedId(id);
    setTimeout(() => setSavedId(""), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1">Create Post</h2>
        <p className="text-slate-400 text-sm">Step 2: Create or generate content for your social channels</p>
      </div>

      {/* Campaign name */}
      <div>
        <label className="text-slate-300 text-sm font-medium mb-1.5 block">Campaign Name</label>
        <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors" placeholder="e.g. Summer Sale 2025, Product Launch Week..." value={campaignName} onChange={e => setCampaignName(e.target.value)} />
      </div>

      {/* Content type */}
      <div>
        <label className="text-slate-300 text-sm font-medium mb-2 block">Content Type</label>
        <div className="grid grid-cols-4 gap-2">
          {CONTENT_TYPES.map(ct => (
            <button key={ct.id} onClick={() => setContentType(ct.id)} className={`p-2.5 rounded-xl border text-center transition-all text-sm ${contentType === ct.id ? "border-pink-500 bg-pink-500/20 text-white" : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500"}`}>
              <div className="text-xl mb-0.5">{ct.emoji}</div>
              <div className="text-xs font-medium">{ct.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div>
        <label className="text-slate-300 text-sm font-medium mb-1.5 block">What to Post About</label>
        <textarea className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none transition-colors" placeholder="Describe what your post is about — the more detail, the better the AI output. E.g. We're offering 40% off all plans this weekend only with code SAVE40..." rows={3} value={summary} onChange={e => setSummary(e.target.value)} />
      </div>

      {/* Platforms + Tone */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-slate-300 text-sm font-medium mb-2 block">Platforms</label>
          <div className="space-y-1.5">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => togglePlatform(p.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${selectedPlatforms.includes(p.id) ? "border-pink-500 bg-pink-500/20 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                <span>{p.emoji}</span> <span>{p.id}</span>
                {selectedPlatforms.includes(p.id) && <CheckCircle2 size={13} className="ml-auto text-pink-400" />}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-medium mb-2 block">Tone</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-all ${tone === t.id ? "border-pink-500 bg-pink-500/20 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1.5 block">Schedule (optional)</label>
            <input type="datetime-local" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500 transition-colors" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
          </div>
          <Button onClick={() => requestGeneration(generate)} disabled={!summary || !selectedPlatforms.length || isGenerating} className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-40 font-bold py-3">
            {isGenerating ? <><Loader2 size={15} className="animate-spin mr-2" />Generating...</> : <><Sparkles size={15} className="mr-2" />Generate Posts</>}
          </Button>
        </div>
      </div>

      {/* Generated output */}
      <AnimatePresence>
        {Object.keys(generatedPosts).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Generated Posts</h3>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { navigator.clipboard.writeText(generatedPosts[activePlatform] ?? ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
                  {copied ? <><Check size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
                <button onClick={() => savePost("draft")} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
                  <BookOpen size={12} /> Save Draft
                </button>
                <button
                  onClick={() => { setQueueMode(true); savePost("scheduled"); }}
                  title="Add to auto-queue — picks the best next time slot"
                  className="flex items-center gap-1.5 text-blue-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-blue-800 hover:bg-blue-800/40 transition-colors"
                >
                  <RefreshCw size={12} /> Add to Queue
                </button>
                <button onClick={() => savePost(scheduleDate ? "scheduled" : "published")} className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                  {savedId ? <><Check size={12} /> Saved!</> : scheduleDate ? <><Clock size={12} /> Schedule</> : <><Send size={12} /> Publish</>}
                </button>
              </div>
            </div>
            {/* Platform tabs */}
            <div className="flex gap-2 flex-wrap">
              {selectedPlatforms.filter(p => generatedPosts[p]).map(p => {
                const pl = PLATFORMS.find(x => x.id === p)!;
                return (
                  <button key={p} onClick={() => setActivePlatform(p)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activePlatform === p ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}>
                    {pl.emoji} {p}
                  </button>
                );
              })}
            </div>
            {/* Post preview */}
            <textarea
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-pink-500"
              rows={8}
              value={generatedPosts[activePlatform] ?? ""}
              onChange={e => setGeneratedPosts(prev => ({ ...prev, [activePlatform]: e.target.value }))}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── CONTENT CALENDAR ──────────────────────────────────────────────────────────

function ContentCalendar({ posts, onSchedule }: { posts: Post[]; onSchedule: (p: Post) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calPlan, setCalPlan] = useState<null | { weeks: CalWeek[] }>(null);
  const [loadingCal, setLoadingCal] = useState(false);
  const [bizName, setBizName] = useState("");
  const [industry, setIndustry] = useState("");

  interface CalPost { day: string; platform: string; type: string; topic: string; hook: string; hashtags: string[] }
  interface CalWeek { week: number; theme: string; posts: CalPost[] }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const scheduledDays: Record<string, Post[]> = {};
  posts.filter(p => p.scheduledFor).forEach(p => {
    const d = p.scheduledFor!.slice(0, 10);
    scheduledDays[d] = [...(scheduledDays[d] ?? []), p];
  });

  const generateCal = async () => {
    if (!bizName) return;
    setLoadingCal(true);
    try {
      const r = await fetch("/api/ai/content-calendar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: bizName, industry, postsPerWeek: "5", platforms: "Instagram,LinkedIn,Twitter" }),
      });
      const data = await r.json();
      setCalPlan(data);
    } finally { setLoadingCal(false); }
  };

  const platformColor: Record<string, string> = {
    Instagram: "#e1306c", Facebook: "#1877f2", LinkedIn: "#0077b5",
    "X (Twitter)": "#1d9bf0", TikTok: "#010101", Pinterest: "#e60023",
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl mb-1">Content Calendar</h2>
          <p className="text-slate-400 text-sm">Step 3: Schedule & plan your posts visually</p>
        </div>
      </div>

      {/* Monthly calendar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><ChevronLeft size={16} /></button>
          <h3 className="text-white font-semibold">{monthName}</h3>
          <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="text-slate-500 text-xs text-center py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayPosts = scheduledDays[dateStr] ?? [];
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
            return (
              <div key={day} className={`min-h-[64px] rounded-lg p-1.5 border transition-colors ${isToday ? "border-pink-500 bg-pink-500/10" : "border-slate-800 hover:border-slate-600"}`}>
                <div className={`text-xs font-medium mb-1 ${isToday ? "text-pink-400" : "text-slate-400"}`}>{day}</div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map(post => {
                    const pl = PLATFORMS.find(p => post.platforms[0] === p.id);
                    return (
                      <div key={post.id} className="text-xs px-1 py-0.5 rounded truncate" style={{ background: (pl?.color ?? "#666") + "30", color: pl?.color ?? "#aaa" }}>
                        {pl?.emoji} {post.campaignName.slice(0, 12)}
                      </div>
                    );
                  })}
                  {dayPosts.length > 3 && <div className="text-xs text-slate-500">+{dayPosts.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Calendar Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Sparkles size={16} className="text-pink-400" />Generate 4-Week AI Content Plan</h3>
        <div className="flex gap-3 mb-3">
          <input className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500" placeholder="Business name" value={bizName} onChange={e => setBizName(e.target.value)} />
          <input className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500" placeholder="Industry (e.g. Photography, Fitness)" value={industry} onChange={e => setIndustry(e.target.value)} />
          <Button onClick={generateCal} disabled={!bizName || loadingCal} className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 shrink-0">
            {loadingCal ? <Loader2 size={14} className="animate-spin" /> : <><Zap size={14} className="mr-1" />Generate</>}
          </Button>
        </div>
        {calPlan && (
          <div className="space-y-4 mt-4">
            {calPlan.weeks?.map(week => (
              <div key={week.week}>
                <h4 className="text-pink-400 font-semibold text-sm mb-2">Week {week.week}: {week.theme}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {week.posts?.map((post, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-xs">{post.day} · {post.platform}</span>
                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{post.type}</span>
                      </div>
                      <p className="text-white text-sm font-medium">{post.topic}</p>
                      <p className="text-slate-400 text-xs mt-1 italic">"{post.hook}"</p>
                      {post.hashtags?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {post.hashtags.map(h => <span key={h} className="text-xs text-pink-400/70">#{h}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── POST DASHBOARD ────────────────────────────────────────────────────────────

function PostDashboard({
  posts, onDelete, onUpdate, onDuplicate
}: {
  posts: Post[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, c: Partial<Post>) => void;
  onDuplicate: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Post["status"] | "all">("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [duplicatedId, setDuplicatedId] = useState<string | null>(null);

  const counts = {
    all: posts.length,
    published: posts.filter(p => p.status === "published").length,
    scheduled:  posts.filter(p => p.status === "scheduled").length,
    draft:      posts.filter(p => p.status === "draft").length,
    failed:     posts.filter(p => p.status === "failed").length,
  };

  const filtered = posts
    .filter(p => filter === "all" || p.status === filter)
    .filter(p => platformFilter === "all" || p.platforms.includes(platformFilter))
    .filter(p => !search || p.campaignName.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()));

  const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    published: { color: "text-green-400", bg: "bg-green-900/30", icon: <CheckCircle2 size={13} /> },
    scheduled: { color: "text-blue-400",  bg: "bg-blue-900/30",  icon: <Clock size={13} /> },
    draft:     { color: "text-slate-400", bg: "bg-slate-800/60", icon: <Edit3 size={13} /> },
    failed:    { color: "text-red-400",   bg: "bg-red-900/30",   icon: <AlertCircle size={13} /> },
  };

  const handleDuplicate = (id: string) => {
    onDuplicate(id);
    setDuplicatedId(id);
    setTimeout(() => setDuplicatedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-5">
        <h2 className="text-white font-bold text-xl mb-1">Phase 5 — Post Dashboard</h2>
        <p className="text-slate-400 text-sm">All posts in one place — published, scheduled, drafts, and failed. Duplicate top performers, fix failures, search and filter.</p>
      </div>

      {/* Search + platform filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500"
            placeholder="Search by campaign name or content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none shrink-0"
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
        >
          <option value="all">All Platforms</option>
          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.id}</option>)}
        </select>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "published", "scheduled", "draft", "failed"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filter === s ? "bg-pink-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-60">({counts[s as keyof typeof counts] ?? 0})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">{search ? "🔍" : "📭"}</div>
          <p className="text-slate-400">{search ? `No posts matching "${search}"` : `No ${filter === "all" ? "" : filter} posts yet.`}</p>
          {!search && <p className="text-slate-500 text-sm mt-1">Create a post in the Create tab to see it here.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(post => {
            const sc = statusConfig[post.status];
            const isExpanded = expandedId === post.id;
            return (
              <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {/* Row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : post.id)}
                >
                  <div className={`flex items-center gap-1 text-xs font-medium min-w-[90px] ${sc.color}`}>
                    {sc.icon} {post.status}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {post.platforms.map(p => { const pl = PLATFORMS.find(x => x.id === p); return <span key={p} title={p}>{pl?.emoji}</span>; })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{post.campaignName}</p>
                    <p className="text-slate-500 text-xs truncate">{post.content.slice(0, 90)}…</p>
                  </div>
                  <div className="text-slate-500 text-xs shrink-0 text-right">
                    {post.scheduledFor
                      ? <><Clock size={10} className="inline mr-0.5" />{new Date(post.scheduledFor).toLocaleDateString()}</>
                      : new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4 border-t border-slate-800 pt-3">
                    <textarea
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 text-sm resize-none focus:outline-none focus:border-pink-500 mb-3"
                      rows={5}
                      defaultValue={post.content}
                      onBlur={e => onUpdate(post.id, { content: e.target.value })}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {(post.status === "draft" || post.status === "scheduled" || post.status === "failed") && (
                        <button onClick={() => onUpdate(post.id, { status: "published" })} className="flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                          <Send size={11} /> Publish Now
                        </button>
                      )}
                      {post.status === "published" && (
                        <button onClick={() => onUpdate(post.id, { status: "draft" })} className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                          <Edit3 size={11} /> Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(post.id)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-white border border-blue-800/60 hover:bg-blue-800/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {duplicatedId === post.id ? <><Check size={11} className="text-green-400" /> Duplicated!</> : <><RefreshCw size={11} /> Duplicate</>}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(post.content); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                        <Copy size={11} /> Copy
                      </button>
                      <button onClick={() => onDelete(post.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-lg transition-colors ml-auto">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                    {post.status === "failed" && (
                      <p className="text-red-400/70 text-xs mt-2.5">⚠️ Post failed. Click "Publish Now" to retry, or duplicate to create a fresh copy.</p>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── HASHTAG MANAGER ───────────────────────────────────────────────────────────

function HashtagMgr({ sets, onUpdate }: { sets: HashtagSet[]; onUpdate: React.Dispatch<React.SetStateAction<HashtagSet[]>> }) {
  const [newName, setNewName] = useState("");
  const [newTags, setNewTags] = useState("");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addSet = () => {
    if (!newName || !newTags) return;
    const tags = newTags.split(/[\s,#]+/).filter(Boolean).map(t => t.replace(/^#/, ""));
    onUpdate(prev => [{ id: crypto.randomUUID(), name: newName, tags }, ...prev]);
    setNewName(""); setNewTags("");
  };

  const generateHashtags = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const r = await fetch("/api/ai/hashtag-suggestions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform }),
      });
      const data = await r.json() as { sets?: Array<{ name: string; tags: string[] }> };
      if (data.sets) {
        const newSets = data.sets.map(s => ({ id: crypto.randomUUID(), name: `${s.name} — ${topic}`, tags: s.tags }));
        onUpdate(prev => [...newSets, ...prev]);
      }
    } finally { setLoading(false); }
  };

  const copySet = (set: HashtagSet) => {
    navigator.clipboard.writeText(set.tags.map(t => `#${t}`).join(" "));
    setCopiedId(set.id); setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1">Hashtag Manager</h2>
        <p className="text-slate-400 text-sm">Save, organize, and deploy your best hashtag sets</p>
      </div>

      {/* AI Generate */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Sparkles size={15} className="text-pink-400" />AI Hashtag Generator</h3>
        <div className="flex gap-2 mb-2">
          <input className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500" placeholder="Topic (e.g. fitness motivation, food photography)" value={topic} onChange={e => setTopic(e.target.value)} />
          <select className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none" value={platform} onChange={e => setPlatform(e.target.value)}>
            {PLATFORMS.map(p => <option key={p.id}>{p.id}</option>)}
          </select>
          <Button onClick={generateHashtags} disabled={!topic || loading} className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 shrink-0">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          </Button>
        </div>
      </div>

      {/* Manual create */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3">Create Hashtag Set</h3>
        <div className="space-y-2">
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500" placeholder="Set name (e.g. Photography - High Volume)" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500" placeholder="Paste hashtags (space or comma separated): photography portrait studio..." value={newTags} onChange={e => setNewTags(e.target.value)} />
          <Button onClick={addSet} disabled={!newName || !newTags} className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40">
            <Plus size={14} className="mr-1" /> Add Set
          </Button>
        </div>
      </div>

      {/* Saved sets */}
      {sets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Saved Sets ({sets.length})</h3>
          {sets.map(set => (
            <div key={set.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium text-sm">{set.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => copySet(set)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 px-2.5 py-1 rounded-lg transition-colors">
                    {copiedId === set.id ? <><Check size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy All</>}
                  </button>
                  <button onClick={() => onUpdate(prev => prev.filter(s => s.id !== set.id))} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {set.tags.map(tag => (
                  <span key={tag} className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xs px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>
              <div className="text-slate-500 text-xs mt-2">{set.tags.length} hashtags</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI TOOLS HUB ──────────────────────────────────────────────────────────────

function AIToolsHub() {
  const [activeTool, setActiveTool] = useState<(typeof AI_TOOLS)[0] | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const setInput = (k: string, v: string) => setInputs(prev => ({ ...prev, [k]: v }));

  const runTool = async () => {
    if (!activeTool) return;
    setLoading(true); setOutput("");
    const body: Record<string, string> = { ...inputs };
    if (activeTool.id === "reply-fb") body.platform = "Facebook";
    if (activeTool.id === "reply-tw") body.platform = "X (Twitter)";
    if (activeTool.id === "reply-li") body.platform = "LinkedIn";

    const isJson = ["hooks", "calendar"].includes(activeTool.id);
    if (isJson) {
      const r = await fetch(`/api/ai/${activeTool.endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      setOutput(JSON.stringify(d, null, 2));
      setLoading(false);
    } else {
      await streamAI(activeTool.endpoint, body, t => setOutput(p => p + t), () => setLoading(false), e => { setOutput(e); setLoading(false); });
    }
  };

  const toolInputs: Record<string, Array<{ key: string; label: string; ph: string; rows?: number; opts?: string[] }>> = {
    "all-post":  [{ key: "topic", label: "What to post about", ph: "Describe your post topic..." , rows: 2 }, { key: "platforms", label: "Platforms", ph: "Instagram, LinkedIn, Twitter" }],
    "instagram": [{ key: "topic", label: "Caption topic", ph: "e.g. launching our new product line" }, { key: "niche", label: "Your niche", ph: "e.g. beauty, fitness, tech" }, { key: "tone", label: "Tone", ph: "engaging", opts: ["engaging","inspirational","educational","humorous"] }],
    "hooks":     [{ key: "topic", label: "Content topic", ph: "e.g. productivity tips for entrepreneurs" }, { key: "contentType", label: "Content type", ph: "post", opts: ["post","reel","story","thread","carousel"] }],
    "reply-fb":  [{ key: "originalPost", label: "Comment / message to reply to", ph: "Paste the comment here...", rows: 2 }, { key: "replyTone", label: "Reply tone", ph: "friendly", opts: ["friendly","professional","empathetic","humorous"] }],
    "reply-tw":  [{ key: "originalPost", label: "Tweet to reply to", ph: "Paste the tweet here..." }, { key: "replyTone", label: "Reply tone", ph: "witty", opts: ["witty","helpful","professional","casual"] }],
    "reply-li":  [{ key: "originalPost", label: "LinkedIn comment to reply to", ph: "Paste the comment here...", rows: 2 }, { key: "replyTone", label: "Reply tone", ph: "professional", opts: ["professional","insightful","warm","concise"] }],
    "tiktok":    [{ key: "topic", label: "Video topic", ph: "e.g. 3 coffee hacks you didn't know" }, { key: "tone", label: "Tone", ph: "trendy", opts: ["trendy","educational","funny","relatable","viral"] }],
    "reel":      [{ key: "topic", label: "Reel topic", ph: "e.g. morning routine for productivity" }, { key: "duration", label: "Duration", ph: "30", opts: ["15","30","60","90"] }, { key: "platform", label: "Platform", ph: "Instagram", opts: ["Instagram","TikTok","YouTube Shorts"] }],
    "pinterest": [{ key: "topic", label: "Pin topic", ph: "e.g. minimalist home office setup ideas" }, { key: "niche", label: "Niche / category", ph: "e.g. home decor, food, DIY" }],
    "repurpose": [{ key: "originalPost", label: "Original post content", ph: "Paste your post here...", rows: 3 }, { key: "fromPlatform", label: "From platform", ph: "Instagram", opts: ["Instagram","LinkedIn","Facebook","Twitter","TikTok"] }, { key: "toPlatform", label: "To platform", ph: "LinkedIn", opts: ["LinkedIn","Instagram","Facebook","Twitter","TikTok","Pinterest"] }],
    "calendar":  [{ key: "businessName", label: "Business name", ph: "e.g. Luna Photography" }, { key: "industry", label: "Industry", ph: "e.g. Photography, Fitness, Food" }, { key: "postsPerWeek", label: "Posts per week", ph: "5", opts: ["3","5","7","10"] }],
  };

  if (activeTool) {
    const fields = toolInputs[activeTool.id] ?? [];
    return (
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => { setActiveTool(null); setOutput(""); setInputs({}); }} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-5 transition-colors">
          <ChevronLeft size={16} /> Back to Tools
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">{activeTool.emoji}</div>
          <div>
            <h2 className="text-white font-bold text-xl">{activeTool.label}</h2>
            <p className="text-slate-400 text-sm">{activeTool.desc}</p>
          </div>
        </div>
        <div className="space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-slate-300 text-sm font-medium mb-1.5 block">{f.label}</label>
              {f.opts ? (
                <select className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500" value={inputs[f.key] ?? f.ph} onChange={e => setInput(f.key, e.target.value)}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : f.rows ? (
                <textarea className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none transition-colors" rows={f.rows} placeholder={f.ph} value={inputs[f.key] ?? ""} onChange={e => setInput(f.key, e.target.value)} />
              ) : (
                <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors" placeholder={f.ph} value={inputs[f.key] ?? ""} onChange={e => setInput(f.key, e.target.value)} />
              )}
            </div>
          ))}
          <Button onClick={runTool} disabled={loading} className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-40 py-3 font-bold">
            {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Generating...</> : <><Sparkles size={15} className="mr-2" />Generate</>}
          </Button>
        </div>
        {output && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 bg-slate-900 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300 text-sm font-medium">Output</span>
              <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 px-2.5 py-1 rounded-lg transition-colors">
                {copied ? <><Check size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>
            <pre className="text-slate-200 text-sm whitespace-pre-wrap font-sans">{output}</pre>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-white font-bold text-xl mb-1">AI Tools Hub</h2>
        <p className="text-slate-400 text-sm">11 specialized AI tools for every social media task</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {AI_TOOLS.map(tool => (
          <button key={tool.id} onClick={() => { setActiveTool(tool); setOutput(""); setInputs({}); }} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 text-left transition-all group">
            <div className="text-3xl mb-3">{tool.emoji}</div>
            <h3 className="text-white font-semibold mb-1 group-hover:text-pink-300 transition-colors">{tool.label}</h3>
            <p className="text-slate-400 text-sm">{tool.desc}</p>
            <div className="flex items-center gap-1 text-pink-500 text-xs mt-3 font-medium">Use Tool <ChevronRight size={12} /></div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MEDIA LIBRARY ─────────────────────────────────────────────────────────────

function MediaLib({ items, onUpdate }: { items: MediaItem[]; onUpdate: React.Dispatch<React.SetStateAction<MediaItem[]>> }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        onUpdate(prev => [{ id: crypto.randomUUID(), name: file.name, dataUrl, addedAt: new Date().toISOString() }, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-5">
        <h2 className="text-white font-bold text-xl mb-1">Media Library</h2>
        <p className="text-slate-400 text-sm">Upload and organize your brand assets — photos, graphics, and videos</p>
      </div>

      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-slate-700 hover:border-pink-500/50 rounded-2xl p-10 text-center cursor-pointer transition-colors mb-6"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={32} className="mx-auto text-slate-500 mb-3" />
        <p className="text-slate-300 font-medium">Click to upload or drag & drop</p>
        <p className="text-slate-500 text-sm mt-1">PNG, JPG, GIF, MP4 up to 10MB</p>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No media uploaded yet</div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">{items.length} item{items.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(item => (
              <div key={item.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden aspect-square">
                <img src={item.dataUrl} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => { const a = document.createElement("a"); a.href = item.dataUrl; a.download = item.name; a.click(); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors">
                    <Download size={14} />
                  </button>
                  <button onClick={() => onUpdate(prev => prev.filter(m => m.id !== item.id))} className="p-2 bg-red-500/70 hover:bg-red-500 rounded-lg text-white transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
                  <p className="text-white text-xs truncate">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

function Analytics({ posts }: { posts: Post[] }) {
  const published = posts.filter(p => p.status === "published");

  const seeded = (seed: number, min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const platformStats = PLATFORMS.map((p, i) => {
    const count = published.filter(post => post.platforms.includes(p.id)).length;
    return {
      ...p,
      posts: count,
      impressions: count * seeded(i + 10, 800, 4500),
      engagement: (seeded(i + 20, 2, 9) + seeded(i + 30, 0, 9) / 10).toFixed(1),
      clicks: count * seeded(i + 40, 30, 200),
    };
  }).filter(p => p.posts > 0);

  const totalPosts = posts.length;
  const totalPublished = published.length;
  const totalScheduled = posts.filter(p => p.status === "scheduled").length;
  const avgEngagement = platformStats.length ? (platformStats.reduce((a, b) => a + parseFloat(b.engagement), 0) / platformStats.length).toFixed(1) : "—";
  const totalImpressions = platformStats.reduce((a, b) => a + b.impressions, 0);

  const bestTimes: Record<string, string[]> = {
    Instagram: ["9–11 AM", "1–3 PM", "7–9 PM"],
    Facebook: ["1–4 PM", "7–9 PM"],
    LinkedIn: ["8–10 AM", "12–1 PM", "5–6 PM"],
    "X (Twitter)": ["9 AM", "12 PM", "5–6 PM"],
    TikTok: ["6–9 PM", "7–9 AM"],
    Pinterest: ["8–11 PM", "2–4 PM"],
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-white font-bold text-xl mb-1">Analytics & Performance</h2>
        <p className="text-slate-400 text-sm">Step 5: Analyze what's working and optimize your strategy</p>
      </div>

      {totalPublished === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-white font-semibold text-lg mb-2">No published posts yet</p>
          <p className="text-slate-400 text-sm">Create and publish posts to see your performance analytics here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Posts", value: totalPosts, color: "text-blue-400", icon: "📝" },
              { label: "Published", value: totalPublished, color: "text-green-400", icon: "✅" },
              { label: "Scheduled", value: totalScheduled, color: "text-yellow-400", icon: "📅" },
              { label: "Avg Engagement", value: `${avgEngagement}%`, color: "text-pink-400", icon: "💬" },
            ].map(card => (
              <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{card.icon}</div>
                <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
                <div className="text-slate-400 text-xs mt-0.5">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Platform performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Platform Performance</h3>
            <div className="space-y-4">
              {platformStats.map(p => {
                const maxImpr = Math.max(...platformStats.map(x => x.impressions), 1);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.emoji}</span>
                        <span className="text-white text-sm font-medium">{p.id}</span>
                        <span className="text-slate-500 text-xs">{p.posts} posts</span>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-400">
                        <span>{p.impressions.toLocaleString()} reach</span>
                        <span>{p.engagement}% engagement</span>
                        <span>{p.clicks} clicks</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(p.impressions / maxImpr) * 100}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-slate-500 text-xs mt-4">* Analytics are simulated estimates. Connect real accounts for live data.</p>
          </div>

          {/* Best posting times */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Best Posting Times</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(bestTimes).map(([platform, times]) => {
                const pl = PLATFORMS.find(p => p.id === platform);
                return (
                  <div key={platform} className="bg-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span>{pl?.emoji}</span>
                      <span className="text-white text-sm font-medium">{platform}</span>
                    </div>
                    <div className="space-y-1">
                      {times.map(t => (
                        <div key={t} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={10} /> {t}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total impressions */}
          {totalImpressions > 0 && (
            <div className="bg-gradient-to-r from-pink-900/30 to-violet-900/30 border border-pink-800/30 rounded-2xl p-5 text-center">
              <div className="text-4xl font-black text-white mb-1">{totalImpressions.toLocaleString()}</div>
              <div className="text-pink-300 text-sm">Total Estimated Impressions</div>
              <div className="text-slate-400 text-xs mt-1">Across {platformStats.length} platform{platformStats.length !== 1 ? "s" : ""}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
