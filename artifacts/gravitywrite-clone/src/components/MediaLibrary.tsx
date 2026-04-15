import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Copy, Check, Trash2, Download, Search, Clock, Star, StarOff, X, BookOpen, Filter } from "lucide-react";

interface MediaItem {
  id: string;
  toolName: string;
  toolEmoji: string;
  category: string;
  content: string;
  createdAt: number;
  starred: boolean;
  preview: string;
}

const STORAGE_KEY = "marketingstuffs_media_library";

function loadItems(): MediaItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveItems(items: MediaItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── Helper — export a MediaItem saved by WritingToolsSection ──
export function saveToMediaLibrary(toolName: string, toolEmoji: string, category: string, content: string) {
  const items = loadItems();
  const newItem: MediaItem = {
    id: Date.now().toString(),
    toolName, toolEmoji, category, content,
    createdAt: Date.now(),
    starred: false,
    preview: content.slice(0, 120).replace(/\n/g, " ").trim(),
  };
  items.unshift(newItem);
  if (items.length > 200) items.splice(200);
  saveItems(items);
}

// ── Item card ─────────────────────────────────────────────────
function MediaCard({ item, onView, onStar, onDelete }: { item: MediaItem; onView: () => void; onStar: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const date = new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.content);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div whileHover={{ y: -2 }} onClick={onView}
      className="p-4 rounded-xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/15 transition-all cursor-pointer group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-lg shrink-0">{item.toolEmoji}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-sm font-semibold truncate">{item.toolName}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white/30 text-xs">{item.category}</span>
            <span className="text-white/15 text-xs">•</span>
            <Clock className="w-3 h-3 text-white/25"/>
            <span className="text-white/25 text-xs">{date}</span>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onStar(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-yellow-400 transition-colors shrink-0">
          {item.starred ? <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"/> : <StarOff className="w-3.5 h-3.5"/>}
        </button>
      </div>
      <p className="text-white/45 text-xs leading-relaxed line-clamp-3 mb-3">{item.preview}…</p>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/50 hover:text-white transition-colors">
          {copied ? <><Check className="w-3 h-3 text-green-400"/> Copied</> : <><Copy className="w-3 h-3"/> Copy</>}
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400/60 hover:text-red-400 transition-colors">
          <Trash2 className="w-3 h-3"/> Delete
        </button>
      </div>
    </motion.div>
  );
}

// ── View modal ────────────────────────────────────────────────
function ViewModal({ item, onClose, onDelete }: { item: MediaItem; onClose: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0d0d1f] border border-white/10 rounded-2xl overflow-hidden max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
          <span className="text-xl">{item.toolEmoji}</span>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm">{item.toolName}</h3>
            <p className="text-white/35 text-xs">{new Date(item.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(item.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors">
              {copied ? <><Check className="w-3 h-3 text-green-400"/> Copied!</> : <><Copy className="w-3 h-3"/> Copy All</>}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <pre className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-sans">{item.content}</pre>
        </div>
        <div className="px-5 py-3 border-t border-white/8 flex justify-end">
          <button onClick={() => { onDelete(); onClose(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition-colors">
            <Trash2 className="w-3 h-3"/> Delete this
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>(loadItems);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "starred">("all");
  const [viewItem, setViewItem] = useState<MediaItem | null>(null);

  useEffect(() => { setItems(loadItems()); }, []);

  const toggleStar = (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, starred: !i.starred } : i);
    setItems(updated); saveItems(updated);
  };
  const deleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated); saveItems(updated);
  };
  const clearAll = () => { setItems([]); saveItems([]); };

  const filtered = items.filter(i => {
    const matchFilter = filter === "all" || i.starred;
    const matchSearch = !search || i.toolName.toLowerCase().includes(search.toLowerCase()) || i.content.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const exportAll = () => {
    const text = filtered.map(i => `=== ${i.toolName} (${new Date(i.createdAt).toLocaleDateString()}) ===\n${i.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "marketingstuffs-content.txt"; a.click();
  };

  return (
    <section id="media-library" className="py-24 border-t border-white/5 relative overflow-hidden">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[800px] h-[400px] bg-emerald-600/5 rounded-full blur-[200px] pointer-events-none"/>

      <div className="container px-4 mx-auto max-w-6xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
            <BookOpen className="w-3.5 h-3.5 mr-2"/> Your Content Library
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Media <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Library</span>
          </h2>
          <p className="text-lg text-white/45">All your AI-generated content saved in one place. Star your best work, search, and export anytime.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"/>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors"
              placeholder="Search your content…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFilter(f => f === "all" ? "starred" : "all")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border transition-all ${filter === "starred" ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300" : "border-white/10 text-white/50 hover:text-white bg-white/5"}`}>
              <Star className="w-3.5 h-3.5"/> Starred
            </button>
            {filtered.length > 0 && (
              <button onClick={exportAll} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-white/10 text-white/50 hover:text-white bg-white/5 hover:border-white/20 transition-all">
                <Download className="w-3.5 h-3.5"/> Export
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {items.length > 0 && (
          <div className="flex items-center justify-between mb-6 px-1">
            <p className="text-white/35 text-sm">{filtered.length} item{filtered.length !== 1 ? "s" : ""} {filter === "starred" ? "starred" : "total"}</p>
            <button onClick={clearAll} className="text-red-400/50 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
              <Trash2 className="w-3 h-3"/> Clear all
            </button>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-24 rounded-2xl border border-dashed border-white/10">
            <FileText className="w-12 h-12 text-white/15 mx-auto mb-4"/>
            <h3 className="text-white/40 font-semibold text-lg mb-2">No saved content yet</h3>
            <p className="text-white/25 text-sm max-w-md mx-auto">Use any Writing Tool above and click "Save to Library" to store your generated content here for easy access.</p>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <MediaCard key={item.id} item={item}
                onView={() => setViewItem(item)}
                onStar={() => toggleStar(item.id)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && items.length > 0 && (
          <div className="text-center py-16">
            <p className="text-white/30">No results for "{search}"</p>
            <button onClick={() => setSearch("")} className="mt-2 text-emerald-400 text-sm hover:underline">Clear search</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} onDelete={() => deleteItem(viewItem.id)} />}
      </AnimatePresence>
    </section>
  );
}
