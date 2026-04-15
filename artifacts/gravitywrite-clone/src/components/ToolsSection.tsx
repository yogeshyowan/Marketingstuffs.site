import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Map each chip to the WritingToolsSection category ID
// cat: null means scroll to a specific section instead
const TOOL_CATS = [
  { label: "Blog Workflow",     emoji: "📝", cat: null,          scrollId: "blog-writer",    desc: "6-step AI blog creation" },
  { label: "Blog & SEO",        emoji: "🔍", cat: "blog",        scrollId: "writing-tools",  desc: "Titles, outlines, meta tags" },
  { label: "YouTube Tools",     emoji: "▶️", cat: "youtube",     scrollId: "writing-tools",  desc: "Scripts, hooks, descriptions" },
  { label: "Rewriting Tools",   emoji: "🔄", cat: "rewriting",   scrollId: "writing-tools",  desc: "Paraphrase, summarise, simplify" },
  { label: "Writing Assistant", emoji: "✍️", cat: "writing",     scrollId: "writing-tools",  desc: "Essays, cover letters & more" },
  { label: "Social Media",      emoji: "📱", cat: "social",      scrollId: "writing-tools",  desc: "Captions, hashtags, threads" },
  { label: "Email Tools",       emoji: "📧", cat: "email",       scrollId: "writing-tools",  desc: "Subject lines, cold emails" },
  { label: "Advertising",       emoji: "📢", cat: "advertising", scrollId: "writing-tools",  desc: "Ad copy, Google & Facebook ads" },
  { label: "Code Tools",        emoji: "💻", cat: "code",        scrollId: "writing-tools",  desc: "Generate, explain, review code" },
  { label: "Marketing",         emoji: "🎯", cat: "marketing",   scrollId: "writing-tools",  desc: "Brand, taglines, case studies" },
  { label: "E-Commerce",        emoji: "🛍️", cat: "ecommerce",   scrollId: "writing-tools",  desc: "Product descriptions, reviews" },
  { label: "Business",          emoji: "🏢", cat: "business",    scrollId: "writing-tools",  desc: "Plans, proposals, pitches" },
  { label: "HR Tools",          emoji: "👥", cat: "hr",          scrollId: "writing-tools",  desc: "Job descriptions, offers, reviews" },
  { label: "Education",         emoji: "🎓", cat: "education",   scrollId: "writing-tools",  desc: "Quizzes, lesson plans, essays" },
  { label: "Video & Script",    emoji: "🎬", cat: "video",       scrollId: "writing-tools",  desc: "Scripts, explainer videos" },
  { label: "Website Copy",      emoji: "🖥️", cat: "website",     scrollId: "writing-tools",  desc: "Landing pages, FAQs, headlines" },
  { label: "Personal",          emoji: "🌟", cat: "personal",    scrollId: "writing-tools",  desc: "Bios, travel plans, thank-you notes" },
  { label: "Book Writing",      emoji: "📚", cat: "book",        scrollId: "writing-tools",  desc: "Chapter ideas, titles, blurbs" },
] as const;

function handleCatClick(cat: string | null, scrollId: string) {
  // 1. Scroll to the target section
  const el = document.getElementById(scrollId);
  if (el) el.scrollIntoView({ behavior: "smooth" });

  // 2. If a category is specified, fire event so WritingToolsSection filters itself
  if (cat) {
    window.dispatchEvent(new CustomEvent("set-writing-cat", { detail: { cat } }));
  }
}

export default function ToolsSection() {
  return (
    <section id="tools" className="py-32 relative overflow-hidden flex flex-col items-center">
      <div className="glow-bg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5]"></div>

      <div className="container px-4 mx-auto text-center relative z-10">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
          100+ Specialised AI Tools
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
          Only AI Content Platform That Actually{" "}
          <span className="gradient-text">Grows Your Business</span>
        </h2>
        <p className="text-white/40 text-base mb-14 max-w-xl mx-auto">
          Click any category below to browse its tools instantly.
        </p>

        {/* Scrolling text effect */}
        <div className="relative w-full overflow-hidden mb-14 py-4">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex whitespace-nowrap animate-marquee-slow font-bold text-[80px] md:text-[120px] text-white/[0.03] uppercase leading-none tracking-tighter">
            <span>STOP JUGGLING CHATGPT CANVA SCHEDULING TOOLS ANALYTICS SEO TOOLS </span>
            <span>STOP JUGGLING CHATGPT CANVA SCHEDULING TOOLS ANALYTICS SEO TOOLS </span>
          </div>
        </div>

        {/* Clickable category chips */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {TOOL_CATS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleCatClick(item.cat, item.scrollId)}
                title={item.desc}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-violet-500/15 hover:border-violet-500/40 hover:text-white transition-all duration-200 text-sm font-medium cursor-pointer"
              >
                <span className="text-base">{item.emoji}</span>
                {item.label}
                <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200" />
              </button>
            ))}
          </div>

          <Button
            size="lg"
            onClick={() => handleCatClick(null, "writing-tools")}
            className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-12 text-base font-semibold"
          >
            Explore All Writing Tools →
          </Button>
        </div>
      </div>
    </section>
  );
}
