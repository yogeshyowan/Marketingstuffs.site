import { useState, useRef, useCallback } from "react";
import { useGenerationGate } from "@/components/GenerationGate";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Loader2, Copy, Check, Download, ChevronLeft, ChevronRight,
  Sparkles, RefreshCw, Zap, Phone, Mail, MapPin, Instagram, Twitter,
  Facebook, Monitor, Tablet, Smartphone, SkipForward, CheckCircle2,
  Upload, Palette, Type, Image as ImageIcon, ArrowRight, Plus, X,
  Search, BarChart2, Link2, FileText, Shield, BookOpen, Map, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Data ─────────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  { id: "ecommerce",     emoji: "🛍️", label: "E-commerce / Online Shop" },
  { id: "restaurant",   emoji: "🍕", label: "Restaurant / Café / Food" },
  { id: "professional", emoji: "💼", label: "Professional Services" },
  { id: "beauty",       emoji: "💅", label: "Beauty & Wellness / Salon" },
  { id: "realestate",   emoji: "🏠", label: "Real Estate / Property" },
  { id: "photography",  emoji: "📸", label: "Photography / Videography" },
  { id: "healthcare",   emoji: "🏥", label: "Healthcare / Medical" },
  { id: "fitness",      emoji: "💪", label: "Fitness / Gym / Yoga" },
  { id: "education",    emoji: "📚", label: "Education / Tutoring" },
  { id: "tech",         emoji: "💻", label: "Technology / SaaS / App" },
  { id: "agency",       emoji: "🚀", label: "Creative Agency / Marketing" },
  { id: "nonprofit",    emoji: "❤️", label: "Non-Profit / Charity" },
  { id: "travel",       emoji: "✈️", label: "Travel & Hospitality" },
  { id: "construction", emoji: "🏗️", label: "Construction / Home Services" },
  { id: "event",        emoji: "🎉", label: "Events / Wedding / Entertainment" },
  { id: "automotive",   emoji: "🚗", label: "Automotive / Transport" },
  { id: "freelancer",   emoji: "🎨", label: "Freelancer / Portfolio" },
  { id: "personal",     emoji: "👋", label: "Personal Brand / Blog" },
];

const COLOR_SCHEMES = [
  { id: "dark-pro",     name: "Dark Professional", bg: "#0f172a", accent: "#2563eb", text: "#f1f5f9" },
  { id: "bright-blue",  name: "Bright & Clean",    bg: "#f8fafc", accent: "#2563eb", text: "#1e293b" },
  { id: "warm-orange",  name: "Warm & Energetic",  bg: "#fff7ed", accent: "#ea580c", text: "#431407" },
  { id: "pink-creative",name: "Creative Pink",     bg: "#fdf2f8", accent: "#db2777", text: "#1e1b4b" },
  { id: "nature-green", name: "Nature & Fresh",    bg: "#f0fdf4", accent: "#16a34a", text: "#14532d" },
  { id: "luxury-dark",  name: "Luxury Dark",       bg: "#0c0a09", accent: "#d97706", text: "#fafaf9" },
];

const FONT_PAIRINGS = [
  { id: "inter",      label: "Inter — Clean Modern",    heading: "Inter",            body: "Inter" },
  { id: "playfair",   label: "Playfair — Elegant Serif", heading: "Playfair Display", body: "Inter" },
  { id: "montserrat", label: "Montserrat — Bold Impact", heading: "Montserrat",       body: "Montserrat" },
  { id: "poppins",    label: "Poppins — Friendly Round", heading: "Poppins",          body: "Poppins" },
];

const TEMPLATES = [
  { id: "business-pro",      label: "Business Pro",      desc: "Corporate, trustworthy, structured layout",  emoji: "🏢" },
  { id: "creative-studio",   label: "Creative Studio",   desc: "Bold, artistic, gradient-heavy design",      emoji: "🎨" },
  { id: "fresh-modern",      label: "Fresh & Modern",    desc: "Clean, minimal, lots of white space",        emoji: "🌿" },
  { id: "bold-impact",       label: "Bold Impact",       desc: "High-contrast, powerful statement brand",    emoji: "⚡" },
  { id: "elegant-premium",   label: "Elegant Premium",   desc: "Sophisticated with refined typography",      emoji: "💎" },
  { id: "friendly-warm",     label: "Friendly & Warm",   desc: "Welcoming, conversational, community feel",  emoji: "🤝" },
];

const WEBSITE_STYLES = [
  { id: "modern",     label: "Modern",     emoji: "✨", desc: "Clean lines, bold typography" },
  { id: "minimal",    label: "Minimal",    emoji: "⬜", desc: "White space, simplicity first" },
  { id: "bold",       label: "Bold",       emoji: "🔥", desc: "High contrast, strong personality" },
  { id: "elegant",    label: "Elegant",    emoji: "🌹", desc: "Refined, upscale feel" },
  { id: "playful",    label: "Playful",    emoji: "🎊", desc: "Fun, colorful, energetic" },
  { id: "tech",       label: "Tech",       emoji: "🤖", desc: "Futuristic, digital, dark UI" },
];

const PAGES_TO_BUILD: { key: SectionKey; label: string; emoji: string; desc: string }[] = [
  { key: "homepage",  label: "Homepage",    emoji: "🏠", desc: "Hero, features, stats, CTA" },
  { key: "about",     label: "About Us",   emoji: "👥", desc: "Story, how it works, team" },
  { key: "services",  label: "Services",   emoji: "⚙️", desc: "Services, pricing, testimonials" },
  { key: "portfolio", label: "Portfolio",  emoji: "🎨", desc: "Projects, case studies, client logos" },
  { key: "contact",   label: "Contact",    emoji: "📬", desc: "FAQ, contact form, footer" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "welcome" | "wizard" | "building" | "done";
type SectionKey = "homepage" | "about" | "services" | "portfolio" | "contact";
type DeviceView = "desktop" | "tablet" | "mobile";

interface SectionState {
  key: SectionKey;
  label: string;
  emoji: string;
  desc: string;
  status: "pending" | "generating" | "done" | "skipped";
  html: string;
}

// ── Streaming helper ──────────────────────────────────────────────────────────

async function streamSection(
  body: Record<string, string>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  const res = await fetch("/api/ai/generate-website-section", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) { onError("Network error – please try again."); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const evt = JSON.parse(line.slice(6));
        if (evt.error) { onError(evt.error); return; }
        if (evt.done)  { onDone(); return; }
        if (evt.content) onChunk(evt.content);
      } catch { /* ignore parse errors */ }
    }
  }
}

// ── SEO head injector ─────────────────────────────────────────────────────────

interface SeoOptions {
  bizName: string;
  metaTitle: string;
  metaDesc: string;
  keywords: string;
  domain: string;
  gaId: string;
  gscCode: string;
  ogImage: string;
  twitterHandle: string;
  schemaType: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

function buildSeoHead(opts: SeoOptions): string {
  const {
    bizName, metaTitle, metaDesc, keywords, domain, gaId, gscCode,
    ogImage, twitterHandle, schemaType, contactEmail, contactPhone, contactAddress,
  } = opts;
  const title = metaTitle || bizName;
  const desc = metaDesc || `Welcome to ${bizName}. We provide professional services you can trust.`;
  const canonical = domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : "";
  const today = new Date().toISOString().split("T")[0];

  const schemaOrg = JSON.stringify({
    "@context": "https://schema.org",
    "@type": schemaType || "LocalBusiness",
    "name": bizName,
    "description": desc,
    ...(canonical ? { "url": canonical } : {}),
    ...(contactEmail ? { "email": `mailto:${contactEmail}` } : {}),
    ...(contactPhone ? { "telephone": contactPhone } : {}),
    ...(contactAddress ? { "address": { "@type": "PostalAddress", "streetAddress": contactAddress } } : {}),
    ...(ogImage ? { "image": ogImage } : {}),
  });

  const websiteSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": bizName,
    ...(canonical ? { "url": canonical } : {}),
    "potentialAction": canonical ? {
      "@type": "SearchAction",
      "target": `${canonical}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    } : undefined,
  });

  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": canonical || "/" },
    ],
  });

  return `
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<meta name="description" content="${desc.replace(/"/g, "&quot;")}"/>
${keywords ? `<meta name="keywords" content="${keywords.replace(/"/g, "&quot;")}"/>` : ""}
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
<meta name="author" content="${bizName}"/>
<meta name="generator" content="Marketingstuffs AI Website Builder"/>
${canonical ? `<link rel="canonical" href="${canonical}"/>` : ""}
${gscCode ? `<meta name="google-site-verification" content="${gscCode}"/>` : ""}
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website"/>
<meta property="og:title" content="${title.replace(/"/g, "&quot;")}"/>
<meta property="og:description" content="${desc.replace(/"/g, "&quot;")}"/>
${ogImage ? `<meta property="og:image" content="${ogImage}"/>` : ""}
${canonical ? `<meta property="og:url" content="${canonical}"/>` : ""}
<meta property="og:site_name" content="${bizName}"/>
<!-- Twitter Card -->
<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}"/>
<meta name="twitter:title" content="${title.replace(/"/g, "&quot;")}"/>
<meta name="twitter:description" content="${desc.replace(/"/g, "&quot;")}"/>
${ogImage ? `<meta name="twitter:image" content="${ogImage}"/>` : ""}
${twitterHandle ? `<meta name="twitter:site" content="${twitterHandle.startsWith("@") ? twitterHandle : "@" + twitterHandle}"/>` : ""}
<!-- JSON-LD: ${schemaType || "LocalBusiness"} -->
<script type="application/ld+json">${schemaOrg}</script>
<!-- JSON-LD: WebSite -->
<script type="application/ld+json">${websiteSchema}</script>
<!-- JSON-LD: Breadcrumbs -->
<script type="application/ld+json">${breadcrumbSchema}</script>
${gaId ? `<!-- Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});</script>` : ""}
<!-- Sitemap reference -->
${canonical ? `<link rel="sitemap" type="application/xml" href="${canonical}/sitemap.xml"/>` : ""}
<!-- Last modified -->
<meta name="last-modified" content="${today}"/>`.trim();
}

// ── Privacy & Terms generators ────────────────────────────────────────────────

function buildPrivacyPage(bizName: string, contactEmail: string, domain: string): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `<section id="privacy-policy" style="max-width:800px;margin:4rem auto;padding:2rem 1.5rem;font-size:0.95rem;line-height:1.8;color:inherit">
<h1 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem">Privacy Policy</h1>
<p style="opacity:.5;font-size:0.85rem;margin-bottom:2rem">Last updated: ${today}</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">1. Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you contact us, sign up for our newsletter, or use our services. This may include your name, email address, phone number, and any other information you choose to provide.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">2. How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, communicate with you, and comply with legal obligations. We do not sell your personal information to third parties.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">3. Cookies</h2>
<p>We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">4. Data Retention</h2>
<p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">5. Third-Party Services</h2>
<p>Our website may contain links to third-party websites. We have no control over the content and practices of those sites and accept no responsibility for their privacy policies.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">6. Your Rights</h2>
<p>You have the right to access, update, or delete your personal information. To exercise these rights, please contact us at ${contactEmail || `the contact information provided on our website`}.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">7. Contact Us</h2>
<p>If you have questions about this Privacy Policy, please contact us${contactEmail ? ` at <a href="mailto:${contactEmail}">${contactEmail}</a>` : " through our contact page"}.</p>
<p style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,.1);opacity:.5;font-size:0.8rem">© ${new Date().getFullYear()} ${bizName}. All rights reserved.${domain ? ` | ${domain}` : ""}</p>
</section>`;
}

function buildTermsPage(bizName: string, contactEmail: string, domain: string): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `<section id="terms-of-service" style="max-width:800px;margin:4rem auto;padding:2rem 1.5rem;font-size:0.95rem;line-height:1.8;color:inherit">
<h1 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem">Terms of Service</h1>
<p style="opacity:.5;font-size:0.85rem;margin-bottom:2rem">Last updated: ${today}</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">1. Acceptance of Terms</h2>
<p>By accessing and using the services of ${bizName}, you accept and agree to be bound by the terms and provisions of this agreement.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">2. Use of Services</h2>
<p>You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to use our services in any way that violates applicable local, national, or international law or regulation.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">3. Intellectual Property</h2>
<p>The content, features, and functionality of our services are owned by ${bizName} and are protected by international copyright, trademark, and other intellectual property laws.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">4. Disclaimer of Warranties</h2>
<p>Our services are provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">5. Limitation of Liability</h2>
<p>${bizName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">6. Changes to Terms</h2>
<p>We reserve the right to modify these terms at any time. We will notify users of any changes by updating the date at the top of these Terms. Your continued use of our services after any changes constitutes your acceptance of the new Terms.</p>
<h2 style="font-size:1.25rem;font-weight:700;margin:2rem 0 0.5rem">7. Contact Us</h2>
<p>If you have questions about these Terms, please contact us${contactEmail ? ` at <a href="mailto:${contactEmail}">${contactEmail}</a>` : " through our contact page"}.</p>
<p style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,.1);opacity:.5;font-size:0.8rem">© ${new Date().getFullYear()} ${bizName}. All rights reserved.${domain ? ` | ${domain}` : ""}</p>
</section>`;
}

function buildBlogPage(bizName: string, description: string): string {
  return `<section id="blog" style="max-width:1000px;margin:4rem auto;padding:2rem 1.5rem">
<h1 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem">Blog & Insights</h1>
<p style="opacity:.6;margin-bottom:3rem">Tips, news, and insights from the ${bizName} team</p>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:2rem">
${["Industry Tips & Best Practices", "How to Get the Most From Our Services", "Latest News & Updates from " + bizName].map((title, i) => `
<article style="border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;transition:transform .2s" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
  <div style="height:160px;background:linear-gradient(135deg,rgba(59,130,246,.3),rgba(139,92,246,.3));display:flex;align-items:center;justify-content:center;font-size:3rem">${["💡","🚀","📰"][i]}</div>
  <div style="padding:1.25rem">
    <div style="font-size:0.75rem;opacity:.5;margin-bottom:0.5rem">Coming Soon</div>
    <h2 style="font-size:1rem;font-weight:700;margin-bottom:0.75rem">${title}</h2>
    <p style="font-size:0.875rem;opacity:.6;line-height:1.6">Stay tuned for our latest articles, tips, and updates from the ${bizName} team.</p>
    <div style="margin-top:1rem;font-size:0.8rem;opacity:.4;font-weight:600">Read more →</div>
  </div>
</article>`).join("")}
</div>
<div style="margin-top:3rem;padding:2rem;border:1px dashed rgba(255,255,255,.15);border-radius:12px;text-align:center">
  <p style="font-weight:700;margin-bottom:0.5rem">Subscribe to our newsletter</p>
  <p style="font-size:0.875rem;opacity:.5;margin-bottom:1.5rem">Get our latest posts delivered straight to your inbox</p>
  <form style="display:flex;gap:0.75rem;max-width:400px;margin:0 auto" onsubmit="event.preventDefault();alert('Thank you for subscribing!')">
    <input type="email" placeholder="your@email.com" required style="flex:1;padding:0.6rem 1rem;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:inherit;font-size:0.875rem"/>
    <button type="submit" style="padding:0.6rem 1.25rem;border-radius:8px;background:#3b82f6;color:white;font-weight:600;border:none;cursor:pointer;white-space:nowrap">Subscribe</button>
  </form>
</div>
</section>`;
}

// ── Sitemap XML builder ───────────────────────────────────────────────────────

function buildSitemapXml(domain: string, sections: SectionState[], includeExtras: { blog: boolean; privacy: boolean; terms: boolean }): string {
  const base = domain ? (domain.startsWith("http") ? domain.replace(/\/$/, "") : `https://${domain}`) : "https://example.com";
  const today = new Date().toISOString().split("T")[0];
  const urls = [
    { loc: `${base}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${base}/#about`, priority: "0.8", changefreq: "monthly" },
    { loc: `${base}/#services`, priority: "0.8", changefreq: "monthly" },
    { loc: `${base}/#portfolio`, priority: "0.7", changefreq: "monthly" },
    { loc: `${base}/#contact`, priority: "0.7", changefreq: "monthly" },
    ...(includeExtras.blog ? [{ loc: `${base}/#blog`, priority: "0.8", changefreq: "daily" }] : []),
    ...(includeExtras.privacy ? [{ loc: `${base}/#privacy-policy`, priority: "0.3", changefreq: "yearly" }] : []),
    ...(includeExtras.terms ? [{ loc: `${base}/#terms-of-service`, priority: "0.3", changefreq: "yearly" }] : []),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
}

// ── Combine all sections into one SEO-optimised HTML document ────────────────

function combinePages(sections: SectionState[], seo?: SeoOptions, extras?: { blog: boolean; privacy: boolean; terms: boolean; description: string }): string {
  const homepage = sections.find(s => s.key === "homepage" && s.status === "done");
  if (!homepage?.html) return "";
  const others = sections.filter(s => s.key !== "homepage" && s.status === "done");
  const otherHtml = others.map(s => s.html).join("\n");

  // Strip the closing body/html and append other sections then close
  let base = homepage.html
    .replace(/<\/body>\s*<\/html>\s*$/i, "")
    .replace(/<\/body>\s*$/i, "");

  // Inject SEO into <head> if seo options provided
  if (seo) {
    const seoHtml = buildSeoHead(seo);
    // Replace existing <head>...</head> OR inject after <head>
    if (/<head>/i.test(base)) {
      base = base.replace(/<head>/i, `<head>\n${seoHtml}`);
    } else if (/<html[^>]*>/i.test(base)) {
      base = base.replace(/<html([^>]*)>/i, `<html$1>\n<head>\n${seoHtml}\n</head>`);
    }
  }

  const extraPages = extras ? [
    extras.blog ? buildBlogPage(seo?.bizName ?? "", extras.description) : "",
    extras.privacy ? buildPrivacyPage(seo?.bizName ?? "", seo?.contactEmail ?? "", seo?.domain ?? "") : "",
    extras.terms ? buildTermsPage(seo?.bizName ?? "", seo?.contactEmail ?? "", seo?.domain ?? "") : "",
  ].filter(Boolean).join("\n") : "";

  return base + "\n" + otherHtml + "\n" + extraPages + "\n</body>\n</html>";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WebsiteDeveloperSection() {
  const { requestGeneration } = useGenerationGate();
  // ─ Phase state ─
  const [phase, setPhase] = useState<Phase>("welcome");
  const [wizardStep, setWizardStep] = useState(0); // 0..3

  // ─ Wizard form ─
  const [bizType, setBizType] = useState("");
  const [bizTypeLabel, setBizTypeLabel] = useState("");
  const [bizName, setBizName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [audience, setAudience] = useState("");
  const [ctaText, setCtaText] = useState("Get Started");
  const [style, setStyle] = useState("modern");
  const [templateId, setTemplateId] = useState("business-pro");
  const [fontId, setFontId] = useState("inter");
  const [colorId, setColorId] = useState("dark-pro");
  const [logoText, setLogoText] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactInstagram, setContactInstagram] = useState("");
  const [contactTwitter, setContactTwitter] = useState("");
  const [contactFacebook, setContactFacebook] = useState("");

  // ─ SEO & Publishing ─
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoMetaTitle, setSeoMetaTitle] = useState("");
  const [seoMetaDesc, setSeoMetaDesc] = useState("");
  const [seoDomain, setSeoDomain] = useState("");
  const [seoGAId, setSeoGAId] = useState("");
  const [seoGSCCode, setSeoGSCCode] = useState("");
  const [seoOGImage, setSeoOGImage] = useState("");
  const [seoTwitterHandle, setSeoTwitterHandle] = useState("");
  const [seoSchemaType, setSeoSchemaType] = useState("LocalBusiness");
  const [includeBlog, setIncludeBlog] = useState(true);
  const [includePrivacy, setIncludePrivacy] = useState(true);
  const [includeTerms, setIncludeTerms] = useState(true);
  const [seoSectionOpen, setSeoSectionOpen] = useState<string | null>("basics");

  // ─ AI auto-fill ─
  const [autoFilling, setAutoFilling] = useState(false);

  // ─ Building phase ─
  const [sections, setSections] = useState<SectionState[]>(
    PAGES_TO_BUILD.map(p => ({ ...p, status: "pending", html: "" }))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef(false);

  // ─ Done phase ─
  const [device, setDevice] = useState<DeviceView>("desktop");
  const [finalHtml, setFinalHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editingWith, setEditingWith] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showDirectHtml, setShowDirectHtml] = useState(false);
  const [directHtmlContent, setDirectHtmlContent] = useState("");
  const [directHtmlApplied, setDirectHtmlApplied] = useState(false);
  const [aiEditError, setAiEditError] = useState("");

  const colorScheme = COLOR_SCHEMES.find(c => c.id === colorId) ?? COLOR_SCHEMES[0];
  const fontPairing = FONT_PAIRINGS.find(f => f.id === fontId) ?? FONT_PAIRINGS[0];

  // ─ Build the API payload ─
  const buildPayload = (sectionType: SectionKey) => ({
    sectionType,
    businessName: bizName,
    tagline: tagline || `Excellence in ${bizTypeLabel || bizName}`,
    description,
    services,
    audience,
    ctaText,
    contactEmail,
    contactPhone,
    contactAddress,
    socialInstagram: contactInstagram,
    socialTwitter: contactTwitter,
    socialFacebook: contactFacebook,
    fontHeading: fontPairing.heading,
    fontBody: fontPairing.body,
    colorScheme: `${style} ${colorScheme.name}`,
    accentColor: colorScheme.accent,
    bgColor: colorScheme.bg,
    textColor: colorScheme.text,
    templateStyle: TEMPLATES.find(t => t.id === templateId)?.label ?? "Business Pro",
  });

  // ─ Auto-fill business info ─
  const autoFill = async () => {
    if (!bizName || !bizType) return;
    setAutoFilling(true);
    try {
      const res = await fetch("/api/ai/auto-generate-business-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: bizName, businessType: bizTypeLabel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tagline)     setTagline(data.tagline);
        if (data.description) setDescription(data.description);
        if (data.services)    setServices(data.services);
        if (data.audience)    setAudience(data.audience);
        if (data.ctaText)     setCtaText(data.ctaText);
      }
    } finally {
      setAutoFilling(false);
    }
  };

  // ─ Generate one section ─
  const generateSection = useCallback(async (idx: number, isRegen = false) => {
    const section = PAGES_TO_BUILD[idx];
    if (!section) return;
    abortRef.current = false;
    setIsGenerating(true);

    setSections(prev => prev.map((s, i) =>
      i === idx ? { ...s, status: "generating", html: isRegen ? "" : s.html } : s
    ));

    let html = "";
    await streamSection(
      buildPayload(section.key),
      (chunk) => {
        if (abortRef.current) return;
        html += chunk;
        setSections(prev => prev.map((s, i) =>
          i === idx ? { ...s, html } : s
        ));
      },
      () => {
        if (abortRef.current) return;
        setSections(prev => prev.map((s, i) =>
          i === idx ? { ...s, status: "done", html } : s
        ));
        setIsGenerating(false);
      },
      (err) => {
        setSections(prev => prev.map((s, i) =>
          i === idx ? { ...s, status: "done", html: `<p style="color:red;padding:2rem">Error: ${err}</p>` } : s
        ));
        setIsGenerating(false);
      }
    );
  }, [bizName, tagline, description, services, audience, ctaText, contactEmail, contactPhone,
      contactAddress, contactInstagram, contactTwitter, contactFacebook, fontId, colorId, style, templateId, bizTypeLabel]);

  // ─ Start the building phase ─
  const startBuilding = () => {
    setLogoText(logoText || bizName);
    const fresh = PAGES_TO_BUILD.map(p => ({ ...p, status: "pending" as const, html: "" }));
    setSections(fresh);
    setCurrentIdx(0);
    setPhase("building");
    setTimeout(() => generateSection(0), 100);
  };

  // ─ Keep & move next ─
  const keepAndNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= PAGES_TO_BUILD.length) {
      finalize();
    } else {
      setCurrentIdx(nextIdx);
      generateSection(nextIdx);
    }
  };

  // ─ Skip page ─
  const skipPage = () => {
    setSections(prev => prev.map((s, i) => i === currentIdx ? { ...s, status: "skipped" } : s));
    const nextIdx = currentIdx + 1;
    if (nextIdx >= PAGES_TO_BUILD.length) {
      finalize();
    } else {
      setCurrentIdx(nextIdx);
      generateSection(nextIdx);
    }
  };

  // ─ Finalize — compute combined HTML from latest sections ─
  const finalizeSections = useCallback((latestSections: SectionState[]) => {
    const seoOpts: SeoOptions = {
      bizName, metaTitle: seoMetaTitle, metaDesc: seoMetaDesc,
      keywords: seoKeywords, domain: seoDomain, gaId: seoGAId,
      gscCode: seoGSCCode, ogImage: seoOGImage, twitterHandle: seoTwitterHandle,
      schemaType: seoSchemaType, contactEmail, contactPhone, contactAddress,
    };
    const combined = combinePages(latestSections, seoOpts, { blog: includeBlog, privacy: includePrivacy, terms: includeTerms, description });
    setFinalHtml(combined);
    setPhase("done");
  }, [bizName, seoMetaTitle, seoMetaDesc, seoKeywords, seoDomain, seoGAId, seoGSCCode, seoOGImage, seoTwitterHandle, seoSchemaType, contactEmail, contactPhone, contactAddress, includeBlog, includePrivacy, includeTerms, description]);

  const finalize = () => {
    setSections(prev => {
      finalizeSections(prev);
      return prev;
    });
  };

  // ─ Copy HTML ─
  const copyHtml = async () => {
    await navigator.clipboard.writeText(finalHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─ Download HTML ─
  const downloadHtml = () => {
    const blob = new Blob([finalHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bizName.replace(/\s+/g, "-").toLowerCase()}-website.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deviceWidth: Record<DeviceView, string> = {
    desktop: "100%", tablet: "768px", mobile: "390px",
  };

  // ───────────────────────────────────────────────────────────────
  // RENDER: WELCOME
  // ───────────────────────────────────────────────────────────────
  if (phase === "welcome") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
            <Globe size={14} /> AI Website Builder — Powered by Free AI Models
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            Build a Complete<br /><span className="text-blue-400">AI Website</span> in Minutes
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Enter your business details, let AI generate your Homepage, About, Services, and Contact pages.
            Then preview, customize, and download.
          </p>

          {/* 5 Phase steps */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
            {[
              { n: "1", label: "Setup",     emoji: "📋", desc: "Business info" },
              { n: "2", label: "Style",     emoji: "🎨", desc: "Colors & fonts" },
              { n: "3", label: "Generate",  emoji: "⚡", desc: "AI builds pages" },
              { n: "4", label: "Review",    emoji: "👁️", desc: "Keep or redo" },
              { n: "5", label: "Publish",   emoji: "🚀", desc: "Download & share" },
            ].map(step => (
              <div key={step.n} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{step.emoji}</div>
                <div className="text-white font-semibold text-sm">{step.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{step.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {[["500+", "Websites Built"], ["4 Pages", "Auto-Generated"], ["100%", "Free AI Models"]].map(([val, lbl]) => (
              <div key={lbl} className="text-center">
                <div className="text-3xl font-black text-blue-400">{val}</div>
                <div className="text-slate-400 text-sm">{lbl}</div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setPhase("wizard")}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 text-lg rounded-xl font-bold shadow-lg shadow-blue-500/30"
          >
            <Plus size={20} className="mr-2" /> Create New Website
          </Button>
        </motion.div>
      </div>
    </div>
  );

  // ───────────────────────────────────────────────────────────────
  // RENDER: WIZARD (4 steps)
  // ───────────────────────────────────────────────────────────────
  if (phase === "wizard") {
    const STEP_LABELS = ["Business", "Content & AI", "Contact", "Style & Template", "SEO & Publishing"];
    const canNext = [
      bizType !== "" && bizName.trim() !== "",
      description.trim() !== "",
      true, // contact is optional
      true, // style/template always valid
      true, // SEO is optional
    ];

    return (
      <div className="min-h-screen bg-slate-950 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header + back */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setPhase("welcome")} className="text-slate-500 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-white font-bold text-xl">New Website Setup</h2>
              <p className="text-slate-400 text-sm">Step {wizardStep + 1} of {STEP_LABELS.length} — {STEP_LABELS[wizardStep]}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-8">
            {STEP_LABELS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= wizardStep ? "bg-blue-500" : "bg-slate-700"}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={wizardStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>

              {/* ── Step 0: Business Name + Type ── */}
              {wizardStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-4">What kind of business is this?</h3>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {BUSINESS_TYPES.map(bt => (
                        <button
                          key={bt.id}
                          onClick={() => { setBizType(bt.id); setBizTypeLabel(bt.label); }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-sm transition-all ${bizType === bt.id ? "border-blue-500 bg-blue-500/20 text-white" : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500"}`}
                        >
                          <span className="text-lg">{bt.emoji}</span>
                          <span className="leading-tight">{bt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 block">Business Name</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. Luna Photography Studio"
                      value={bizName}
                      onChange={e => setBizName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 1: Business Description + AI Auto-Fill ── */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">Describe your business</h3>
                    <button
                      onClick={autoFill}
                      disabled={autoFilling || !bizName}
                      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      {autoFilling ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                      AI Auto-Fill
                    </button>
                  </div>
                  {[
                    { label: "Tagline", value: tagline, set: setTagline, ph: "e.g. Capturing life's most beautiful moments" },
                    { label: "Business Description", value: description, set: setDescription, ph: `Tell customers what ${bizName || "your business"} does and why you're the best choice...`, rows: 3 },
                    { label: "Services / Products", value: services, set: setServices, ph: "e.g. Wedding Photography, Portrait Sessions, Photo Editing..." },
                    { label: "Target Audience", value: audience, set: setAudience, ph: "e.g. Couples, families, and businesses in New York" },
                    { label: "CTA Button Text", value: ctaText, set: setCtaText, ph: "e.g. Book a Session" },
                  ].map(({ label, value, set, ph, rows }) => (
                    <div key={label}>
                      <label className="text-slate-300 font-medium text-sm mb-1.5 block">{label}</label>
                      {rows ? (
                        <textarea
                          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                          placeholder={ph} value={value} onChange={e => set(e.target.value)} rows={rows}
                        />
                      ) : (
                        <input
                          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder={ph} value={value} onChange={e => set(e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Step 2: Contact Info ── */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">Contact Information</h3>
                      <p className="text-slate-400 text-sm mt-1">Appears on your Contact page and footer. All optional.</p>
                    </div>
                    <button onClick={() => setWizardStep(3)} className="text-slate-500 hover:text-white text-sm flex items-center gap-1">
                      Skip <SkipForward size={14} />
                    </button>
                  </div>
                  {[
                    { icon: <Mail size={15} />, label: "Email Address", value: contactEmail, set: setContactEmail, ph: "hello@yourbusiness.com" },
                    { icon: <Phone size={15} />, label: "Phone Number", value: contactPhone, set: setContactPhone, ph: "+1 (555) 123-4567" },
                    { icon: <MapPin size={15} />, label: "Address", value: contactAddress, set: setContactAddress, ph: "123 Main Street, New York, NY 10001" },
                  ].map(({ icon, label, value, set, ph }) => (
                    <div key={label}>
                      <label className="text-slate-300 font-medium text-sm mb-1.5 flex items-center gap-1.5">{icon}{label}</label>
                      <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder={ph} value={value} onChange={e => set(e.target.value)} />
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: <Instagram size={14} />, label: "@instagram", value: contactInstagram, set: setContactInstagram },
                      { icon: <Twitter size={14} />, label: "@twitter", value: contactTwitter, set: setContactTwitter },
                      { icon: <Facebook size={14} />, label: "facebook.com/...", value: contactFacebook, set: setContactFacebook },
                    ].map(({ icon, label, value, set }) => (
                      <div key={label}>
                        <label className="text-slate-400 text-xs mb-1 flex items-center gap-1">{icon}</label>
                        <input className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder={label} value={value} onChange={e => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Style, Template, Font, Colors ── */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-white font-bold text-lg">Style & Customization</h3>

                  {/* Logo text */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-1.5 flex items-center gap-1.5"><Upload size={13} /> Logo / Brand Name</label>
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder={bizName || "Your Brand"} value={logoText} onChange={e => setLogoText(e.target.value)} />
                    <p className="text-slate-500 text-xs mt-1">Logo will be displayed as styled text in the nav bar</p>
                  </div>

                  {/* Website style */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 block">Website Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {WEBSITE_STYLES.map(s => (
                        <button key={s.id} onClick={() => setStyle(s.id)} className={`p-2.5 rounded-lg border text-center transition-all ${style === s.id ? "border-blue-500 bg-blue-500/20 text-white" : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500"}`}>
                          <div className="text-xl mb-0.5">{s.emoji}</div>
                          <div className="text-xs font-semibold">{s.label}</div>
                          <div className="text-slate-500 text-xs hidden sm:block">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 flex items-center gap-1.5"><ImageIcon size={13} /> Template Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setTemplateId(t.id)} className={`p-3 rounded-xl border text-left transition-all ${templateId === t.id ? "border-blue-500 bg-blue-500/20" : "border-slate-700 bg-slate-800/40 hover:border-slate-500"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{t.emoji}</span>
                            <span className={`font-semibold text-sm ${templateId === t.id ? "text-white" : "text-slate-300"}`}>{t.label}</span>
                          </div>
                          <p className="text-slate-500 text-xs leading-snug">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font pairing */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 flex items-center gap-1.5"><Type size={13} /> Font Pairing</label>
                    <div className="space-y-2">
                      {FONT_PAIRINGS.map(f => (
                        <button key={f.id} onClick={() => setFontId(f.id)} className={`w-full text-left p-3 rounded-xl border transition-all ${fontId === f.id ? "border-blue-500 bg-blue-500/20 text-white" : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500"}`}>
                          <span className="text-sm font-medium">{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color scheme */}
                  <div>
                    <label className="text-slate-300 font-medium text-sm mb-2 flex items-center gap-1.5"><Palette size={13} /> Color Scheme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_SCHEMES.map(c => (
                        <button key={c.id} onClick={() => setColorId(c.id)} className={`p-3 rounded-xl border transition-all ${colorId === c.id ? "border-blue-500 ring-2 ring-blue-500/40" : "border-slate-700 hover:border-slate-500"}`} style={{ background: c.bg }}>
                          <div className="flex gap-1.5 justify-center mb-1.5">
                            {[c.bg, c.accent, c.text].map((col, i) => (
                              <span key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: col }} />
                            ))}
                          </div>
                          <div className="text-xs font-medium text-center" style={{ color: c.text }}>{c.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4: SEO & Publishing ── */}
              {wizardStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><Search size={18} className="text-green-400"/>SEO & Publishing Setup</h3>
                    <p className="text-slate-400 text-sm mt-1">All fields are optional — fill in what you have to maximise search rankings.</p>
                  </div>

                  {/* Basics accordion */}
                  {[
                    {
                      id: "basics", icon: <Search size={14} className="text-green-400"/>, label: "Basic SEO",
                      content: (
                        <div className="space-y-3 pt-3">
                          {[
                            { label: "Website Domain / URL", value: seoDomain, set: setSeoDomain, ph: "https://yourbusiness.com", hint: "Used for canonical URLs and Open Graph tags" },
                            { label: "Target Keywords", value: seoKeywords, set: setSeoKeywords, ph: "e.g. photography studio, wedding photographer, portrait photos", hint: "Comma-separated — helps search engines understand your content" },
                            { label: "SEO Meta Title", value: seoMetaTitle, set: setSeoMetaTitle, ph: bizName || "Your Business Name — Best Services in Your City", hint: "Shown in browser tab & Google results (55-60 chars ideal)" },
                            { label: "Meta Description", value: seoMetaDesc, set: setSeoMetaDesc, ph: description ? description.slice(0, 155) : "Describe your business in 150-155 characters for Google search results…", hint: "Shown under your link in Google results (150-155 chars ideal)" },
                          ].map(({ label, value, set, ph, hint }) => (
                            <div key={label}>
                              <label className="text-slate-300 font-medium text-xs mb-1 block">{label}</label>
                              <input
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors"
                                placeholder={ph} value={value} onChange={e => set(e.target.value)}
                              />
                              <p className="text-slate-500 text-xs mt-0.5">{hint}</p>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                    {
                      id: "analytics", icon: <BarChart2 size={14} className="text-blue-400"/>, label: "Google Analytics & Search Console",
                      content: (
                        <div className="space-y-3 pt-3">
                          <div>
                            <label className="text-slate-300 font-medium text-xs mb-1 block">Google Analytics ID (GA4)</label>
                            <input
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                              placeholder="G-XXXXXXXXXX" value={seoGAId} onChange={e => setSeoGAId(e.target.value)}
                            />
                            <p className="text-slate-500 text-xs mt-0.5">Find this in Google Analytics → Admin → Data Streams</p>
                          </div>
                          <div>
                            <label className="text-slate-300 font-medium text-xs mb-1 block">Google Search Console Verification Code</label>
                            <input
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                              placeholder="Paste the content value from your meta tag" value={seoGSCCode} onChange={e => setSeoGSCCode(e.target.value)}
                            />
                            <p className="text-slate-500 text-xs mt-0.5">Search Console → Add property → HTML tag → copy the content="..." value only</p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "social", icon: <ImageIcon size={14} className="text-pink-400"/>, label: "Social Sharing (Open Graph & Twitter Cards)",
                      content: (
                        <div className="space-y-3 pt-3">
                          <div>
                            <label className="text-slate-300 font-medium text-xs mb-1 block">Social Share Image URL</label>
                            <input
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                              placeholder="https://yourdomain.com/og-image.jpg (1200×630px)" value={seoOGImage} onChange={e => setSeoOGImage(e.target.value)}
                            />
                            <p className="text-slate-500 text-xs mt-0.5">Shown when someone shares your site on Facebook, Twitter, LinkedIn (1200×630px recommended)</p>
                          </div>
                          <div>
                            <label className="text-slate-300 font-medium text-xs mb-1 block">Twitter / X Handle</label>
                            <input
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                              placeholder="@yourbusiness" value={seoTwitterHandle} onChange={e => setSeoTwitterHandle(e.target.value)}
                            />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "schema", icon: <Link2 size={14} className="text-violet-400"/>, label: "Structured Data (Schema.org)",
                      content: (
                        <div className="space-y-3 pt-3">
                          <div>
                            <label className="text-slate-300 font-medium text-xs mb-2 block">Business Schema Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "LocalBusiness", label: "Local Business" },
                                { id: "Organization", label: "Organization" },
                                { id: "Restaurant", label: "Restaurant" },
                                { id: "MedicalBusiness", label: "Medical" },
                                { id: "ProfessionalService", label: "Professional Service" },
                                { id: "Store", label: "E-commerce Store" },
                              ].map(st => (
                                <button key={st.id} onClick={() => setSeoSchemaType(st.id)}
                                  className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${seoSchemaType === st.id ? "border-violet-500 bg-violet-500/20 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                                  {st.label}
                                </button>
                              ))}
                            </div>
                            <p className="text-slate-500 text-xs mt-1.5">Helps Google display rich results (star ratings, business info) in search</p>
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-xs text-slate-400 space-y-1">
                            <p className="text-slate-300 font-semibold text-xs mb-1.5">Automatically included in your website:</p>
                            {["✅ JSON-LD structured data (LocalBusiness/Organization)", "✅ WebSite schema with SearchAction", "✅ BreadcrumbList schema", "✅ Open Graph meta tags (Facebook)", "✅ Twitter Card meta tags", "✅ Canonical URL tag", "✅ Robots meta (index, follow)", "✅ XML Sitemap (download separately)"].map(i => <p key={i}>{i}</p>)}
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "pages", icon: <FileText size={14} className="text-amber-400"/>, label: "Extra Pages",
                      content: (
                        <div className="space-y-3 pt-3">
                          <p className="text-slate-400 text-xs">These pages are auto-generated and appended to your website:</p>
                          {[
                            { value: includeBlog, set: setIncludeBlog, icon: <BookOpen size={14} className="text-blue-400"/>, label: "Blog & Insights page", desc: "A professional blog listing page with newsletter signup" },
                            { value: includePrivacy, set: setIncludePrivacy, icon: <Shield size={14} className="text-green-400"/>, label: "Privacy Policy", desc: "GDPR-compliant privacy policy page (auto-filled with your business info)" },
                            { value: includeTerms, set: setIncludeTerms, icon: <FileText size={14} className="text-violet-400"/>, label: "Terms of Service", desc: "Standard terms & conditions page (auto-filled with your business info)" },
                          ].map(({ value, set, icon, label, desc }) => (
                            <button key={label} onClick={() => set(!value)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${value ? "border-green-500/40 bg-green-500/10" : "border-slate-700 bg-slate-800/30 hover:border-slate-500"}`}>
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${value ? "bg-green-500" : "bg-slate-700"}`}>
                                {value && <Check size={12} className="text-white"/>}
                              </div>
                              {icon}
                              <div>
                                <p className={`text-sm font-semibold ${value ? "text-white" : "text-slate-400"}`}>{label}</p>
                                <p className="text-xs text-slate-500">{desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ),
                    },
                  ].map(({ id, icon, label, content }) => (
                    <div key={id} className="border border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setSeoSectionOpen(seoSectionOpen === id ? null : id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">{icon}{label}</div>
                        {seoSectionOpen === id ? <ChevronUp size={14} className="text-slate-500"/> : <ChevronDown size={14} className="text-slate-500"/>}
                      </button>
                      <AnimatePresence>
                        {seoSectionOpen === id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4">{content}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
              className="text-slate-400 hover:text-white"
              disabled={wizardStep === 0}
            >
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
            {wizardStep < 4 ? (
              <Button
                onClick={() => setWizardStep(wizardStep + 1)}
                disabled={!canNext[wizardStep]}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 disabled:opacity-40"
              >
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => requestGeneration(startBuilding)}
                disabled={!bizName}
                className="bg-green-600 hover:bg-green-500 text-white px-8 font-bold shadow-lg shadow-green-500/25"
              >
                <Zap size={16} className="mr-2" /> Start Building
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // RENDER: BUILDING (page-by-page generation)
  // ───────────────────────────────────────────────────────────────
  if (phase === "building") {
    const current = sections[currentIdx];
    const totalDone = sections.filter(s => s.status === "done" || s.status === "skipped").length;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Top bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-blue-400" />
              <span className="text-white font-bold">{bizName}</span>
              <span className="text-slate-500 text-sm">— Building Website</span>
            </div>
            <div className="flex items-center gap-2">
              {sections.map((s, i) => (
                <div key={s.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${i === currentIdx ? "bg-blue-600 text-white" : s.status === "done" ? "bg-green-800/50 text-green-400" : s.status === "skipped" ? "bg-slate-800 text-slate-500 line-through" : "bg-slate-800 text-slate-400"}`}>
                  {s.status === "done" && <CheckCircle2 size={11} />}
                  {s.status === "generating" && <Loader2 size={11} className="animate-spin" />}
                  {s.emoji} {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          {/* Current page header */}
          <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{current.emoji}</span>
                  <div>
                    <h3 className="text-white font-bold">{current.label}</h3>
                    <p className="text-slate-400 text-xs">{current.desc}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Generating with AI...
                  </div>
                ) : current.status === "done" ? (
                  <>
                    <button
                      onClick={() => generateSection(currentIdx, true)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </button>
                    <button
                      onClick={skipPage}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <SkipForward size={14} /> Skip
                    </button>
                    <button
                      onClick={keepAndNext}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      {currentIdx < PAGES_TO_BUILD.length - 1 ? "Keep & Next →" : "Finish →"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Preview iframe */}
          <div className="flex-1 relative bg-slate-900 overflow-hidden">
            {current.html ? (
              <iframe
                srcDoc={current.html}
                className="w-full h-full border-0"
                style={{ minHeight: "calc(100vh - 200px)" }}
                title={`${current.label} preview`}
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full" style={{ minHeight: "calc(100vh - 200px)" }}>
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={32} className="text-blue-400 animate-spin" />
                    </div>
                  </div>
                  <p className="text-white font-semibold text-lg">Generating {current.label}...</p>
                  <p className="text-slate-400 text-sm mt-1">AI is writing your {current.desc.toLowerCase()}</p>
                  <div className="mt-4 flex gap-1 justify-center">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress footer */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2">
            <div className="max-w-6xl mx-auto flex items-center gap-3">
              <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${(totalDone / PAGES_TO_BUILD.length) * 100}%` }} />
              </div>
              <span className="text-slate-400 text-xs">{totalDone}/{PAGES_TO_BUILD.length} pages</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // RENDER: DONE (full preview + customize + publish)
  // ───────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Top bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setPhase("building"); setCurrentIdx(0); }} className="text-slate-500 hover:text-white">
              <ChevronLeft size={20} />
            </button>
            <Globe size={18} className="text-green-400" />
            <span className="text-white font-bold">{bizName}</span>
            <span className="bg-green-800/50 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-700/50">Ready</span>
          </div>

          {/* Device toggle */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
            {(["desktop", "tablet", "mobile"] as DeviceView[]).map(d => {
              const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
              return (
                <button key={d} onClick={() => setDevice(d)} className={`p-2 rounded-lg transition-colors ${device === d ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  <Icon size={16} />
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowEditPanel(v => !v); setShowDirectHtml(false); setAiEditError(""); }}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${showEditPanel ? "bg-violet-600/20 text-violet-300 border-violet-500/40" : "text-slate-300 hover:text-white border-slate-700 hover:border-slate-500"}`}
            >
              <Sparkles size={14} /> Edit with AI
            </button>
            <button
              onClick={() => { setShowDirectHtml(v => !v); if (!showDirectHtml) setDirectHtmlContent(finalHtml); setShowEditPanel(false); }}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${showDirectHtml ? "bg-sky-600/20 text-sky-300 border-sky-500/40" : "text-slate-300 hover:text-white border-slate-700 hover:border-slate-500"}`}
            >
              <Upload size={14} /> Edit HTML
            </button>
            <button
              onClick={copyHtml}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy HTML"}
            </button>
            <button
              onClick={downloadHtml}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg font-semibold transition-colors"
            >
              <Download size={14} /> Download HTML
            </button>
            <button
              onClick={() => {
                const xml = buildSitemapXml(seoDomain, sections, { blog: includeBlog, privacy: includePrivacy, terms: includeTerms });
                const blob = new Blob([xml], { type: "application/xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "sitemap.xml";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg font-semibold transition-colors"
              title="Download sitemap.xml — upload to your web server root"
            >
              <Map size={14} /> Sitemap
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* AI Edit Panel */}
          <AnimatePresence>
            {showEditPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden shrink-0"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2"><Sparkles size={16} className="text-violet-400" />Edit with AI</h3>
                  <button onClick={() => setShowEditPanel(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                </div>
                <div className="p-4 flex-1 space-y-4 overflow-y-auto">
                  <p className="text-slate-400 text-xs">Describe what you want to change and AI will update the website.</p>

                  {/* Quick edits */}
                  <div>
                    <p className="text-slate-300 text-xs font-semibold mb-2">Quick edits</p>
                    <div className="space-y-1.5">
                      {[
                        "Make the hero section more energetic",
                        "Add more social proof and testimonials",
                        "Make the pricing section clearer",
                        "Change the CTA text to be more compelling",
                        "Add an FAQ section to the contact page",
                      ].map(q => (
                        <button key={q} onClick={() => setEditPrompt(q)} className="w-full text-left text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom edit */}
                  <div>
                    <p className="text-slate-300 text-xs font-semibold mb-1.5">Custom instruction</p>
                    <textarea
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none transition-colors"
                      placeholder="e.g. Change the color scheme to green, make the headline shorter..."
                      rows={3}
                      value={editPrompt}
                      onChange={e => setEditPrompt(e.target.value)}
                    />
                    {aiEditError && <p className="text-red-400 text-xs mt-1">{aiEditError}</p>}
                    <Button
                      onClick={async () => {
                        if (!editPrompt.trim()) return;
                        setEditingWith(true);
                        setAiEditError("");
                        const instruction = editPrompt;
                        setEditPrompt("");
                        try {
                          const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/__api";
                          const res = await fetch(`${API}/api/ai/edit-website`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ currentHtml: finalHtml, instruction }),
                          });
                          if (!res.ok) throw new Error(await res.text());
                          const data = await res.json();
                          if (data.html) setFinalHtml(data.html);
                          else throw new Error("No HTML returned");
                        } catch (err: unknown) {
                          setAiEditError(err instanceof Error ? err.message : "Edit failed. Please try again.");
                        } finally {
                          setEditingWith(false);
                        }
                      }}
                      disabled={!editPrompt.trim() || editingWith}
                      className="w-full mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
                    >
                      {editingWith ? <><Loader2 size={14} className="animate-spin mr-2" />Applying...</> : <><Sparkles size={14} className="mr-2" />Apply Change</>}
                    </Button>
                  </div>

                  {/* Website stats */}
                  <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <p className="text-slate-300 text-xs font-semibold mb-2">Website Summary</p>
                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between"><span>Pages generated</span><span className="text-white">{sections.filter(s => s.status === "done").length}</span></div>
                      <div className="flex justify-between"><span>Pages skipped</span><span className="text-white">{sections.filter(s => s.status === "skipped").length}</span></div>
                      <div className="flex justify-between"><span>Template</span><span className="text-white">{TEMPLATES.find(t => t.id === templateId)?.label}</span></div>
                      <div className="flex justify-between"><span>Color scheme</span><span className="text-white">{COLOR_SCHEMES.find(c => c.id === colorId)?.name}</span></div>
                      <div className="flex justify-between"><span>Font</span><span className="text-white">{FONT_PAIRINGS.find(f => f.id === fontId)?.label.split("—")[0].trim()}</span></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Direct HTML Editor */}
          <AnimatePresence>
            {showDirectHtml && (
              <motion.div
                initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden shrink-0"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <Upload size={14} className="text-sky-400" /> Edit HTML Directly
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">Edit the raw HTML — preview updates on Apply</p>
                  </div>
                  <button onClick={() => setShowDirectHtml(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col p-3 gap-3">
                  <textarea
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-slate-300 text-xs font-mono focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
                    value={directHtmlContent}
                    onChange={e => { setDirectHtmlContent(e.target.value); setDirectHtmlApplied(false); }}
                    spellCheck={false}
                    placeholder="Full HTML of the website…"
                    style={{ minHeight: 300 }}
                  />
                  <div className="space-y-2">
                    <Button
                      onClick={() => { setFinalHtml(directHtmlContent); setDirectHtmlApplied(true); }}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white text-sm"
                    >
                      {directHtmlApplied ? <><Check size={14} className="mr-1.5 text-green-300" />Applied!</> : <><RefreshCw size={14} className="mr-1.5" />Apply to Preview</>}
                    </Button>
                    <button
                      onClick={() => setDirectHtmlContent(finalHtml)}
                      className="w-full text-slate-400 hover:text-white text-xs py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
                    >
                      Reset to Current
                    </button>
                    <div className="text-[10px] text-slate-600 text-center">
                      {directHtmlContent.length.toLocaleString()} characters
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview */}
          <div className="flex-1 overflow-auto bg-slate-800 flex items-start justify-center p-6">
            <div
              className="bg-white shadow-2xl transition-all duration-500 rounded-lg overflow-hidden"
              style={{ width: deviceWidth[device], maxWidth: "100%", minHeight: "calc(100vh - 100px)" }}
            >
              {finalHtml ? (
                <iframe
                  srcDoc={finalHtml}
                  className="w-full border-0"
                  style={{ height: "calc(100vh - 100px)", minHeight: 600 }}
                  title="Website preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Combining all pages...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Build new site button */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="text-slate-400 text-sm">
            🎉 Your website is ready! Download the HTML file and host it anywhere.
          </div>
          <button
            onClick={() => { setPhase("welcome"); setWizardStep(0); setBizType(""); setBizName(""); setDescription(""); setSections(PAGES_TO_BUILD.map(p => ({ ...p, status: "pending", html: "" }))); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Build Another Website
          </button>
        </div>
      </div>
    );
  }

  return null;
}
