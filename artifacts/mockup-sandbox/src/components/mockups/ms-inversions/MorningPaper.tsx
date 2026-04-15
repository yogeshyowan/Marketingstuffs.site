export function MorningPaper() {
  const date = new Intl.DateTimeFormat("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date());

  const tools = [
    {
      name: "Blog Writer",
      desc: "Produce well-structured long-form articles from a single prompt. The system drafts, outlines, and refines — you edit, approve, and publish.",
      stat: "800–2,400 words",
      note: "Supports 14 languages",
    },
    {
      name: "Website Builder",
      desc: "Describe your business and receive a complete website layout with copy, navigation, and calls to action — ready to customize.",
      stat: "6 page sections",
      note: "Copy-ready output",
    },
    {
      name: "Social Media",
      desc: "Write and schedule platform-native posts across Instagram, LinkedIn, TikTok, Facebook, and more from one brief.",
      stat: "6 platforms",
      note: "Tone controls included",
    },
    {
      name: "Ad Creator",
      desc: "Generate image ads and video reels with headline, tagline, voiceover script, and animated canvas export.",
      stat: "15 – 60 second reels",
      note: "Downloads as WebM + PNG",
    },
  ];

  const beliefs = [
    "Most AI writing tools produce text that sounds like AI wrote it. This one is designed to sound like you.",
    "The best content tools get out of the way. Every feature here has a clear job and nothing more.",
    "Free to use means free to use. No credit card. No usage cap during the beta.",
  ];

  return (
    <div
      className="min-h-screen bg-[#faf8f4] text-[#1a1611]"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Masthead */}
      <header className="border-b-4 border-[#1a1611] px-10 pt-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between border-b border-[#1a1611]/30 pb-3 mb-3">
            <p className="text-[11px] tracking-widest uppercase text-[#8b7355]" style={{ fontFamily: "sans-serif" }}>
              Content & Growth
            </p>
            <p className="text-[11px] tracking-widest uppercase text-[#8b7355]" style={{ fontFamily: "sans-serif" }}>
              {date}
            </p>
          </div>
          <h1
            className="text-7xl font-black text-center tracking-tight leading-none mb-1"
            style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.03em" }}
          >
            Marketingstuffs
          </h1>
          <p className="text-center text-sm text-[#8b7355] tracking-widest uppercase mt-2" style={{ fontFamily: "sans-serif" }}>
            AI-powered content tools · Free during beta · No card required
          </p>
        </div>
      </header>

      {/* Pull quote bar */}
      <div className="bg-[#1a1611] text-[#faf8f4] py-3 px-10">
        <div className="max-w-5xl mx-auto text-center text-sm italic tracking-wide">
          "Write blogs, build websites, grow your audience — from one place, in minutes."
        </div>
      </div>

      {/* Main content — two columns */}
      <main className="max-w-5xl mx-auto px-10 py-10">
        <div className="grid grid-cols-3 gap-10">

          {/* Left column: intro + tools */}
          <div className="col-span-2 border-r border-[#1a1611]/20 pr-10">

            {/* Section header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-[#1a1611]" />
              <h2 className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ fontFamily: "sans-serif" }}>Four Tools. One Platform.</h2>
              <div className="h-px flex-1 bg-[#1a1611]" />
            </div>

            {/* Drop cap intro */}
            <p className="text-lg leading-relaxed mb-6" style={{ columnCount: 1 }}>
              <span className="float-left text-8xl font-black leading-[0.75] mr-2 mt-1 text-[#b5863a]" style={{ fontFamily: "Georgia, serif" }}>M</span>
              arketingstuffs is a suite of AI content tools built for small businesses, independent creators, and marketing teams who need to ship more and think less. No subscriptions, no paywalls, no complicated dashboards — just four tools that work.
            </p>

            <p className="text-base leading-relaxed mb-8 text-[#3d3228]">
              Each tool does one job exceptionally well. The Blog Writer produces long-form articles. The Website Builder generates complete page copy. The Social Media Manager drafts platform-native posts across six networks. The Ad Creator renders animated video reels with voiceover scripts. All four are powered by the same AI backbone, all free to use.
            </p>

            {/* Tools list — newspaper column style */}
            <div className="space-y-6">
              {tools.map((t, i) => (
                <div key={t.name} className="grid grid-cols-12 gap-4 pb-6 border-b border-[#1a1611]/15">
                  <div className="col-span-1 text-[11px] text-[#8b7355] font-bold pt-1" style={{ fontFamily: "sans-serif" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="col-span-11">
                    <h3 className="text-xl font-bold mb-1">{t.name}</h3>
                    <p className="text-sm leading-relaxed text-[#3d3228] mb-2">{t.desc}</p>
                    <div className="flex gap-4">
                      <span className="text-[11px] text-[#b5863a] font-semibold uppercase tracking-wide" style={{ fontFamily: "sans-serif" }}>{t.stat}</span>
                      <span className="text-[11px] text-[#8b7355] uppercase tracking-wide" style={{ fontFamily: "sans-serif" }}>· {t.note}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 py-8 border-t-4 border-[#1a1611]">
              <p className="text-sm text-[#3d3228] mb-4 leading-relaxed">
                Available now, at no cost. Create an account to save your work and unlock the full generation history. No payment information required.
              </p>
              <a
                href="#"
                className="inline-block bg-[#1a1611] text-[#faf8f4] px-8 py-3 text-sm tracking-widest uppercase hover:bg-[#b5863a] transition-colors"
                style={{ fontFamily: "sans-serif" }}
              >
                Begin Writing →
              </a>
            </div>
          </div>

          {/* Right column: beliefs + side notes */}
          <div className="col-span-1 space-y-8">
            {/* Editorial box */}
            <div className="bg-[#1a1611] text-[#faf8f4] p-5">
              <p className="text-[10px] tracking-widest uppercase mb-3 text-[#b5863a]" style={{ fontFamily: "sans-serif" }}>
                What We Believe
              </p>
              <div className="space-y-4">
                {beliefs.map((b, i) => (
                  <div key={i} className="pb-4 border-b border-[#faf8f4]/20 last:border-0 last:pb-0">
                    <p className="text-sm leading-relaxed italic">{b}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat box */}
            <div className="border border-[#1a1611] p-5">
              <p className="text-[10px] tracking-widest uppercase mb-4 text-[#8b7355]" style={{ fontFamily: "sans-serif" }}>By the Numbers</p>
              <div className="space-y-4">
                {[
                  { n: "4", label: "Specialized tools" },
                  { n: "14", label: "Supported languages" },
                  { n: "8", label: "AI models in rotation" },
                  { n: "6", label: "Social platforms" },
                  { n: "∞", label: "Generations, free" },
                ].map(s => (
                  <div key={s.n} className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#b5863a]">{s.n}</span>
                    <span className="text-xs text-[#3d3228]" style={{ fontFamily: "sans-serif" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="border-t-2 border-[#1a1611] pt-5">
              <p className="text-[10px] tracking-widest uppercase mb-3 text-[#8b7355]" style={{ fontFamily: "sans-serif" }}>Platforms Supported</p>
              <p className="text-sm leading-relaxed text-[#3d3228]">Instagram, TikTok, Facebook, YouTube, LinkedIn, X (Twitter)</p>
            </div>

            {/* Ad formats */}
            <div className="bg-[#eee8dc] p-5">
              <p className="text-[10px] tracking-widest uppercase mb-3 text-[#8b7355]" style={{ fontFamily: "sans-serif" }}>Ad Formats</p>
              <ul className="space-y-1">
                {["Static image (PNG)", "Animated reel (WebM)", "Audio voiceover script", "Social caption + hashtags"].map(f => (
                  <li key={f} className="text-xs text-[#3d3228] flex gap-2" style={{ fontFamily: "sans-serif" }}>
                    <span className="text-[#b5863a]">—</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer rule */}
      <footer className="border-t-4 border-[#1a1611] px-10 py-5 mt-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <p className="text-xs text-[#8b7355]" style={{ fontFamily: "sans-serif" }}>
            © Marketingstuffs · marketingstuffs.site
          </p>
          <p className="text-xs text-[#8b7355]" style={{ fontFamily: "sans-serif" }}>
            All AI tools are free to use · No credit card required
          </p>
        </div>
      </footer>
    </div>
  );
}
