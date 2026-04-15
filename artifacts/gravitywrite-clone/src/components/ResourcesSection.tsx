import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, FileText, BookOpen } from "lucide-react";
import ImageLibrary from "./ImageLibrary";
import MediaLibrary from "./MediaLibrary";

const TABS = [
  { id: "images",  label: "Image Library",   icon: ImageIcon, color: "text-pink-400",    border: "border-pink-500/30",  bg: "bg-pink-500/15"  },
  { id: "content", label: "Content Library", icon: FileText,  color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/15" },
];

export default function ResourcesSection() {
  const [activeTab, setActiveTab] = useState("images");

  return (
    <section id="resources" className="relative overflow-hidden">
      {/* Section header - sits above the library component headers */}
      <div className="pt-20 pb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/3 to-transparent pointer-events-none" />
        <div className="container px-4 mx-auto text-center max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium mb-5">
            <BookOpen className="w-4 h-4" />
            Resources Library
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your <span className="text-amber-400">Creative Hub</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Browse ready-to-use AI images for any platform, or review your saved generated content — all in one place.
          </p>

          {/* Tab bar */}
          <div className="flex justify-center">
            <div className="flex gap-1 p-1.5 bg-black/40 rounded-2xl border border-white/8">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active ? `${tab.bg} ${tab.color} border ${tab.border}` : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}>
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab content — render both, show/hide with CSS */}
      <div className={activeTab === "images" ? "block" : "hidden"}>
        <ImageLibrary />
      </div>
      <div className={activeTab === "content" ? "block" : "hidden"}>
        <MediaLibrary />
      </div>
    </section>
  );
}
