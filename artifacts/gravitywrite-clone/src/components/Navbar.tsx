import { Menu, X, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CreditsDisplay from "@/components/CreditsDisplay";

const NAV_LINKS = [
  { label: "Blog Writer",      href: "#blog-writer" },
  { label: "Website Builder",  href: "#website-developer" },
  { label: "Writing Tools",    href: "#writing-tools" },
  { label: "Social Media",     href: "#social-media-section" },
  { label: "AI Image",         href: "#ai-image",   badge: "✨" },
  { label: "AI Video",         href: "#ai-video",   badge: "🎬" },
  { label: "AI Voice",         href: "#ai-voice",   badge: "🎙️" },
  { label: "AI Tools",         href: "#ai-tools" },
  { label: "Resources",        href: "#resources" },
  { label: "Pricing",          href: "#pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  function scrollTo(href: string) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="relative z-50 bg-gradient-to-r from-primary/80 via-indigo-600/80 to-primary/80 text-white text-center py-2 px-4 text-sm font-medium">
        <span>🚀 Marketingstuffs is live — All AI tools are completely free to use</span>
        <button className="ml-3 underline underline-offset-2 opacity-80 hover:opacity-100">Start now →</button>
      </div>

      {/* Main nav */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0a0a1a]/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-primary flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.4)] group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg tracking-tight text-white">Marketingstuffs</span>
              <span className="text-[10px] text-emerald-400/70 font-medium tracking-wider uppercase">AI Growth Platform</span>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-0.5 text-sm font-medium">
            {NAV_LINKS.map(link => (
              <button key={link.label} onClick={() => scrollTo(link.href)}
                className={`relative px-3 py-2 rounded-lg transition-colors text-xs whitespace-nowrap ${
                  link.badge === "✨" ? "text-teal-400 hover:text-teal-300 hover:bg-teal-500/10" :
                  link.badge === "🎬" ? "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10" :
                  "text-white/60 hover:text-white hover:bg-white/5"
                }`}>
                {link.label}
                {link.badge && (
                  <span className="ml-1 text-[10px]">{link.badge}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Credits badge */}
            <CreditsDisplay />

            <button className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors">
              Log in
            </button>
            <Button className="bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 hover:to-primary/90 text-white border-0 rounded-xl text-sm hidden sm:flex">
              Start Free →
            </Button>
            <button onClick={() => setMobileOpen(o => !o)} className="lg:hidden text-white/70 hover:text-white p-2">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5 bg-[#0a0a1a]/95 px-4 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <button key={link.label} onClick={() => scrollTo(link.href)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm flex items-center gap-2 ${
                  link.badge === "✨" ? "text-teal-400 hover:bg-teal-500/10" :
                  link.badge === "🎬" ? "text-indigo-400 hover:bg-indigo-500/10" :
                  "text-white/70 hover:text-white hover:bg-white/5"
                }`}>
                {link.badge && <span>{link.badge}</span>}
                {link.label}
              </button>
            ))}
            <Button className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-primary text-white rounded-xl">
              Start Free →
            </Button>
          </div>
        )}
      </nav>
    </>
  );
}
