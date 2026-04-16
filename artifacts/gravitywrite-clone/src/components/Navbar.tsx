import { Menu, X, Zap, ChevronDown, User, RefreshCw, Map, LogOut, Crown, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useGenerationGate } from "@/components/GenerationGate";

const NAV_LINKS = [
  { label: "Blog Writer",      href: "#blog-writer" },
  { label: "Website Builder",  href: "#website-developer" },
  { label: "Writing Tools",    href: "#writing-tools" },
  { label: "Social Media",     href: "#social-media-section" },
  { label: "Growth Hub",       href: "#yt-growstuffs", badge: "🚀" },
  { label: "Ad Campaigns",     href: "#ad-campaigns",    badge: "🎯" },
  { label: "Email Marketing",  href: "#email-marketing", badge: "📧" },
  { label: "SMS Marketing",    href: "#sms-marketing",   badge: "💬" },
  { label: "AI Image",         href: "#ai-image",        badge: "✨" },
  { label: "AI Video",         href: "#ai-video",        badge: "🎬" },
  { label: "AI Voice",         href: "#ai-voice",        badge: "🎙️" },
  { label: "AI Tools",         href: "#ai-tools" },
  { label: "Blog",             href: "#blogs",    badge: "📝" },
  { label: "Pricing",          href: "#pricing" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { profile, setShowOnboarding, resetProfile } = useUser();
  const { credits, googleSignedIn, isAdminUser, userEmail, openLoginModal } = useGenerationGate();
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function scrollTo(href: string) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }

  function openGrowthHub() {
    scrollTo("#yt-growstuffs");
    setProfileOpen(false);
  }

  function openOnboarding() {
    setShowOnboarding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setProfileOpen(false);
    setMobileOpen(false);
  }

  function handleReset() {
    if (window.confirm("Reset your growth plan and start fresh?")) {
      resetProfile();
      setProfileOpen(false);
    }
  }

  const initials = profile.name
    ? profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <>
      {/* Announcement bar */}
      <div className="relative z-50 bg-gradient-to-r from-primary/80 via-indigo-600/80 to-primary/80 text-white text-center py-2 px-4 text-sm font-medium">
        <span>🚀 Marketingstuffs is live — All AI tools are completely free to use</span>
        <button className="ml-3 underline underline-offset-2 opacity-80 hover:opacity-100" onClick={() => scrollTo("#yt-growstuffs")}>
          Start now →
        </button>
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
          <div className="hidden lg:flex items-center gap-0.5 text-sm font-medium overflow-x-auto">
            {NAV_LINKS.map(link => (
              <button key={link.label} onClick={() => scrollTo(link.href)}
                className={`relative px-3 py-2 rounded-lg transition-colors text-xs whitespace-nowrap ${
                  link.href === "#yt-growstuffs" ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-semibold" :
                  link.badge === "✨" ? "text-teal-400 hover:text-teal-300 hover:bg-teal-500/10" :
                  link.badge === "🎬" ? "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10" :
                  link.badge === "🎯" ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" :
                  link.badge === "📧" ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" :
                  link.badge === "💬" ? "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10" :
                  "text-white/60 hover:text-white hover:bg-white/5"
                }`}>
                {link.label}
                {link.badge && <span className="ml-1 text-[10px]">{link.badge}</span>}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Credit / Admin badge */}
            {googleSignedIn && (
              isAdminUser ? (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-bold">
                  <Crown className="w-3 h-3 fill-yellow-400" /> Admin · Unlimited
                </div>
              ) : (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-colors ${
                  credits > 20 ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" :
                  credits > 5  ? "bg-amber-500/10 border-amber-500/25 text-amber-400" :
                                 "bg-red-500/10 border-red-500/25 text-red-400"
                }`}>
                  ⚡ {credits} credits
                </div>
              )
            )}

            {/* Sign In button — shown when not Google signed in */}
            {!googleSignedIn && (
              <button
                onClick={openLoginModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition-all"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )}

            {/* Profile / Get Started */}
            {profile.onboardingComplete ? (
              <div className="relative hidden sm:block" ref={profileRef}>
                <button onClick={() => setProfileOpen(o => !o)}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-3 py-1.5 transition-all">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {initials || <User size={11} />}
                  </div>
                  <div className="text-left">
                    <p className="text-white text-[11px] font-semibold leading-none">{profile.name || "My Plan"}</p>
                    <p className="text-slate-500 text-[9px] leading-none mt-0.5">{profile.businessLabel}</p>
                  </div>
                  <ChevronDown size={12} className={`text-slate-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-white text-sm font-semibold">{profile.name}</p>
                      <p className="text-slate-500 text-xs">{profile.goal}</p>
                    </div>
                    <div className="py-1.5">
                      <button onClick={openGrowthHub}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                        <Map size={14} className="text-emerald-400" />My Growth Plan
                      </button>
                      <button onClick={openOnboarding}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                        <RefreshCw size={14} className="text-blue-400" />Update My Plan
                      </button>
                      <button onClick={handleReset}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
                        <LogOut size={14} />Reset Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={openOnboarding}
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Log in
              </button>
            )}

            <Button
              onClick={profile.onboardingComplete ? openGrowthHub : openOnboarding}
              className="bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 hover:to-primary/90 text-white border-0 rounded-xl text-sm hidden sm:flex whitespace-nowrap">
              {profile.onboardingComplete ? "My Hub 🚀" : "Start Free →"}
            </Button>

            <button onClick={() => setMobileOpen(o => !o)} className="lg:hidden text-white/70 hover:text-white p-2">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5 bg-[#0a0a1a]/95 px-4 py-4 space-y-1">
            {profile.onboardingComplete && (
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials || <User size={14} />}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{profile.name}</p>
                  <p className="text-emerald-400 text-xs">{profile.businessLabel}</p>
                </div>
              </div>
            )}
            {NAV_LINKS.map(link => (
              <button key={link.label} onClick={() => scrollTo(link.href)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm flex items-center gap-2 ${
                  link.href === "#yt-growstuffs" ? "text-emerald-400 hover:bg-emerald-500/10 font-semibold" :
                  link.badge === "✨" ? "text-teal-400 hover:bg-teal-500/10" :
                  link.badge === "🎬" ? "text-indigo-400 hover:bg-indigo-500/10" :
                  "text-white/70 hover:text-white hover:bg-white/5"
                }`}>
                {link.badge && <span>{link.badge}</span>}
                {link.label}
              </button>
            ))}
            {!googleSignedIn && (
              <button
                onClick={() => { openLoginModal(); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-medium"
              >
                <LogIn className="w-4 h-4" /> Sign In with Google
              </button>
            )}
            <Button onClick={profile.onboardingComplete ? openGrowthHub : openOnboarding}
              className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-primary text-white rounded-xl">
              {profile.onboardingComplete ? "Open My Growth Hub 🚀" : "Get My Growth Plan — Free"}
            </Button>
            {profile.onboardingComplete && (
              <button onClick={openOnboarding} className="w-full mt-1 text-sm text-slate-500 hover:text-slate-300 py-2">
                Update my plan
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
