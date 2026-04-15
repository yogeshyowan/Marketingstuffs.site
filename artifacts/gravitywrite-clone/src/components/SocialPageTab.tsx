import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, GripVertical, Eye, Copy, Check, ChevronUp, ChevronDown,
  Globe2, Link2, Palette, User, ToggleLeft, ToggleRight, ExternalLink, Sparkles, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────
export interface SocialLink {
  id: string;
  icon: string;
  label: string;
  url: string;
  enabled: boolean;
}

export interface SocialPageData {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  links: SocialLink[];
  theme: {
    backgroundId: string;
    buttonStyle: "filled" | "outlined" | "soft" | "pill";
    accentColor: string;
  };
}

export const SOCIAL_PAGE_KEY = "marketingstuffs_social_page";

export const defaultPage = (): SocialPageData => ({
  username: "mypage",
  displayName: "My Brand",
  bio: "Creator · Marketer · Builder 🚀",
  avatar: "🚀",
  links: [
    { id: "1", icon: "📸", label: "Instagram",  url: "https://instagram.com/",  enabled: true },
    { id: "2", icon: "▶️", label: "YouTube",    url: "https://youtube.com/",    enabled: true },
    { id: "3", icon: "💼", label: "LinkedIn",   url: "https://linkedin.com/in/",enabled: true },
  ],
  theme: { backgroundId: "cosmic", buttonStyle: "pill", accentColor: "#7c3aed" },
});

// ── Theme data ─────────────────────────────────────────────────
const BG_THEMES = [
  { id: "cosmic",     label: "Cosmic",     css: "linear-gradient(135deg,#0f0f1a 0%,#1a0a2e 60%,#0d1a2e 100%)",    text: "white" },
  { id: "sunset",     label: "Sunset",     css: "linear-gradient(135deg,#7f1d1d 0%,#b91c1c 40%,#ea580c 100%)",    text: "white" },
  { id: "ocean",      label: "Ocean",      css: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#0891b2 100%)",    text: "white" },
  { id: "neon",       label: "Neon Purple",css: "linear-gradient(135deg,#2d1b69 0%,#6b21a8 60%,#4c1d95 100%)",   text: "white" },
  { id: "rosegold",   label: "Rose Gold",  css: "linear-gradient(135deg,#9d174d 0%,#db2777 50%,#f472b6 100%)",   text: "white" },
  { id: "forest",     label: "Forest",     css: "linear-gradient(135deg,#14532d 0%,#15803d 60%,#166534 100%)",   text: "white" },
  { id: "light",      label: "Clean White",css: "#f8fafc",                                                         text: "dark"  },
  { id: "midnight",   label: "Midnight",   css: "#0f172a",                                                         text: "white" },
  { id: "peach",      label: "Peach",      css: "linear-gradient(135deg,#fde68a 0%,#fb923c 50%,#f43f5e 100%)",   text: "dark"  },
  { id: "teal",       label: "Teal Wave",  css: "linear-gradient(135deg,#134e4a 0%,#0d9488 60%,#2dd4bf 100%)",   text: "white" },
] as const;

const ACCENT_COLORS = [
  "#7c3aed","#ec4899","#3b82f6","#10b981",
  "#f97316","#ef4444","#f59e0b","#14b8a6",
];

const BUTTON_STYLES = [
  { id: "filled",   label: "Filled",   preview: "bg-violet-600 text-white" },
  { id: "outlined", label: "Outlined", preview: "border-2 border-violet-600 text-violet-600" },
  { id: "soft",     label: "Soft",     preview: "bg-violet-100 text-violet-700" },
  { id: "pill",     label: "Pill",     preview: "bg-violet-600 text-white rounded-full" },
] as const;

const PLATFORM_PRESETS = [
  { icon: "📸", label: "Instagram",  url: "https://instagram.com/" },
  { icon: "▶️", label: "YouTube",   url: "https://youtube.com/" },
  { icon: "🐦", label: "Twitter/X", url: "https://x.com/" },
  { icon: "💼", label: "LinkedIn",  url: "https://linkedin.com/in/" },
  { icon: "📘", label: "Facebook",  url: "https://facebook.com/" },
  { icon: "🎵", label: "TikTok",    url: "https://tiktok.com/@" },
  { icon: "📌", label: "Pinterest", url: "https://pinterest.com/" },
  { icon: "💻", label: "GitHub",    url: "https://github.com/" },
  { icon: "💬", label: "WhatsApp",  url: "https://wa.me/" },
  { icon: "🌐", label: "Website",   url: "https://" },
  { icon: "📧", label: "Email",     url: "mailto:" },
  { icon: "🛍️", label: "Shop",      url: "https://" },
];

const AVATAR_EMOJIS = [
  "🚀","⭐","💡","🔥","💎","🎯","🌟","💪","🎨","📸",
  "🌺","🦋","🐬","🦊","🌙","☀️","🎵","🎬","📝","💼",
  "🏆","🌈","🍀","✨","🎭","🧠","❤️","🦄","🌊","🎪",
];

// ── Phone preview renderer ─────────────────────────────────────
export function SocialPageRenderer({ page }: { page: SocialPageData }) {
  const bg = BG_THEMES.find(b => b.id === page.theme.backgroundId) || BG_THEMES[0];
  const isDark = bg.text === "white";
  const textCls = isDark ? "text-white" : "text-slate-800";
  const subTextCls = isDark ? "text-white/60" : "text-slate-500";

  function btnClass(style: string) {
    const r = style === "pill" ? "rounded-full" : "rounded-xl";
    if (style === "outlined") return `border-2 ${r} font-medium transition-all hover:opacity-80 w-full py-3 text-sm`;
    if (style === "soft") return `${r} font-medium transition-all hover:opacity-80 w-full py-3 text-sm bg-white/15`;
    return `${r} font-medium transition-all hover:opacity-80 w-full py-3 text-sm text-white`;
  }
  function btnStyle(style: string): React.CSSProperties {
    if (style === "outlined") return { borderColor: page.theme.accentColor, color: page.theme.accentColor };
    if (style === "soft")     return { color: page.theme.accentColor };
    return { background: page.theme.accentColor };
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center py-12 px-5" style={{ background: bg.css }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl border-2 border-white/20 mb-1">
          {page.avatar}
        </div>
        {/* Name */}
        <h1 className={`text-xl font-bold ${textCls} text-center`}>{page.displayName || "Your Name"}</h1>
        {/* Username */}
        <p className={`text-xs ${subTextCls} -mt-2`}>@{page.username || "username"}</p>
        {/* Bio */}
        {page.bio && <p className={`text-sm ${subTextCls} text-center max-w-xs leading-relaxed`}>{page.bio}</p>}
        {/* Links */}
        <div className="w-full space-y-3 mt-2">
          {page.links.filter(l => l.enabled && l.url && l.label).map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer"
              className={`flex items-center justify-center gap-2.5 ${btnClass(page.theme.buttonStyle)}`}
              style={btnStyle(page.theme.buttonStyle)}>
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>
        {/* Footer */}
        <p className={`text-xs ${subTextCls} mt-6 opacity-50`}>Made with Marketingstuffs</p>
      </div>
    </div>
  );
}

// ── Main builder component ─────────────────────────────────────
function loadPage(): SocialPageData {
  try { const s = localStorage.getItem(SOCIAL_PAGE_KEY); return s ? JSON.parse(s) : defaultPage(); } catch { return defaultPage(); }
}
function savePage(p: SocialPageData) {
  try { localStorage.setItem(SOCIAL_PAGE_KEY, JSON.stringify(p)); } catch {}
}

export default function SocialPageTab() {
  const [page, setPage_] = useState<SocialPageData>(loadPage);
  const [activeSection, setActiveSection] = useState<"profile" | "links" | "theme">("profile");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [newLinkForm, setNewLinkForm] = useState(false);
  const [newLink, setNewLink] = useState({ icon: "🔗", label: "", url: "" });

  const setPage = useCallback((fn: (p: SocialPageData) => SocialPageData) => {
    setPage_(prev => { const next = fn(prev); savePage(next); return next; });
  }, []);

  const updateField = (field: keyof SocialPageData, val: string) =>
    setPage(p => ({ ...p, [field]: val }));

  const updateTheme = (field: string, val: string) =>
    setPage(p => ({ ...p, theme: { ...p.theme, [field]: val } }));

  const addPlatformLink = (preset: typeof PLATFORM_PRESETS[number]) => {
    setPage(p => ({
      ...p,
      links: [...p.links, { id: Date.now().toString(), icon: preset.icon, label: preset.label, url: preset.url, enabled: true }]
    }));
  };

  const addCustomLink = () => {
    if (!newLink.label || !newLink.url) return;
    setPage(p => ({
      ...p,
      links: [...p.links, { id: Date.now().toString(), ...newLink, enabled: true }]
    }));
    setNewLink({ icon: "🔗", label: "", url: "" });
    setNewLinkForm(false);
  };

  const updateLink = (id: string, changes: Partial<SocialLink>) =>
    setPage(p => ({ ...p, links: p.links.map(l => l.id === id ? { ...l, ...changes } : l) }));

  const deleteLink = (id: string) =>
    setPage(p => ({ ...p, links: p.links.filter(l => l.id !== id) }));

  const moveLink = (id: string, dir: "up" | "down") =>
    setPage(p => {
      const idx = p.links.findIndex(l => l.id === id);
      if ((dir === "up" && idx === 0) || (dir === "down" && idx === p.links.length - 1)) return p;
      const links = [...p.links];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      [links[idx], links[swap]] = [links[swap], links[idx]];
      return { ...p, links };
    });

  const pageUrl = `${window.location.origin}/social/${page.username || "mypage"}`;

  const copyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    savePage(page);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const bg = BG_THEMES.find(b => b.id === page.theme.backgroundId) || BG_THEMES[0];

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Share bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/80 border-b border-slate-800">
        <Globe2 className="w-4 h-4 text-violet-400 shrink-0"/>
        <span className="text-xs text-slate-300 truncate flex-1 font-mono">{pageUrl}</span>
        <button onClick={copyLink}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${copied ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-white/60 hover:text-white border border-white/10"}`}>
          {copied ? <><Check className="w-3 h-3"/>Copied!</> : <><Copy className="w-3 h-3"/>Copy Link</>}
        </button>
        <Button size="sm" onClick={() => setFullPreview(true)}
          className="shrink-0 h-7 px-3 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-lg">
          <Eye className="w-3 h-3 mr-1"/>Preview
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Builder panel ── */}
        <div className="w-full md:w-[55%] flex flex-col overflow-y-auto border-r border-slate-800 bg-slate-950">
          {/* Section nav */}
          <div className="flex border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
            {([["profile","Profile","👤"],["links","Links","🔗"],["theme","Theme","🎨"]] as const).map(([id,label,emoji]) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${activeSection === id ? "text-violet-400 border-b-2 border-violet-500" : "text-slate-500 hover:text-slate-300"}`}>
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5 pb-24">
            {/* ── PROFILE SECTION ── */}
            {activeSection === "profile" && (
              <div className="space-y-5">
                {/* Avatar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Profile Avatar</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setEmojiPickerOpen(o => !o)}
                      className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 hover:border-violet-500 flex items-center justify-center text-3xl transition-all">
                      {page.avatar}
                    </button>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{page.avatar} Emoji Avatar</p>
                      <p className="text-slate-500 text-xs">Click to change emoji</p>
                    </div>
                  </div>
                  <AnimatePresence>
                    {emojiPickerOpen && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="mt-3 p-3 bg-slate-800 rounded-xl border border-slate-700 grid grid-cols-10 gap-1.5">
                        {AVATAR_EMOJIS.map(e => (
                          <button key={e} onClick={() => { updateField("avatar", e); setEmojiPickerOpen(false); }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xl hover:bg-slate-700 transition-colors ${page.avatar === e ? "bg-violet-500/20 ring-1 ring-violet-500" : ""}`}>
                            {e}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Display name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                  <input value={page.displayName} onChange={e => updateField("displayName", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="Your Name or Brand" maxLength={50}/>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Page Username <span className="text-violet-400 normal-case font-normal">(your public URL)</span>
                  </label>
                  <div className="flex items-center gap-0 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden focus-within:border-violet-500 transition-colors">
                    <span className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">/social/</span>
                    <input value={page.username} onChange={e => updateField("username", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      className="flex-1 bg-transparent py-2.5 pr-4 text-white text-sm focus:outline-none"
                      placeholder="username" maxLength={30}/>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">Only letters, numbers, _ and - allowed</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Bio <span className="text-slate-600 normal-case font-normal">{page.bio.length}/160</span>
                  </label>
                  <textarea value={page.bio} onChange={e => updateField("bio", e.target.value.slice(0, 160))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
                    placeholder="Creator · Marketer · Builder 🚀" rows={3} maxLength={160}/>
                </div>
              </div>
            )}

            {/* ── LINKS SECTION ── */}
            {activeSection === "links" && (
              <div className="space-y-5">
                {/* Quick add platforms */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Add Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_PRESETS.map(p => (
                      <button key={p.label} onClick={() => addPlatformLink(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-full text-xs text-white/70 hover:text-white transition-all">
                        <span className="text-sm">{p.icon}</span>{p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Existing links */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Links ({page.links.length})</label>
                  <div className="space-y-2">
                    {page.links.map((link, idx) => (
                      <div key={link.id} className={`p-3 rounded-xl border transition-all ${link.enabled ? "bg-slate-800 border-slate-700" : "bg-slate-900 border-slate-800 opacity-50"}`}>
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-slate-600 shrink-0"/>
                          <span className="text-lg">{link.icon}</span>
                          <div className="flex-1 min-w-0">
                            <input value={link.label} onChange={e => updateLink(link.id, { label: e.target.value })}
                              className="bg-transparent text-white text-sm font-medium w-full focus:outline-none truncate" placeholder="Link Label"/>
                            <input value={link.url} onChange={e => updateLink(link.id, { url: e.target.value })}
                              className="bg-transparent text-slate-400 text-xs w-full focus:outline-none mt-0.5 truncate" placeholder="https://..."/>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => moveLink(link.id, "up")} disabled={idx === 0}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20">
                              <ChevronUp className="w-3.5 h-3.5"/>
                            </button>
                            <button onClick={() => moveLink(link.id, "down")} disabled={idx === page.links.length - 1}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-20">
                              <ChevronDown className="w-3.5 h-3.5"/>
                            </button>
                            <button onClick={() => updateLink(link.id, { enabled: !link.enabled })}
                              className={`w-6 h-6 flex items-center justify-center transition-colors ${link.enabled ? "text-violet-400" : "text-slate-600"}`}>
                              {link.enabled ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                            </button>
                            <button onClick={() => deleteLink(link.id)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add custom link */}
                {!newLinkForm ? (
                  <button onClick={() => setNewLinkForm(true)}
                    className="w-full py-2.5 border-2 border-dashed border-slate-700 hover:border-violet-500 rounded-xl text-slate-400 hover:text-violet-400 text-sm flex items-center justify-center gap-2 transition-all">
                    <Plus className="w-4 h-4"/> Add Custom Link
                  </button>
                ) : (
                  <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-3">
                    <p className="text-xs font-semibold text-white">New Custom Link</p>
                    <div className="flex gap-3">
                      <input value={newLink.icon} onChange={e => setNewLink(n => ({ ...n, icon: e.target.value }))}
                        className="w-12 bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-center text-base focus:outline-none" placeholder="🔗"/>
                      <input value={newLink.label} onChange={e => setNewLink(n => ({ ...n, label: e.target.value }))}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" placeholder="Link label"/>
                    </div>
                    <input value={newLink.url} onChange={e => setNewLink(n => ({ ...n, url: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" placeholder="https://..."/>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addCustomLink} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs">Add Link</Button>
                      <Button size="sm" onClick={() => setNewLinkForm(false)} variant="outline" className="h-8 text-xs border-slate-600 text-slate-400">Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── THEME SECTION ── */}
            {activeSection === "theme" && (
              <div className="space-y-6">
                {/* Backgrounds */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Background</label>
                  <div className="grid grid-cols-5 gap-2">
                    {BG_THEMES.map(t => (
                      <button key={t.id} onClick={() => updateTheme("backgroundId", t.id)}
                        className={`h-12 rounded-xl border-2 transition-all ${page.theme.backgroundId === t.id ? "border-violet-400 scale-105" : "border-transparent hover:border-slate-500"}`}
                        style={{ background: t.css }} title={t.label}/>
                    ))}
                  </div>
                  <p className="text-slate-600 text-xs mt-2">Selected: {BG_THEMES.find(b => b.id === page.theme.backgroundId)?.label}</p>
                </div>

                {/* Button style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Button Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUTTON_STYLES.map(s => (
                      <button key={s.id} onClick={() => updateTheme("buttonStyle", s.id)}
                        className={`px-4 py-3 text-sm font-medium transition-all border ${page.theme.buttonStyle === s.id ? "border-violet-500 bg-violet-500/10 text-violet-300" : "border-slate-700 text-slate-400 hover:border-slate-500"} ${s.id === "pill" ? "rounded-full" : "rounded-xl"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Accent Color</label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map(c => (
                      <button key={c} onClick={() => updateTheme("accentColor", c)}
                        className={`w-9 h-9 rounded-xl border-2 transition-all ${page.theme.accentColor === c ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"}`}
                        style={{ background: c }}/>
                    ))}
                    <div className="flex items-center gap-2">
                      <input type="color" value={page.theme.accentColor} onChange={e => updateTheme("accentColor", e.target.value)}
                        className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent"/>
                      <span className="text-slate-500 text-xs">Custom</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="sticky bottom-0 border-t border-slate-800 bg-slate-950 p-4">
            <Button onClick={handleSave} className={`w-full h-10 text-sm font-bold transition-all ${saved ? "bg-green-600 hover:bg-green-500" : "bg-violet-600 hover:bg-violet-500"} text-white`}>
              {saved ? <><Check className="w-4 h-4 mr-2"/>Saved!</> : <><Sparkles className="w-4 h-4 mr-2"/>Save Page</>}
            </Button>
          </div>
        </div>

        {/* ── Phone preview panel ── */}
        <div className="hidden md:flex flex-col flex-1 items-center justify-start gap-4 bg-slate-900 p-6 overflow-y-auto">
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Preview</p>
            <p className="text-slate-600 text-xs">{pageUrl}</p>
          </div>

          {/* Phone mockup */}
          <div className="relative w-[240px] shrink-0">
            {/* Phone frame */}
            <div className="relative rounded-[36px] border-[7px] border-slate-700 bg-slate-800 shadow-2xl overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-700 rounded-b-xl z-10"/>
              {/* Screen */}
              <div className="w-full h-[480px] overflow-y-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
                <SocialPageRenderer page={page}/>
              </div>
              {/* Home indicator */}
              <div className="flex justify-center py-2 bg-slate-800">
                <div className="w-12 h-1 rounded-full bg-slate-600"/>
              </div>
            </div>
          </div>

          {/* Open full page link */}
          <a href={`/social/${page.username}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
            <ExternalLink className="w-3 h-3"/> Open full page in new tab
          </a>
        </div>
      </div>

      {/* ── Full-screen preview modal ── */}
      <AnimatePresence>
        {fullPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Globe2 className="w-4 h-4 text-violet-400"/>
                <span className="text-white/70 text-sm font-mono">{pageUrl}</span>
              </div>
              <div className="flex items-center gap-3">
                <a href={`/social/${page.username}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                  <ExternalLink className="w-3 h-3"/> Open in new tab
                </a>
                <button onClick={() => setFullPreview(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SocialPageRenderer page={page}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
