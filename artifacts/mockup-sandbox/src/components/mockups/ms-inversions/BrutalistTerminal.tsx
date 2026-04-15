export function BrutalistTerminal() {
  const mono = { fontFamily: "'Courier New', 'Courier', monospace" };

  const tools = [
    {
      id: "TOOL_01",
      name: "BLOG_WRITER",
      status: "OPERATIONAL",
      input: "TOPIC + KEYWORDS + TONE + WORD_COUNT",
      output: "MARKDOWN_ARTICLE",
      range: "800 – 2400 WORDS",
      models: "8",
    },
    {
      id: "TOOL_02",
      name: "WEBSITE_BUILDER",
      status: "OPERATIONAL",
      input: "BUSINESS_NAME + DESCRIPTION + CTA",
      output: "6 × HTML_SECTIONS",
      range: "HERO + ABOUT + FEATURES + PRICING + FAQ + FOOTER",
      models: "8",
    },
    {
      id: "TOOL_03",
      name: "SOCIAL_MEDIA_MGR",
      status: "OPERATIONAL",
      input: "BRIEF + PLATFORM_SELECT + TONE",
      output: "PLATFORM_NATIVE_POSTS + HASHTAGS",
      range: "INSTAGRAM / TIKTOK / FACEBOOK / YOUTUBE / LINKEDIN / TWITTER",
      models: "8",
    },
    {
      id: "TOOL_04",
      name: "AD_CREATOR",
      status: "OPERATIONAL",
      input: "BRAND + PRODUCT + OBJECTIVE + DURATION",
      output: "VIDEO_REEL.WEBM + STATIC_AD.PNG + SCRIPT",
      range: "15s / 30s / 60s",
      models: "8",
    },
  ];

  const specs = [
    ["VERSION", "1.0.0-beta"],
    ["PRICE", "$0.00 / UNLIMITED USAGE"],
    ["AUTH", "GOOGLE SSO / EMAIL"],
    ["API_KEYS", "5 × OPENROUTER (ROTATING)"],
    ["FALLBACK_CHAIN", "8 FREE MODELS"],
    ["IMAGE_ENGINE", "POLLINATIONS.AI"],
    ["EXPORT_FORMATS", "PNG · WEBM · MARKDOWN · JSON"],
    ["LANGUAGES", "14 SUPPORTED"],
    ["PLATFORMS", "ALL MAJOR SOCIAL NETWORKS"],
    ["UPTIME_TARGET", "99.9%"],
  ];

  const log = [
    { t: "00:00:01", msg: "SYSTEM INITIALIZED", type: "ok" },
    { t: "00:00:02", msg: "LOADING AI MODELS... DONE", type: "ok" },
    { t: "00:00:03", msg: "BLOG_WRITER: READY", type: "ok" },
    { t: "00:00:04", msg: "WEBSITE_BUILDER: READY", type: "ok" },
    { t: "00:00:05", msg: "SOCIAL_MEDIA_MGR: READY", type: "ok" },
    { t: "00:00:06", msg: "AD_CREATOR: READY", type: "ok" },
    { t: "00:00:07", msg: "ALL TOOLS OPERATIONAL. COST = $0.00", type: "ok" },
    { t: "LIVE", msg: "AWAITING USER INPUT_", type: "cursor" },
  ];

  return (
    <div className="min-h-screen bg-white text-black" style={mono}>
      {/* Top bar */}
      <div className="border-b-4 border-black px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white px-3 py-1 text-xs font-bold tracking-widest">MARKETINGSTUFFS</div>
          <span className="text-xs text-gray-500">v1.0.0-beta</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">STATUS:</span>
          <span className="text-xs text-[#00cc44] font-bold tracking-widest">■ ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Header */}
      <div className="border-b-4 border-black px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.4em] text-gray-400 mb-4 uppercase">AI Content Platform — Free, No Signup Required</p>
          <h1 className="text-6xl font-black tracking-tighter leading-none mb-2">
            FOUR TOOLS.<br />
            <span className="text-[#00cc44]">ZERO COST.</span><br />
            SHIP FASTER.
          </h1>
          <p className="text-sm text-gray-500 mt-6 max-w-xl leading-relaxed">
            Blog writing. Website copy. Social posts. Video ads. Each tool takes structured input and returns production-ready output. No trial period. No credit card. No usage cap.
          </p>
          <div className="mt-8 flex gap-4">
            <button className="bg-black text-white px-6 py-3 text-xs font-bold tracking-widest hover:bg-[#00cc44] hover:text-black transition-colors border-2 border-black">
              INITIALIZE SESSION →
            </button>
            <button className="border-2 border-black px-6 py-3 text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors">
              VIEW DOCUMENTATION
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Tools table */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.3em] uppercase">TOOL_REGISTRY</span>
            <div className="h-px flex-1 bg-black" />
            <span className="text-xs text-gray-400">{tools.length} ENTRIES</span>
          </div>

          <div className="border-2 border-black">
            {/* Table header */}
            <div className="grid grid-cols-12 bg-black text-white text-[10px] tracking-widest px-4 py-2">
              <div className="col-span-1">ID</div>
              <div className="col-span-2">NAME</div>
              <div className="col-span-3">INPUT_PARAMS</div>
              <div className="col-span-3">OUTPUT</div>
              <div className="col-span-2">RANGE</div>
              <div className="col-span-1">STATUS</div>
            </div>
            {tools.map((t, i) => (
              <div
                key={t.id}
                className={`grid grid-cols-12 text-[11px] px-4 py-3 border-t border-black/20 hover:bg-[#f0ffe8] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <div className="col-span-1 text-gray-400">{t.id}</div>
                <div className="col-span-2 font-bold text-black">{t.name}</div>
                <div className="col-span-3 text-gray-500 text-[10px] leading-relaxed">{t.input}</div>
                <div className="col-span-3 text-gray-700 text-[10px] leading-relaxed">{t.output}</div>
                <div className="col-span-2 text-[10px] text-gray-500 leading-relaxed">{t.range}</div>
                <div className="col-span-1">
                  <span className="text-[#00cc44] text-[10px] font-bold">■ OK</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two column bottom */}
        <div className="grid grid-cols-2 gap-8">
          {/* System specs */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold tracking-[0.3em] uppercase">SYSTEM_SPECS</span>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="border-2 border-black">
              {specs.map(([key, val], i) => (
                <div key={key} className={`flex border-b border-black/20 last:border-0 text-[11px] ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <div className="w-36 px-4 py-2.5 text-gray-400 border-r border-black/20 shrink-0">{key}</div>
                  <div className="px-4 py-2.5 font-bold text-black">{val}</div>
                </div>
              ))}
            </div>

            {/* CTA block */}
            <div className="border-2 border-[#00cc44] bg-[#f0ffe8] p-5 mt-6">
              <p className="text-[10px] tracking-widest text-[#00882c] mb-2 uppercase font-bold">Free Access</p>
              <p className="text-sm leading-relaxed text-gray-700 mb-4">
                All tools are free during the beta period. Unlimited generations. No payment info collected.
              </p>
              <button className="w-full bg-[#00cc44] text-black text-xs font-black tracking-widest py-3 hover:bg-[#00aa33] transition-colors border-2 border-[#00cc44]">
                START NOW — $0.00
              </button>
            </div>
          </div>

          {/* Boot log */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold tracking-[0.3em] uppercase">SYSTEM_LOG</span>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="border-2 border-black bg-black p-4">
              <div className="space-y-1.5">
                {log.map((entry, i) => (
                  <div key={i} className="flex gap-4 text-[11px]">
                    <span className="text-gray-500 shrink-0">[{entry.t}]</span>
                    <span className={
                      entry.type === "ok" ? "text-[#00cc44]" :
                      entry.type === "cursor" ? "text-white animate-pulse" :
                      "text-red-400"
                    }>
                      {entry.msg}
                      {entry.type === "cursor" && <span className="ml-0.5 opacity-0 animate-ping">▌</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform matrix */}
            <div className="border-2 border-black mt-6">
              <div className="bg-black text-white text-[10px] tracking-widest px-4 py-2">PLATFORM_SUPPORT_MATRIX</div>
              <div className="grid grid-cols-3 text-[11px]">
                {[
                  ["INSTAGRAM", "■"],
                  ["TIKTOK", "■"],
                  ["FACEBOOK", "■"],
                  ["YOUTUBE", "■"],
                  ["LINKEDIN", "■"],
                  ["X/TWITTER", "■"],
                ].map(([p, s]) => (
                  <div key={p} className="border-b border-r border-black/20 px-3 py-2 flex justify-between">
                    <span className="text-gray-600">{p}</span>
                    <span className="text-[#00cc44]">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-4 border-black px-8 py-4 mt-4 flex justify-between items-center text-[11px] text-gray-400">
        <span>MARKETINGSTUFFS © 2025 · marketingstuffs.site</span>
        <span>BUILD: FREE BETA · NO WARRANTY · USE AT WILL</span>
      </div>
    </div>
  );
}
