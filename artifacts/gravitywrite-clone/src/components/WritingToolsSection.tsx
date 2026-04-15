import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Copy, Check, RefreshCw, Sparkles, Search, BookmarkPlus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveToMediaLibrary } from "@/components/MediaLibrary";

// ── Field types ───────────────────────────────────────────────
interface ChipField     { type: "chips";    id: string; label: string; options: string[]; }
interface InputField    { type: "input";    id: string; label: string; placeholder: string; }
interface TextareaField { type: "textarea"; id: string; label: string; placeholder: string; rows?: number; }
interface SelectField   { type: "select";   id: string; label: string; options: string[]; }
type FieldDef = ChipField | InputField | TextareaField | SelectField;

type Cat = "blog"|"youtube"|"social"|"email"|"advertising"|"code"|"writing"|"business"|"marketing"|"ecommerce"|"book"|"education"|"hr"|"website"|"video"|"personal"|"rewriting";

interface ToolDef {
  id: string; name: string; description: string; emoji: string; color: string; category: Cat;
  fields: FieldDef[]; systemPrompt: string; buildUserPrompt: (f: Record<string,string>) => string;
}

// ── SSE helper ────────────────────────────────────────────────
async function streamTool(sys: string, usr: string, onChunk: (t: string) => void) {
  const r = await fetch("/api/ai/tool-generate", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({systemPrompt:sys,userPrompt:usr}) });
  if (!r.ok || !r.body) throw new Error("Network error");
  const reader = r.body.getReader(); const dec = new TextDecoder(); let buf="";
  while(true){
    const {done,value} = await reader.read(); if(done) break;
    buf += dec.decode(value,{stream:true});
    const lines = buf.split("\n"); buf = lines.pop()??"";
    for(const line of lines){
      if(!line.startsWith("data: ")) continue;
      try{ const ev=JSON.parse(line.slice(6)); if(ev.done||ev.error) return; if(ev.content) onChunk(ev.content); }catch{}
    }
  }
}

// ── Template examples (quick-fill for each tool) ─────────────
// Each template: { label, values: Record<fieldId, value> }
interface TemplateExample { label: string; values: Record<string, string>; }
const TEMPLATES: Record<string, TemplateExample[]> = {
  "blog-generator": [
    { label: "10 ways to grow Instagram", values: { topic: "10 proven ways to grow your Instagram following organically in 2025", keywords: "grow instagram, instagram followers, organic growth", tone: "Casual", length: "Medium (~1000w)" } },
    { label: "Beginner guide to investing", values: { topic: "The Complete Beginner's Guide to Stock Market Investing in 2025", keywords: "stock market, investing for beginners, how to invest", tone: "Friendly", length: "Long (~2000w)" } },
    { label: "Remote work productivity", values: { topic: "7 Proven Productivity Hacks for Remote Workers That Actually Work", keywords: "remote work, work from home, productivity tips", tone: "Professional", length: "Medium (~1000w)" } },
  ],
  "blog-titles": [
    { label: "Email marketing blog", values: { topic: "email marketing tips for small businesses", audience: "small business owners", style: "Listicle", count: "10 Titles" } },
    { label: "Weight loss content", values: { topic: "how to lose weight without going to the gym", audience: "busy parents", style: "How-To", count: "10 Titles" } },
    { label: "Side hustle ideas", values: { topic: "side hustle ideas to make extra money online", audience: "millennials looking for extra income", style: "Curiosity-Gap", count: "10 Titles" } },
  ],
  "blog-outline": [
    { label: "SEO for beginners", values: { topic: "The Complete Beginner's Guide to SEO in 2025", keywords: "SEO for beginners", type: "Ultimate Guide" } },
    { label: "Email marketing guide", values: { topic: "Email Marketing 101: Everything You Need to Know", keywords: "email marketing guide", type: "How-To Guide" } },
  ],
  "keyword-generator": [
    { label: "Digital marketing keywords", values: { topic: "digital marketing", audience: "small business owners", count: "20 Keywords" } },
    { label: "Fitness keywords", values: { topic: "weight loss for women", audience: "women 30-45", count: "20 Keywords" } },
    { label: "Tech startup keywords", values: { topic: "SaaS project management", audience: "startup founders", count: "20 Keywords" } },
  ],
  "meta-title-desc": [
    { label: "Dropshipping guide page", values: { topic: "How to Start a Dropshipping Business in 2025 — Complete Guide", keyword: "start dropshipping business", count: "5 Variations" } },
    { label: "Social media marketing page", values: { topic: "Social Media Marketing Services for Small Businesses", keyword: "social media marketing agency", count: "5 Variations" } },
  ],
  "instagram-caption": [
    { label: "Morning coffee routine", values: { post: "morning coffee and journaling routine — sharing my productive morning ritual", brand: "wellness lifestyle creator", tone: "Inspiring" } },
    { label: "Product launch", values: { post: "launching my new online course on email marketing after 6 months of work", brand: "digital marketing coach", tone: "Authentic" } },
    { label: "Fitness transformation", values: { post: "3 month fitness transformation — down 18lbs and feeling incredible", brand: "fitness influencer", tone: "Storytelling" } },
  ],
  "instagram-hashtags": [
    { label: "Fitness content", values: { topic: "home workout and fitness transformation", account: "fitness influencer, 10k followers", type: "Reel" } },
    { label: "Food blogging", values: { topic: "healthy meal prep recipes for beginners", account: "food blogger, 5k followers", type: "Photo post" } },
    { label: "Business coaching", values: { topic: "entrepreneurship and business mindset", account: "business coach, 25k followers", type: "Carousel" } },
  ],
  "facebook-post": [
    { label: "Engagement post", values: { topic: "What's the one habit that changed your life? Mine was waking up at 5am", brand: "Mindset Mastery Community", goal: "Engagement & comments" } },
    { label: "Product announcement", values: { topic: "launching our new AI writing tool — 50% off for the first 100 customers", brand: "WriteFast AI", goal: "Promote product" } },
  ],
  "linkedin-post": [
    { label: "Career lesson story", values: { topic: "3 lessons I learned after failing my first startup that no one talks about", role: "Serial entrepreneur & startup advisor", style: "Personal story" } },
    { label: "Industry insight", values: { topic: "AI is replacing 30% of marketing jobs — here's what to do instead", role: "Marketing Director at Fortune 500", style: "Contrarian take" } },
    { label: "Practical tips", values: { topic: "5 LinkedIn profile tweaks that got me 300% more recruiter messages", role: "Career coach helping professionals get hired faster", style: "Practical tips" } },
  ],
  "twitter-post": [
    { label: "Productivity thread", values: { topic: "10 productivity frameworks that made me 5x more effective (most people only know 2)", format: "Thread (10 tweets)", tone: "Informative" } },
    { label: "Bold take", values: { topic: "The 4-hour workweek is mostly BS — here's what actually works", format: "Single tweet", tone: "Controversial" } },
  ],
  "hook-generator": [
    { label: "YouTube hook", values: { topic: "How I made $50,000 in my first year on YouTube with only 1,000 subscribers", platform: "YouTube", style: "Story opener" } },
    { label: "Email hook", values: { topic: "The simple email strategy that tripled my open rates in 30 days", platform: "Email", style: "Bold statement" } },
  ],
  "email-subject-lines": [
    { label: "Black Friday sale", values: { email: "Black Friday Sale — 60% off all products for 24 hours only", brand: "ShopFast", style: "Urgency", count: "15 Lines" } },
    { label: "Newsletter welcome", values: { email: "Welcome to the newsletter — here's what you get every week", brand: "The Growth Weekly", style: "Curiosity", count: "10 Lines" } },
  ],
  "cold-email": [
    { label: "SaaS to agencies", values: { offer: "AI social media scheduling tool that saves agencies 10 hours per week on content management", prospect: "marketing agency owners with 3-20 employees", goal: "Book a demo", tone: "Professional" } },
    { label: "Freelancer outreach", values: { offer: "freelance copywriting services specializing in email sequences for SaaS companies", prospect: "SaaS founders and marketing managers", goal: "Schedule a call", tone: "Casual & Direct" } },
  ],
  "facebook-ad-copy": [
    { label: "Online course ad", values: { product: "12-week online digital marketing course for beginners", audience: "people looking to switch careers to digital marketing, 25-40 years old", offer: "Enroll now — first 50 students get 40% off + bonus coaching call" } },
    { label: "SaaS tool ad", values: { product: "AI writing assistant for content marketers", audience: "content marketers, bloggers, copywriters who write 5+ hours daily", offer: "Start free 14-day trial — no credit card required" } },
  ],
  "google-ad-copy": [
    { label: "Project management tool", values: { product: "cloud-based project management software", keyword: "project management tool for small teams", usp: "saves 5 hours/week, visual kanban boards, free forever plan" } },
    { label: "Accounting software", values: { product: "small business accounting software", keyword: "accounting software small business", usp: "syncs with your bank, 30-second invoicing, 10k+ customers" } },
  ],
  "code-generator": [
    { label: "API rate limiter", values: { description: "A Node.js Express middleware function that rate-limits API requests to 100 per minute per IP address, storing counts in Redis with auto-reset", language: "JavaScript", style: "Production-ready" } },
    { label: "CSV to JSON parser", values: { description: "A Python function that reads a CSV file, converts it to a list of JSON objects with proper type inference (numbers, booleans, dates), and handles missing values", language: "Python", style: "Clean & commented" } },
    { label: "Email validator", values: { description: "A TypeScript function that validates email addresses using regex and checks MX records, returning detailed validation result object", language: "TypeScript", style: "Clean & commented" } },
  ],
  "code-explainer": [
    { label: "Explain async/await", values: { code: "async function fetchUserData(userId) {\n  try {\n    const response = await fetch(`/api/users/${userId}`);\n    if (!response.ok) throw new Error('User not found');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Failed:', error);\n    return null;\n  }\n}", level: "Beginner (simple language)" } },
  ],
  "essay-writer": [
    { label: "Social media mental health", values: { topic: "The impact of social media on mental health in teenagers", type: "Argumentative", length: "Medium (600-900w)" } },
    { label: "Climate change essay", values: { topic: "Why individuals have a moral responsibility to take action on climate change", type: "Persuasive", length: "Long (1000-1500w)" } },
  ],
  "text-improver": [
    { label: "Improve a bio", values: { text: "I am a digital marketer with 5 years of experience. I help businesses grow their online presence. I have worked with many clients and I am good at SEO and social media.", focus: "All improvements" } },
    { label: "Improve a product description", values: { text: "Our coffee is really good. It comes from Colombia. We roast it carefully. You will like the taste. Buy it now.", focus: "Stronger vocabulary" } },
  ],
  "product-description": [
    { label: "Standing desk converter", values: { product: "ErgoFlex Pro Standing Desk Converter", features: "• Height adjustable (6 to 16 inches)\n• Fits desks up to 48 inches wide\n• Built-in cable management tray\n• 35lb weight capacity\n• Anti-slip mat included\n• Easy one-hand adjustment", audience: "remote workers, people with back pain, office professionals", platform: "Amazon listing" } },
    { label: "Skincare serum", values: { product: "Glow24 Vitamin C Brightening Serum", features: "• 20% Vitamin C concentration\n• Hyaluronic acid for hydration\n• SPF free (use with sunscreen)\n• Cruelty-free, vegan formula\n• Reduces dark spots in 4 weeks\n• Fragrance-free", audience: "women 25-45 with dark spots, uneven skin tone, dull skin", platform: "Shopify/eCommerce" } },
  ],
  "resume-writer": [
    { label: "Marketing manager resume", values: { role: "Digital Marketing Manager", experience: "5 years at TechStartup Inc. as Marketing Coordinator, then Senior Coordinator. Grew organic traffic from 10K to 150K monthly visitors, managed $200K ad budget, led team of 5, launched 3 successful product campaigns", skills: "SEO, Google Analytics, HubSpot, content strategy, PPC advertising, email marketing, team leadership" } },
  ],
  "job-description": [
    { label: "Senior Product Manager", values: { role: "Senior Product Manager", company: "CloudSoft — B2B SaaS startup, Series A, 80 employees, building HR automation software", requirements: "5+ years product management experience in B2B SaaS, strong data analytics skills (SQL a plus), experience with Agile/Scrum, proven track record launching successful products, excellent stakeholder communication" } },
  ],
  "business-name-generator": [
    { label: "Eco pet food", values: { industry: "organic sustainable pet food delivery service", keywords: "eco, fresh, paw, green, natural, pet", style: "Modern & Tech", count: "10 Names" } },
    { label: "AI writing tool", values: { industry: "AI-powered writing and content creation tool", keywords: "write, ai, smart, create, fast, content", style: "Bold & Energetic", count: "10 Names" } },
  ],
  "landing-page-copy": [
    { label: "Email marketing SaaS", values: { product: "Email marketing automation software for e-commerce stores", audience: "Shopify store owners doing $5K-$50K monthly revenue", offer: "Start free 30-day trial — no credit card, setup in 5 minutes" } },
    { label: "Online course platform", values: { product: "Online course creation platform for coaches and educators", audience: "Coaches, consultants, and subject matter experts who want to monetize their knowledge", offer: "Create your first course free — upgrade when you're ready to sell" } },
  ],
  "explainer-video-script": [
    { label: "Expense tracking app", values: { product: "AI-powered expense tracking app for freelancers and solopreneurs", audience: "freelancers who lose track of expenses and miss tax deductions", duration: "90 seconds" } },
    { label: "Project management tool", values: { product: "visual project management tool that replaces spreadsheets for remote teams", audience: "remote team managers frustrated with email chains and missed deadlines", duration: "2 minutes" } },
  ],
  "travel-itinerary": [
    { label: "7 days in Japan", values: { destination: "Tokyo and Kyoto, Japan for 7 days", preferences: "love Japanese food and culture, want to avoid tourist traps, mix of traditional and modern, moderate budget $100-150/day", style: "Cultural" } },
    { label: "5 days Bali", values: { destination: "Bali, Indonesia for 5 days", preferences: "beach, temples, yoga, healthy food, Airbnb stays, adventurous but also relaxing", style: "Adventure" } },
  ],
  "quiz-generator": [
    { label: "Marketing knowledge quiz", values: { topic: "Digital Marketing Fundamentals — SEO, Social Media, Email Marketing", type: "Multiple choice (MCQ)", difficulty: "Medium", count: "10 Questions" } },
    { label: "Python quiz", values: { topic: "Python Programming Basics — variables, loops, functions, lists", type: "Mixed format", difficulty: "Easy", count: "10 Questions" } },
  ],
  "book-title-generator": [
    { label: "Self-help memoir", values: { idea: "A memoir about overcoming addiction and rebuilding a successful career in tech", genre: "Non-fiction", count: "10 Titles" } },
    { label: "Business book", values: { idea: "A guide to building a 7-figure online business while working only 4 hours a day", genre: "Business", count: "10 Titles" } },
  ],
  "tagline-generator": [
    { label: "Eco water bottles", values: { brand: "EcoBottle — sustainable stainless steel water bottles replacing single-use plastic", values: "sustainability, durability, design, reduce plastic waste, hydration", style: "Short & punchy (2-4 words)" } },
    { label: "AI writing tool", values: { brand: "WriteFast AI — AI writing assistant for marketers", values: "speed, quality, creativity, professional content, save time", style: "Benefit-focused" } },
  ],
  "thank-you-note": [
    { label: "After job interview", values: { occasion: "job interview for Senior Product Manager role at Google — had great conversation about their AI roadmap", person: "Sarah Chen, VP of Product — interviewed me for 45 minutes, very engaged and shared company vision", tone: "Professional" } },
    { label: "Client appreciation", values: { occasion: "client renewed their contract for the 3rd year and referred two new clients to us", person: "Michael Thompson, long-term client and advocate for our agency", tone: "Warm & personal" } },
  ],
  "shorts-reels-script": [
    { label: "Productivity tip reel", values: { topic: "The 2-minute rule that eliminated my procrastination forever", platform: "Instagram Reels", style: "Educational tip" } },
    { label: "Business advice short", values: { topic: "I make $30k/month online — here's the one skill that made it possible", platform: "YouTube Shorts", style: "Personal story" } },
  ],
};

// ── Tool definitions ─────────────────────────────────────────
const TOOLS: ToolDef[] = [
  // ── BLOG & SEO ──────────────────────────────────────────────
  {
    id:"blog-generator", name:"AI Blog Generator", description:"Create SEO-friendly blog posts with structure in minutes", emoji:"📝", color:"#6366f1", category:"blog",
    fields:[
      {type:"input",id:"topic",label:"Blog Topic *",placeholder:"e.g. 10 proven ways to grow your Instagram following"},
      {type:"input",id:"keywords",label:"Target Keywords (comma-separated)",placeholder:"instagram growth, social media tips, gain followers"},
      {type:"chips",id:"tone",label:"Tone",options:["Professional","Casual","Friendly","Authoritative","Conversational"]},
      {type:"chips",id:"length",label:"Length",options:["Short (~500w)","Medium (~1000w)","Long (~2000w)"]},
    ],
    systemPrompt:"You are an expert SEO content writer. Write complete, engaging blog posts.",
    buildUserPrompt:f=>`Write a complete SEO-optimized blog post about: "${f.topic}"
Keywords: ${f.keywords||"none"} | Tone: ${f.tone||"Professional"} | Length: ${f.length||"Medium (~1000w)"}
Include: H1 title, engaging intro, 4-6 H2 sections with bullet points, conclusion with CTA, meta description (under 160 chars).`
  },
  {
    id:"blog-outline", name:"Blog Outline Generator", description:"Create a detailed outline before writing your full blog post", emoji:"📋", color:"#6366f1", category:"blog",
    fields:[
      {type:"input",id:"topic",label:"Blog Topic *",placeholder:"e.g. The Complete Guide to Email Marketing for Beginners"},
      {type:"input",id:"keywords",label:"Primary Keyword",placeholder:"e.g. email marketing guide"},
      {type:"chips",id:"type",label:"Blog Type",options:["How-To Guide","Listicle","Ultimate Guide","Case Study","Opinion","Comparison","Tutorial"]},
    ],
    systemPrompt:"You are an SEO content strategist. Create comprehensive blog outlines.",
    buildUserPrompt:f=>`Create a detailed blog outline for: "${f.topic}"
Type: ${f.type||"How-To Guide"} | Primary keyword: ${f.keywords||"not specified"}
Include: H1 title, meta description, intro hook, 5-8 H2 sections each with 3-5 H3 subsections, conclusion, FAQ section (5 questions), word count estimate per section.`
  },
  {
    id:"blog-titles", name:"Blog Title Generator", description:"Generate SEO-friendly blog titles that increase clicks", emoji:"📰", color:"#6366f1", category:"blog",
    fields:[
      {type:"input",id:"topic",label:"Blog Topic *",placeholder:"e.g. email marketing tips for beginners"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. small business owners"},
      {type:"chips",id:"style",label:"Title Style",options:["Listicle","How-To","Question-Based","Curiosity-Gap","Data-Driven","Ultimate Guide","Comparison"]},
      {type:"chips",id:"count",label:"Number",options:["5 Titles","10 Titles","15 Titles"]},
    ],
    systemPrompt:"You are an expert SEO copywriter specializing in high-CTR blog titles.",
    buildUserPrompt:f=>`Generate ${f.count||"10 Titles"} SEO titles for: "${f.topic}" | Audience: ${f.audience||"general"} | Style: ${f.style||"Mixed"}
For each: **[Title]** → CTR appeal: [reason] | SEO strength: [Strong/Medium] | Keyword placement: [Beginning/Middle/End]`
  },
  {
    id:"blog-topic-ideas", name:"Blog Topic Ideas", description:"Generate a list of SEO-optimized blog topic ideas for your niche", emoji:"💡", color:"#6366f1", category:"blog",
    fields:[
      {type:"input",id:"niche",label:"Blog Niche / Industry *",placeholder:"e.g. personal finance, digital marketing, fitness"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. working moms, freelancers, college students"},
      {type:"chips",id:"count",label:"Number of Ideas",options:["10 Ideas","20 Ideas","30 Ideas"]},
    ],
    systemPrompt:"You are an SEO content strategist who generates high-traffic blog ideas.",
    buildUserPrompt:f=>`Generate ${f.count||"20 Ideas"} blog topic ideas for niche: "${f.niche}" | Audience: ${f.audience||"general"}
For each: **[Topic Title]** | Search intent: [Informational/Commercial] | Potential monthly searches: [Low/Medium/High] | Content angle: [unique approach]`
  },
  {
    id:"keyword-generator", name:"Long-Tail Keyword Generator", description:"Get 30 long-tail keywords with search intent for better rankings", emoji:"🔍", color:"#6366f1", category:"blog",
    fields:[
      {type:"input",id:"topic",label:"Seed Keyword *",placeholder:"e.g. project management software"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. small business owners"},
      {type:"chips",id:"count",label:"Keywords",options:["10 Keywords","20 Keywords","30 Keywords"]},
    ],
    systemPrompt:"You are an SEO keyword research specialist.",
    buildUserPrompt:f=>`Generate ${f.count||"20 Keywords"} long-tail keywords for: "${f.topic}" | Audience: ${f.audience||"general"}
Format: | Keyword | Intent (Info/Commercial/Transactional) | Difficulty (Low/Med/High) | Suggested Title |
Group by intent at the end.`
  },
  {
    id:"meta-title-desc", name:"Meta Title & Description", description:"Generate SEO-friendly meta titles and descriptions for any page", emoji:"🏷️", color:"#6366f1", category:"blog",
    fields:[
      {type:"input",id:"topic",label:"Page Topic / Blog Title *",placeholder:"e.g. How to Start a Dropshipping Business in 2025"},
      {type:"input",id:"keyword",label:"Primary Keyword",placeholder:"e.g. dropshipping business"},
      {type:"chips",id:"count",label:"Variations",options:["3 Variations","5 Variations","7 Variations"]},
    ],
    systemPrompt:"You are an SEO specialist. Write click-worthy, keyword-optimized meta tags.",
    buildUserPrompt:f=>`Generate ${f.count||"5 Variations"} meta title + description pairs for: "${f.topic}" | Keyword: ${f.keyword||"not specified"}
For each:
**Meta Title [N]:** [Under 60 chars, includes keyword]
**Meta Description [N]:** [Under 160 chars, includes keyword, compelling CTA]`
  },
  {
    id:"topical-map", name:"Topical Map Creator", description:"Build a complete content map to dominate your blog's niche", emoji:"🗺️", color:"#6366f1", category:"blog",
    fields:[
      {type:"input",id:"niche",label:"Blog Niche / Main Topic *",placeholder:"e.g. personal finance for millennials"},
      {type:"chips",id:"depth",label:"Map Depth",options:["Beginner (20 topics)","Intermediate (40 topics)","Advanced (60 topics)"]},
    ],
    systemPrompt:"You are a content strategist specializing in topical authority and SEO content mapping.",
    buildUserPrompt:f=>`Create a topical map for: "${f.niche}" | Depth: ${f.depth||"Intermediate (40 topics)"}
Organize as: Pillar Topic → Sub-topics → Supporting content
For each cluster include: topic, content type (guide/listicle/comparison), target keyword, search intent.`
  },
  {
    id:"clickbait-title", name:"Clickbait Title Generator", description:"Craft catchy, curiosity-driven titles that boost clicks and engagement", emoji:"🎣", color:"#6366f1", category:"blog",
    fields:[
      {type:"input",id:"topic",label:"Blog or Video Topic *",placeholder:"e.g. I quit my 9-5 job and made $50k in 6 months"},
      {type:"chips",id:"platform",label:"Platform",options:["Blog","YouTube","Instagram","Twitter/X","LinkedIn","BuzzFeed-style"]},
      {type:"chips",id:"count",label:"Titles",options:["5 Titles","10 Titles"]},
    ],
    systemPrompt:"You are a viral content specialist who creates irresistible clickbait titles that deliver on their promise.",
    buildUserPrompt:f=>`Generate ${f.count||"10 Titles"} clickbait-style titles for: "${f.topic}" for ${f.platform||"Blog"}
Use: curiosity gaps, power words, numbers, emotion, controversy, FOMO. Each title must still deliver on its promise.`
  },

  // ── YOUTUBE ─────────────────────────────────────────────────
  {
    id:"youtube-ideas", name:"YouTube Video Idea Generator", description:"Generate engaging YouTube video ideas, outlines & talking points", emoji:"🎬", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"niche",label:"Channel Niche *",placeholder:"e.g. personal finance for millennials"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. 25-35 year olds in debt"},
      {type:"chips",id:"format",label:"Format",options:["Tutorial","Listicle","Storytime","Review","Educational","Challenge","Mixed"]},
      {type:"chips",id:"count",label:"Ideas",options:["5 Ideas","8 Ideas","10 Ideas"]},
    ],
    systemPrompt:"You are a YouTube growth strategist. Create viral, high-retention video concepts.",
    buildUserPrompt:f=>`Generate ${f.count||"8 Ideas"} YouTube video ideas for: "${f.niche}" | Audience: ${f.audience||"general"} | Format: ${f.format||"Mixed"}
For each:
**[N]. [Clickable Title]** | 📊 Why it'll perform: [reason] | 🎯 Target keyword: [keyword]
📝 3-Point outline: • [Hook] • [Main content] • [CTA]
💬 Thumbnail concept: [visual description] | ⏱️ Ideal length: [X-Y min]`
  },
  {
    id:"yt-script", name:"YouTube Video Script", description:"Generate a full, engaging YouTube video script from title and key points", emoji:"🎙️", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"title",label:"Video Title *",placeholder:"e.g. 5 Passive Income Ideas That Actually Work in 2025"},
      {type:"textarea",id:"keypoints",label:"Key Points to Cover",placeholder:"1. Dividend investing\n2. Print-on-demand\n3. Affiliate marketing", rows:4},
      {type:"chips",id:"style",label:"Channel Style",options:["Educational & Informative","Entertaining & Casual","Motivational","Documentary","Story-driven"]},
      {type:"chips",id:"length",label:"Video Length",options:["Short (5-7 min)","Medium (10-15 min)","Long (20-25 min)"]},
    ],
    systemPrompt:"You are a professional YouTube scriptwriter who creates engaging, high-retention scripts.",
    buildUserPrompt:f=>`Write a complete YouTube video script for: "${f.title}"
Key points: ${f.keypoints||"not specified"} | Style: ${f.style||"Educational & Informative"} | Length: ${f.length||"Medium (10-15 min)"}
Include: [HOOK - first 15 seconds that grabs attention], [INTRO - channel intro + what viewer will learn], [MAIN CONTENT - each key point with examples, transitions], [OUTRO - CTA to subscribe/like/comment], [END SCREEN suggestion]
Add timestamps markers, camera directions in [brackets].`
  },
  {
    id:"yt-titles", name:"YouTube Title Generator", description:"Optimize YouTube titles for maximum click-through rate", emoji:"▶️", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"topic",label:"Video Topic *",placeholder:"e.g. I tracked every expense for 30 days on $2000/month"},
      {type:"input",id:"keywords",label:"Target Keywords",placeholder:"e.g. budgeting, save money, personal finance"},
      {type:"chips",id:"count",label:"Titles",options:["5 Titles","10 Titles","15 Titles"]},
    ],
    systemPrompt:"You are a YouTube SEO expert. Create titles that maximize CTR.",
    buildUserPrompt:f=>`Generate ${f.count||"10 Titles"} YouTube titles for: "${f.topic}" | Keywords: ${f.keywords||"not specified"}
For each: **[Title]** (X chars) → CTR formula: [e.g. curiosity gap] | Algorithm ⭐[1-5] | Keyword: [Front/Middle/End]
At end: rank top 3 by predicted CTR.`
  },
  {
    id:"yt-description-tags", name:"YouTube Description & Tags", description:"Craft SEO-friendly descriptions and tags to maximize video discoverability", emoji:"🏷️", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"title",label:"Video Title *",placeholder:"e.g. How I Made $10,000 with Print on Demand"},
      {type:"textarea",id:"summary",label:"Video Summary",placeholder:"Brief summary of what the video covers...", rows:3},
      {type:"input",id:"keyword",label:"Primary Keyword",placeholder:"e.g. print on demand business"},
    ],
    systemPrompt:"You are a YouTube SEO specialist. Write descriptions that rank and convert.",
    buildUserPrompt:f=>`Write a complete YouTube description + tag set for: "${f.title}"
Summary: ${f.summary||"based on title"} | Primary keyword: ${f.keyword||"from title"}
Include:
📝 DESCRIPTION: [Hook first line] [2-3 paragraph body with keyword] [Chapters/Timestamps placeholder] [Links section] [Subscribe CTA] [Social links placeholder] [35 SEO hashtags at end]
🏷️ TAGS: [35 comma-separated tags, mix of broad + specific + long-tail]`
  },
  {
    id:"yt-hook-intro", name:"YT Hook & Intro Maker", description:"Craft compelling YouTube intro scripts that hook viewers in 15 seconds", emoji:"🎯", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"topic",label:"Video Topic *",placeholder:"e.g. How to Start Dropshipping with $0"},
      {type:"chips",id:"hook",label:"Hook Style",options:["Bold statement","Shocking fact/stat","Question","Story/Scenario","Controversy","Promise of value","Problem-agitate"]},
    ],
    systemPrompt:"You are a YouTube hook specialist. The first 15-30 seconds determine 70% of retention.",
    buildUserPrompt:f=>`Write 3 hook + intro variations for YouTube video about: "${f.topic}" | Hook style: ${f.hook||"Bold statement"}
Each variation:
**Hook [N] — [Hook type]:**
[HOOK - 1-2 punchy sentences, 0-15 sec]
[PATTERN INTERRUPT - visual/audio suggestion in brackets]
[INTRO - 15-45 sec, preview what they'll learn, why they should stay]
[PROMISE - what they'll get by the end]`
  },
  {
    id:"yt-thumbnail-ideas", name:"YouTube Thumbnail Ideas", description:"Generate catchy thumbnail concepts that boost click-through rates", emoji:"🖼️", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"title",label:"Video Title *",placeholder:"e.g. I Tried Every $1 Meal at McDonald's for a Week"},
      {type:"input",id:"channel",label:"Channel Style",placeholder:"e.g. MrBeast-style, minimalist, educational"},
      {type:"chips",id:"count",label:"Concepts",options:["3 Concepts","5 Concepts","7 Concepts"]},
    ],
    systemPrompt:"You are a YouTube thumbnail designer. Create concepts that dramatically improve CTR.",
    buildUserPrompt:f=>`Generate ${f.count||"5 Concepts"} thumbnail concepts for: "${f.title}" | Style: ${f.channel||"general"}
For each:
**🖼️ Concept [N]: [Name]**
🎨 Background: [description] | 👤 Subject: [pose/expression] | 📝 Text: "[exact text]" [font/color] | 📍 Layout: [positioning]
😮 Emotion triggered: [feeling] | ✅ Why it works: [psychology]
End with: 🏆 Top 2 picks + A/B test suggestion`
  },
  {
    id:"yt-script-outline", name:"YT Script Outline Generator", description:"Create a detailed, structured YouTube script outline before you write", emoji:"📑", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"topic",label:"Video Topic *",placeholder:"e.g. 7 Morning Habits That Changed My Life"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. young professionals, entrepreneurs"},
      {type:"chips",id:"length",label:"Video Length",options:["5-7 min","10-12 min","15-20 min","25-30 min"]},
    ],
    systemPrompt:"You are a YouTube content strategist who builds high-retention video structures.",
    buildUserPrompt:f=>`Create a detailed YouTube script outline for: "${f.topic}" | Audience: ${f.audience||"general"} | Length: ${f.length||"10-12 min"}
Include: Hook type + 15-sec hook script, Intro (value promise, subscribe pitch), Main sections (each with key talking points, B-roll suggestions, examples), Transition phrases between sections, Outro + CTA strategy, Pattern interrupts to maintain retention`
  },
  {
    id:"shorts-reels-script", name:"Shorts & Reels Script Creator", description:"Create viral short-form scripts for YouTube Shorts, Instagram Reels & TikTok", emoji:"📱", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"topic",label:"Topic / Key Message *",placeholder:"e.g. One habit that doubled my productivity"},
      {type:"chips",id:"platform",label:"Platform",options:["YouTube Shorts","Instagram Reels","TikTok","All three"]},
      {type:"chips",id:"style",label:"Style",options:["Educational tip","Story/Personal","Controversial take","Listicle","POV scenario","Before/After","Day in my life"]},
    ],
    systemPrompt:"You are a short-form video specialist. Create scripts that hook viewers in 2 seconds and keep 90%+ retention.",
    buildUserPrompt:f=>`Write a viral ${f.platform||"YouTube Shorts"} script about: "${f.topic}" | Style: ${f.style||"Educational tip"}
Format:
[HOOK - first 2 seconds, visual direction in brackets]
[BODY - rapid-fire value, max 45-55 seconds total]
[CTA - 3-5 second call to action]
[B-ROLL/Visual suggestions for each line]
Also include: 3 alternative hooks to A/B test`
  },
  {
    id:"all-in-one-yt", name:"All-in-One YT Content", description:"Generate titles, script, description, and tags for a YouTube video all at once", emoji:"🚀", color:"#ef4444", category:"youtube",
    fields:[
      {type:"input",id:"topic",label:"Video Topic *",placeholder:"e.g. How to Build a Faceless YouTube Channel from Scratch"},
      {type:"input",id:"niche",label:"Channel Niche",placeholder:"e.g. online business, personal finance"},
    ],
    systemPrompt:"You are a complete YouTube content strategist. Create everything needed to publish a video.",
    buildUserPrompt:f=>`Create complete YouTube content package for: "${f.topic}" | Niche: ${f.niche||"general"}
Generate:
**🏆 TOP 5 TITLES:** [numbered list]
**📝 SCRIPT OUTLINE:** [hook, intro, 5-7 sections, outro]
**📄 VIDEO DESCRIPTION:** [SEO-optimized, 300-500 words, with chapters placeholder]
**🏷️ 35 TAGS:** [comma separated]
**📸 THUMBNAIL CONCEPT:** [detailed description]
**📅 BEST PUBLISH TIME:** [day and time recommendation]`
  },

  // ── SOCIAL MEDIA ─────────────────────────────────────────────
  {
    id:"instagram-caption", name:"Instagram Caption Generator", description:"Generate engaging, creative captions with hooks, CTAs & hashtags", emoji:"📸", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"post",label:"What's your post about? *",placeholder:"e.g. morning coffee and journal routine"},
      {type:"input",id:"brand",label:"Account Vibe",placeholder:"e.g. wellness blogger, motivational, authentic"},
      {type:"chips",id:"tone",label:"Tone",options:["Inspiring","Funny & Witty","Authentic","Educational","Promotional","Storytelling","Minimalist"]},
    ],
    systemPrompt:"You are an expert Instagram copywriter who crafts captions that boost engagement.",
    buildUserPrompt:f=>`Write 3 Instagram caption variations for: "${f.post}" | Vibe: ${f.brand||"lifestyle"} | Tone: ${f.tone||"Authentic"}
**Caption 1 — Short & Punchy (under 50 words + emojis):** [caption]
**Caption 2 — Story-driven (100-150 words + emojis + CTA):** [caption]
**Caption 3 — Engagement-optimized (80-120 words + question + emojis):** [caption]
For each mark: [HOOK LINE — what shows before "more"]`
  },
  {
    id:"instagram-hashtags", name:"Instagram Hashtag Generator", description:"Find 30 trending & niche hashtags to maximize Instagram reach", emoji:"#️⃣", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"topic",label:"Post Topic / Niche *",placeholder:"e.g. sustainable fashion, thrift store haul"},
      {type:"input",id:"account",label:"Account Type",placeholder:"e.g. fashion blogger, 15k followers"},
      {type:"chips",id:"type",label:"Content Type",options:["Photo post","Reel","Carousel","Story","Product","Behind the scenes"]},
    ],
    systemPrompt:"You are an Instagram growth expert and hashtag strategist.",
    buildUserPrompt:f=>`Generate 30 Instagram hashtags for: "${f.topic}" | Account: ${f.account||"creator"} | Type: ${f.type||"Photo post"}
Groups: 🔥 Mega (1M+ posts, 2-3) | 📈 Large (100K-1M, 5-7) | 🎯 Medium (10K-100K, 8-10) | 💎 Niche (1K-10K, 8-10) | 🏷️ Community (2-3)
End with: 📋 Ready-to-paste line | 💡 Pro tip for this niche`
  },
  {
    id:"social-post-generator", name:"Social Media Post Generator", description:"Create platform-optimized posts for Facebook, Instagram, Twitter, LinkedIn", emoji:"📱", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"topic",label:"Topic / Message *",placeholder:"e.g. Announcing our new AI scheduling feature"},
      {type:"chips",id:"platform",label:"Platform",options:["LinkedIn","Twitter/X","Facebook","Instagram","Pinterest","TikTok","All platforms"]},
      {type:"chips",id:"goal",label:"Goal",options:["Engagement","Brand awareness","Drive traffic","Product launch","Educational","Community"]},
    ],
    systemPrompt:"You are a social media strategist. Create high-performing, platform-native posts.",
    buildUserPrompt:f=>`Create ${f.platform==="All platforms"?"posts for LinkedIn, Twitter, Facebook, Instagram":"a "+(f.platform||"LinkedIn")+" post"} about: "${f.topic}" | Goal: ${f.goal||"Engagement"}
Format each for the platform's native style and character limits. Include emojis, hashtags where appropriate, and a clear CTA.`
  },
  {
    id:"facebook-post", name:"Facebook Post Generator", description:"Craft compelling Facebook posts using the 4A formula for maximum engagement", emoji:"👥", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"topic",label:"Post Topic *",placeholder:"e.g. Why I switched from coffee to green tea"},
      {type:"input",id:"brand",label:"Brand / Page Name",placeholder:"e.g. HealthyLiving Hub"},
      {type:"chips",id:"goal",label:"Goal",options:["Engagement & comments","Brand awareness","Drive traffic","Promote product","Share a story","Educational"]},
    ],
    systemPrompt:"You are a Facebook marketing specialist. Use the 4A formula: Attention, Audience, Action, Advantage.",
    buildUserPrompt:f=>`Write 2 Facebook post variations for: "${f.topic}" | Brand: ${f.brand||"the page"} | Goal: ${f.goal||"Engagement"}
**Post 1 — Conversational (100-200 words):** [starts with bold statement or question, story, CTA + emoji]
**Post 2 — List-based (150-250 words):** [numbered insights, value, engagement question at end]
Each post: hook first line, use line breaks for readability, end with question to drive comments`
  },
  {
    id:"linkedin-post", name:"LinkedIn Post Generator", description:"Make LinkedIn posts that get comments, shares, and professional visibility", emoji:"💼", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"topic",label:"Topic / Insight *",placeholder:"e.g. 3 lessons I learned after failing my first startup"},
      {type:"input",id:"role",label:"Your Role / Expertise",placeholder:"e.g. Marketing Director, SaaS founder, career coach"},
      {type:"chips",id:"style",label:"Post Style",options:["Personal story","Industry insight","Contrarian take","Practical tips","Career advice","Celebration/milestone","Thought leadership"]},
    ],
    systemPrompt:"You are a LinkedIn growth expert. Create posts that go viral in the professional network.",
    buildUserPrompt:f=>`Write a LinkedIn post about: "${f.topic}" | Role: ${f.role||"professional"} | Style: ${f.style||"Personal story"}
Format:
Line 1: [HOOK — bold, controversial or emotional opener that stops the scroll]
[blank line]
[Body — short paragraphs, 1-2 sentences each, line breaks every paragraph]
[Insights/bullets if applicable]
[Conclusion — lesson or takeaway]
[blank line]
[Engagement question to drive comments]
[3-5 hashtags at end]
Aim for 1000-1500 chars. Professional but human.`
  },
  {
    id:"twitter-post", name:"Twitter/X Post Generator", description:"Generate engaging, topic-relevant tweets and threads", emoji:"🐦", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"topic",label:"Topic / Message *",placeholder:"e.g. Why most productivity advice is actually terrible"},
      {type:"chips",id:"format",label:"Format",options:["Single tweet","Thread (5 tweets)","Thread (10 tweets)","Opinion take"]},
      {type:"chips",id:"tone",label:"Tone",options:["Bold & Direct","Informative","Witty","Inspirational","Controversial","Casual"]},
    ],
    systemPrompt:"You are a Twitter/X growth expert who creates viral content.",
    buildUserPrompt:f=>`Write ${f.format||"Thread (5 tweets)"} about: "${f.topic}" | Tone: ${f.tone||"Bold & Direct"}
Rules: Under 280 chars per tweet | First tweet must be a hook | Add tweet numbers (1/N) | Last tweet = CTA + summary
Format: **Tweet 1:** [text] | **Tweet 2:** [text] | etc.`
  },
  {
    id:"tiktok-caption", name:"TikTok Caption Generator", description:"Craft TikTok captions that capture your video's essence and boost engagement", emoji:"🎵", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"video",label:"What is your TikTok about? *",placeholder:"e.g. satisfying room organization transformation"},
      {type:"input",id:"niche",label:"Your Niche",placeholder:"e.g. home decor, fitness, comedy"},
      {type:"chips",id:"goal",label:"Goal",options:["Maximize views","Drive comments","Gain followers","Drive traffic","Viral reach"]},
    ],
    systemPrompt:"You are a TikTok growth expert who understands the FYP algorithm.",
    buildUserPrompt:f=>`Write 3 TikTok caption variations for: "${f.video}" | Niche: ${f.niche||"general"} | Goal: ${f.goal||"Maximize views"}
**Caption 1 — Hook-based:** [curiosity/question hook + 3-5 relevant hashtags]
**Caption 2 — Keyword-rich:** [searchable keywords woven in naturally + 5-7 hashtags]
**Caption 3 — Engagement-driver:** [prompt that drives comments + challenge element + hashtags]
Include for each: best caption under 150 chars + relevant TikTok hashtag set`
  },
  {
    id:"hook-generator", name:"Hook Generator", description:"Generate various types of attention-grabbing hooks for any platform or content type", emoji:"🎣", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"topic",label:"Topic / Content *",placeholder:"e.g. How I paid off $50k of debt in 2 years"},
      {type:"chips",id:"platform",label:"Platform",options:["YouTube","Instagram/TikTok","LinkedIn","Twitter","Blog","Email","Podcast","Any"]},
      {type:"chips",id:"style",label:"Hook Type",options:["Bold statement","Shocking stat","Open loop","Question","Controversy","Story opener","Transformation","Fear/FOMO"]},
    ],
    systemPrompt:"You are a master copywriter specializing in hooks that command immediate attention.",
    buildUserPrompt:f=>`Generate 8 powerful hooks for: "${f.topic}" | Platform: ${f.platform||"Any"} | Type: ${f.style||"Mixed"}
For each hook:
**Hook [N] — [Type]:** [hook text]
*Why it works: [psychology behind it]*
Provide 2 hooks per type (statement, question, story, controversy) or 8 varied hooks if "Mixed"`
  },
  {
    id:"social-media-calendar", name:"Social Media Calendar", description:"Plan and organize a month of social media posts for maximum consistency", emoji:"📅", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"brand",label:"Brand / Business *",placeholder:"e.g. eco-friendly skincare brand"},
      {type:"chips",id:"platforms",label:"Platforms",options:["Instagram + Facebook","LinkedIn","Twitter/X","All major platforms","Instagram only"]},
      {type:"chips",id:"duration",label:"Duration",options:["1 Week","2 Weeks","4 Weeks (1 Month)"]},
    ],
    systemPrompt:"You are a social media manager who creates strategic content calendars.",
    buildUserPrompt:f=>`Create a social media calendar for: "${f.brand}" | Platforms: ${f.platforms||"All major platforms"} | Duration: ${f.duration||"4 Weeks (1 Month)"}
Format as weekly grid:
**Week [N]:**
| Day | Platform | Post Type | Topic/Hook | Caption Snippet | Best Time |
Include: content pillars (educational 30%, promotional 20%, entertaining 30%, engagement 20%), hashtag strategies, story/reel suggestions`
  },
  {
    id:"instagram-page-bio", name:"Instagram Page Name & Bio Generator", description:"Create catchy Instagram page names and effective bios instantly", emoji:"✍️", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"niche",label:"Your Niche / Focus *",placeholder:"e.g. plant-based cooking for busy parents"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. busy moms who want healthy meals"},
      {type:"chips",id:"tone",label:"Tone",options:["Professional","Fun & Playful","Inspirational","Minimalist","Bold","Quirky"]},
    ],
    systemPrompt:"You are an Instagram branding specialist. Create compelling page names and bios that convert profile visitors to followers.",
    buildUserPrompt:f=>`Create 5 Instagram name + bio combinations for: "${f.niche}" | Audience: ${f.audience||"general"} | Tone: ${f.tone||"Professional"}
For each:
**Option [N]:**
📛 Page Name: @[username_suggestion]
📌 Display Name: [Full Display Name]
📝 Bio (under 150 chars):
[Line 1 — what you do]
[Line 2 — who you help / unique angle]
[Line 3 — CTA with emoji]
[Link placeholder]
*Why this works: [brief explanation]*`
  },
  {
    id:"social-media-bio", name:"Social Media Bio Generator", description:"Make the perfect bio for any social media account", emoji:"👤", color:"#ec4899", category:"social",
    fields:[
      {type:"input",id:"name",label:"Your Name / Brand *",placeholder:"e.g. Alex Chen / FitFuel Nutrition"},
      {type:"input",id:"role",label:"What You Do",placeholder:"e.g. fitness coach helping women lose weight sustainably"},
      {type:"chips",id:"platform",label:"Platform",options:["Twitter/X","LinkedIn","Instagram","TikTok","YouTube","All platforms"]},
    ],
    systemPrompt:"You are a personal branding expert. Write bios that attract followers and communicate value instantly.",
    buildUserPrompt:f=>`Write bios for: "${f.name}" who does: "${f.role}" | Platform: ${f.platform||"All platforms"}
For each platform, write a platform-appropriate bio:
- Twitter: Under 160 chars
- LinkedIn: 3-5 sentences, professional
- Instagram: Under 150 chars, line-break format
- TikTok: Under 80 chars, fun
Make each feel native to its platform.`
  },

  // ── EMAIL TOOLS ──────────────────────────────────────────────
  {
    id:"email-subject-lines", name:"Email Subject Line Generator", description:"Write captivating email subject lines that dramatically improve open rates", emoji:"📬", color:"#34d399", category:"email",
    fields:[
      {type:"input",id:"email",label:"Email Purpose *",placeholder:"e.g. Flash sale announcement — 40% off this weekend only"},
      {type:"input",id:"brand",label:"Brand Name",placeholder:"e.g. ShopNow"},
      {type:"chips",id:"style",label:"Style",options:["Urgency","Curiosity","Personalization","Benefit-driven","Question","Controversial","FOMO","Emoji-led"]},
      {type:"chips",id:"count",label:"Subject Lines",options:["10 Lines","15 Lines","20 Lines"]},
    ],
    systemPrompt:"You are an email marketing specialist who writes subject lines with 40%+ open rates.",
    buildUserPrompt:f=>`Generate ${f.count||"15 Lines"} email subject lines for: "${f.email}" | Brand: ${f.brand||"the brand"} | Style: ${f.style||"Mixed"}
For each:
**[Subject line]** → Formula: [e.g. curiosity gap] | Predicted open rate: [Low/Med/High] | Best for: [audience type]
Group by style at end. Include 3 pre-header text suggestions.`
  },
  {
    id:"cold-email", name:"Cold Email Generator", description:"Create effective cold emails with a compelling hook and irresistible call to action", emoji:"📧", color:"#34d399", category:"email",
    fields:[
      {type:"input",id:"offer",label:"Your Offer / Service *",placeholder:"e.g. AI-powered social media scheduling tool for agencies"},
      {type:"input",id:"prospect",label:"Target Prospect",placeholder:"e.g. marketing agency owners with 5-50 employees"},
      {type:"chips",id:"goal",label:"Email Goal",options:["Book a demo","Schedule a call","Reply with interest","Download a resource","Visit landing page"]},
      {type:"chips",id:"tone",label:"Tone",options:["Professional","Casual & Direct","Personalized","Consultative"]},
    ],
    systemPrompt:"You are a B2B sales email specialist with a 25%+ reply rate track record.",
    buildUserPrompt:f=>`Write 2 cold email variations for offering: "${f.offer}" to: "${f.prospect||"business owners"}"
Goal: ${f.goal||"Book a demo"} | Tone: ${f.tone||"Professional"}
**Email 1 — Problem-focused:**
Subject: [compelling subject]
Body: [personalization opener, pain point, solution, social proof, CTA, sign-off]
**Email 2 — Value-first:**
Subject: [different angle]
Body: [lead with value/insight, brief offer, low-friction CTA, sign-off]
Each email: under 150 words body, one clear CTA`
  },
  {
    id:"newsletter-email", name:"Newsletter Email Generator", description:"Craft engaging newsletters that your audience actually reads and shares", emoji:"📰", color:"#34d399", category:"email",
    fields:[
      {type:"input",id:"topic",label:"Newsletter Topic *",placeholder:"e.g. Weekly AI tools roundup for marketers"},
      {type:"input",id:"brand",label:"Newsletter Name / Brand",placeholder:"e.g. The Marketing Memo"},
      {type:"chips",id:"tone",label:"Tone",options:["Professional","Conversational","Educational","Inspiring","Analytical","Friendly"]},
    ],
    systemPrompt:"You are a newsletter specialist who creates emails people actually read.",
    buildUserPrompt:f=>`Write a full newsletter email for: "${f.topic}" | Newsletter: ${f.brand||"our newsletter"} | Tone: ${f.tone||"Conversational"}
Structure:
📬 Subject line + preview text
👋 Opening hook (2-3 sentences, personal connection)
📰 Main content section (headline + 3-4 paragraphs or formatted sections)
💡 Quick tips or mini-section (3-5 bullet points)
🎯 Featured resource/CTA
👋 Closing + signature
P.S.: [teaser for next issue]`
  },
  {
    id:"sales-email", name:"Sales Email Generator", description:"Generate sales emails that resonate with your target audience and boost conversions", emoji:"💰", color:"#34d399", category:"email",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. 12-week online fitness coaching program"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. women 30-45 who want to lose weight after having kids"},
      {type:"chips",id:"stage",label:"Sales Stage",options:["Cold lead (awareness)","Warm lead (consideration)","Hot lead (decision)","Re-engagement","Post-trial follow-up"]},
      {type:"chips",id:"tone",label:"Tone",options:["Professional","Conversational","Urgency","Empathetic","Bold"]},
    ],
    systemPrompt:"You are a direct response copywriter who writes emails that sell.",
    buildUserPrompt:f=>`Write a sales email for: "${f.product}" targeting: "${f.audience||"potential customers"}"
Stage: ${f.stage||"Warm lead (consideration)"} | Tone: ${f.tone||"Conversational"}
Include:
Subject line + preview text
Opening: [problem/pain acknowledgment]
Body: [solution introduction, key benefits 3-5 bullets, social proof/story]
Offer: [what they get, price anchor if applicable, bonus/guarantee]
CTA: [specific action + urgency element]
P.S.: [reinforces key benefit or creates FOMO]`
  },
  {
    id:"follow-up-email", name:"Follow-Up Email Generator", description:"Craft strategic follow-up emails that re-engage prospects without being pushy", emoji:"🔄", color:"#34d399", category:"email",
    fields:[
      {type:"input",id:"context",label:"What was the first email/meeting about? *",placeholder:"e.g. product demo call for CRM software, they said they'd think about it"},
      {type:"input",id:"prospect",label:"Prospect / Recipient",placeholder:"e.g. Sarah, marketing manager at TechCorp"},
      {type:"chips",id:"timing",label:"Follow-up Timing",options:["Same day","2-3 days later","1 week later","2 weeks later","Last attempt"]},
    ],
    systemPrompt:"You are a sales follow-up specialist. Write emails that get replies without being annoying.",
    buildUserPrompt:f=>`Write 2 follow-up email variations for: "${f.context}"
Recipient: ${f.prospect||"the prospect"} | Timing: ${f.timing||"2-3 days later"}
**Follow-up 1 — Value-add:** [Adds new value, insight, or resource relevant to them + CTA]
**Follow-up 2 — Direct ask:** [Brief, honest, one clear ask + soft close]
Both: short subject, personalized opener, under 100 words body, specific CTA`
  },
  {
    id:"abandoned-cart-email", name:"Abandoned Cart Emails", description:"Write a series of personalized emails to convert abandoned carts into sales", emoji:"🛒", color:"#34d399", category:"email",
    fields:[
      {type:"input",id:"product",label:"Product / Store *",placeholder:"e.g. Premium yoga mat — $89 — YogaStore.com"},
      {type:"input",id:"audience",label:"Customer Profile",placeholder:"e.g. health-conscious women 25-40"},
    ],
    systemPrompt:"You are an e-commerce email specialist who recovers abandoned carts.",
    buildUserPrompt:f=>`Write a 3-email abandoned cart sequence for: "${f.product}" | Customer: ${f.audience||"general shopper"}
**Email 1 — 1 hour after abandonment (Gentle reminder):** Subject + body [friendly, no pressure, product reminder, help offer]
**Email 2 — 24 hours later (Social proof):** Subject + body [customer reviews, benefits, urgency beginning]
**Email 3 — 3 days later (Final push):** Subject + body [FOMO, last-chance language, possible discount mention, clear CTA]
Each email: short, mobile-friendly, one CTA button text`
  },
  {
    id:"promotion-email", name:"Promotional Email Generator", description:"Write engaging marketing emails for any product or service in any language", emoji:"🎁", color:"#34d399", category:"email",
    fields:[
      {type:"input",id:"offer",label:"Promotion / Offer *",placeholder:"e.g. 50% off all courses — Black Friday Sale ends Sunday"},
      {type:"input",id:"brand",label:"Brand / Company",placeholder:"e.g. LearnFast Academy"},
      {type:"chips",id:"tone",label:"Tone",options:["Exciting & Urgent","Professional","Playful","Exclusive","Friendly"]},
    ],
    systemPrompt:"You are a promotional email copywriter who drives clicks and conversions.",
    buildUserPrompt:f=>`Write a promotional email for: "${f.offer}" | Brand: ${f.brand||"the company"} | Tone: ${f.tone||"Exciting & Urgent"}
Include: Compelling subject line + preview text | Eye-catching email header text | Offer headline (benefit-focused) | 2-3 paragraph body (value, social proof, urgency) | Clear CTA button text | Countdown/urgency element | Footer with unsubscribe mention`
  },

  // ── ADVERTISING ──────────────────────────────────────────────
  {
    id:"facebook-ad-copy", name:"Facebook Ad Copy Generator", description:"Create effective Facebook ad copies with 10 sets of headlines and descriptions", emoji:"📢", color:"#f59e0b", category:"advertising",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. AI writing tool for content creators"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. bloggers, YouTubers, content marketers"},
      {type:"input",id:"offer",label:"Unique Offer / CTA",placeholder:"e.g. Start free 14-day trial — no credit card"},
    ],
    systemPrompt:"You are a Facebook Ads specialist who writes high-converting ad copy.",
    buildUserPrompt:f=>`Write 5 Facebook ad variations for: "${f.product}" | Audience: ${f.audience||"general"} | Offer: ${f.offer||"not specified"}
For each:
**Ad [N] — [Hook Type]:**
🎯 Primary Text: [60-125 words, hook → pain → solution → proof → CTA]
📰 Headline: [25 chars max, benefit-focused]
📝 Description: [30 chars max, reinforce CTA]
🖼️ Image concept: [what the ad image should show]
Use different angles: pain-point, transformation, social proof, curiosity, direct offer`
  },
  {
    id:"google-ad-copy", name:"Google Ad Copy Generator", description:"Make Google Ads stand out with catchy headlines and engaging descriptions", emoji:"🔍", color:"#f59e0b", category:"advertising",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. online project management software"},
      {type:"input",id:"keyword",label:"Target Keyword",placeholder:"e.g. project management tool for teams"},
      {type:"input",id:"usp",label:"Unique Selling Point",placeholder:"e.g. saves 5 hours/week, free trial, used by 50k teams"},
    ],
    systemPrompt:"You are a Google Ads specialist. Write ads that maximize Quality Score and CTR.",
    buildUserPrompt:f=>`Write 3 Google Responsive Search Ad sets for: "${f.product}"
Keyword: ${f.keyword||"from product"} | USP: ${f.usp||"not specified"}
For each ad set:
**Ad Set [N]:**
Headlines (15, each under 30 chars): [H1] | [H2] | [H3] | ... [H15]
Descriptions (4, each under 90 chars): [D1] | [D2] | [D3] | [D4]
Highlight: keyword in first headline, benefit, CTA, number/stat where possible`
  },
  {
    id:"instagram-ad-copy", name:"Instagram Ad Copy Generator", description:"Craft compelling Instagram ads that grab attention and drive action", emoji:"📷", color:"#f59e0b", category:"advertising",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. eco-friendly water bottles"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. eco-conscious millennials, fitness enthusiasts"},
      {type:"chips",id:"format",label:"Ad Format",options:["Single image ad","Carousel ad","Story ad","Reels ad","Collection ad"]},
    ],
    systemPrompt:"You are an Instagram advertising specialist who creates scroll-stopping ad copy.",
    buildUserPrompt:f=>`Write 3 Instagram ${f.format||"Single image ad"} variations for: "${f.product}" targeting: "${f.audience||"general"}"
For each:
**Ad [N] — [Angle]:**
📝 Caption: [hook → story/benefit → proof → CTA, 100-150 words]
💬 CTA button: [e.g. Shop Now, Learn More]
🖼️ Visual direction: [what image/video should show]
Use angles: lifestyle, problem/solution, social proof`
  },
  {
    id:"tiktok-ads", name:"TikTok Ads Generator", description:"Create targeted TikTok ads that capture attention and drive results", emoji:"🎭", color:"#f59e0b", category:"advertising",
    fields:[
      {type:"input",id:"product",label:"Product / Brand *",placeholder:"e.g. skincare brand targeting Gen Z"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. 18-24 year olds interested in skincare"},
      {type:"chips",id:"format",label:"Ad Format",options:["In-feed ad","TopView","Brand takeover","Branded hashtag challenge","Spark Ads"]},
    ],
    systemPrompt:"You are a TikTok advertising specialist who understands Gen Z content preferences.",
    buildUserPrompt:f=>`Write 3 TikTok ${f.format||"In-feed ad"} scripts for: "${f.product}" | Audience: ${f.audience||"general"}
For each:
**Ad [N] — [Concept]:**
🎬 Visual hook (0-3 sec): [what happens on screen]
🗣️ Script: [narration/dialogue, natural TikTok language, under 30 seconds]
📱 Text overlays: [on-screen text]
🎵 Sound suggestion: [trending sound type or original]
CTA: [clear action + button text]`
  },
  {
    id:"ugc-ad-script", name:"UGC Ad Script Generator", description:"Create authentic UGC-style video scripts that build trust and drive purchases", emoji:"🎥", color:"#f59e0b", category:"advertising",
    fields:[
      {type:"input",id:"product",label:"Product *",placeholder:"e.g. posture corrector back brace"},
      {type:"input",id:"problem",label:"Problem It Solves",placeholder:"e.g. chronic back pain from sitting all day at a desk"},
      {type:"chips",id:"style",label:"UGC Style",options:["Unboxing reaction","Before & after","Day in my life","Product haul","Review/testimonial","Tutorial/how-to"]},
    ],
    systemPrompt:"You are a UGC content specialist. Write scripts that feel authentic and personal, not like ads.",
    buildUserPrompt:f=>`Write 2 UGC ad scripts for: "${f.product}" solving: "${f.problem||"their problem"}"
Style: ${f.style||"Review/testimonial"}
**Script 1 (30 seconds):** [conversational, first-person, relatable struggle → product discovery → result/transformation, natural imperfections]
**Script 2 (60 seconds):** [longer story, deeper problem context, product trial experience, before/after, honest review feel]
Both include: [VISUAL directions in brackets], natural speech patterns, no-filter authenticity`
  },
  {
    id:"ad-copy-general", name:"Ad Copy Creator", description:"Launch your product with ad copies that captivate and compel your audience to click", emoji:"📣", color:"#f59e0b", category:"advertising",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. AI resume builder for job seekers"},
      {type:"input",id:"usp",label:"Key Benefit / USP",placeholder:"e.g. land 3x more interviews in 2 weeks"},
      {type:"chips",id:"framework",label:"Copywriting Framework",options:["AIDA","PAS (Problem-Agitate-Solution)","BAB (Before-After-Bridge)","4P's (Picture-Promise-Prove-Push)","FOMO","Storytelling"]},
    ],
    systemPrompt:"You are a direct response copywriter who creates ad copy that sells.",
    buildUserPrompt:f=>`Write 3 ad copy variations for: "${f.product}" | Key benefit: ${f.usp||"not specified"} | Framework: ${f.framework||"AIDA"}
For each variation:
**Ad [N] — ${f.framework||"AIDA"}:**
[Apply the ${f.framework||"AIDA"} framework explicitly to write the ad body — 50-150 words]
Headline: [8-12 words] | CTA: [3-5 words]`
  },

  // ── CODE TOOLS ───────────────────────────────────────────────
  {
    id:"code-generator", name:"Code Generator", description:"Turn your ideas into ready-to-use code in any programming language", emoji:"💻", color:"#22d3ee", category:"code",
    fields:[
      {type:"textarea",id:"description",label:"Describe what you want to build *",placeholder:"e.g. A Python function that takes a list of URLs, scrapes the title and meta description from each, and returns a JSON object", rows:5},
      {type:"input",id:"language",label:"Programming Language",placeholder:"e.g. Python, JavaScript, TypeScript, Go, Rust"},
      {type:"chips",id:"style",label:"Code Style",options:["Clean & commented","Minimal","Production-ready","Beginner-friendly with explanations","Advanced/optimized"]},
    ],
    systemPrompt:"You are a senior software engineer. Write clean, working, well-commented code.",
    buildUserPrompt:f=>`Generate ${f.style||"clean & commented"} ${f.language||"Python"} code for: "${f.description}"
Include: complete working code, inline comments, usage example at bottom, any required imports/dependencies listed.`
  },
  {
    id:"code-explainer", name:"Code Explainer", description:"Understand any code with plain-English explanations anyone can follow", emoji:"🔎", color:"#22d3ee", category:"code",
    fields:[
      {type:"textarea",id:"code",label:"Paste your code here *",placeholder:"// paste any code snippet here...", rows:8},
      {type:"chips",id:"level",label:"Explanation Level",options:["Beginner (simple language)","Intermediate (some tech terms)","Expert (technical deep dive)"]},
    ],
    systemPrompt:"You are a programming teacher who explains code clearly at any level.",
    buildUserPrompt:f=>`Explain this code at ${f.level||"Intermediate"} level:
\`\`\`
${f.code}
\`\`\`
Include: What it does (1-2 sentences overview), line-by-line breakdown of key sections, any potential issues or edge cases, real-world use case for this code.`
  },
  {
    id:"code-refactor", name:"Code Refactor", description:"Improve your code for better performance, readability, and maintainability", emoji:"🔧", color:"#22d3ee", category:"code",
    fields:[
      {type:"textarea",id:"code",label:"Paste your code to refactor *",placeholder:"// paste code here...", rows:8},
      {type:"chips",id:"focus",label:"Refactor Focus",options:["Performance","Readability","Clean code / SOLID principles","Remove duplication","Add error handling","Modernize syntax","All of the above"]},
    ],
    systemPrompt:"You are a senior software engineer specializing in code quality and refactoring.",
    buildUserPrompt:f=>`Refactor this code, focusing on: ${f.focus||"All of the above"}
ORIGINAL CODE:
\`\`\`
${f.code}
\`\`\`
Provide:
1. **Refactored Code:** [complete improved version with comments]
2. **Changes Made:** [bullet list of what was improved and why]
3. **Performance Impact:** [estimated improvement if applicable]`
  },
  {
    id:"bug-detector", name:"Bug Detector", description:"Analyze your code to pinpoint and fix bugs with detailed solutions", emoji:"🐛", color:"#22d3ee", category:"code",
    fields:[
      {type:"textarea",id:"code",label:"Paste code with bugs *",placeholder:"// paste your buggy code...", rows:7},
      {type:"textarea",id:"error",label:"Error Message / Symptoms (optional)",placeholder:"e.g. TypeError: Cannot read property 'map' of undefined", rows:2},
    ],
    systemPrompt:"You are a debugging expert. Identify and fix bugs with clear explanations.",
    buildUserPrompt:f=>`Analyze and fix bugs in this code:
Error/Symptoms: ${f.error||"Not specified — analyze for potential issues"}
\`\`\`
${f.code}
\`\`\`
Provide:
🐛 **Bugs Found:** [numbered list of each bug, where it is, why it's wrong]
✅ **Fixed Code:** [complete corrected version]
💡 **Prevention Tips:** [how to avoid these bugs in future]`
  },
  {
    id:"code-completion", name:"Code Completion", description:"Complete unfinished code with smart, context-aware suggestions", emoji:"⚡", color:"#22d3ee", category:"code",
    fields:[
      {type:"textarea",id:"code",label:"Paste your incomplete code *",placeholder:"// paste code to complete — use [TODO] or comments to mark what's needed", rows:8},
      {type:"input",id:"context",label:"What should the completed code do?",placeholder:"e.g. This function should validate an email address and return true/false"},
    ],
    systemPrompt:"You are a senior developer who completes code intelligently.",
    buildUserPrompt:f=>`Complete this code: Context: ${f.context||"complete based on existing code structure"}
\`\`\`
${f.code}
\`\`\`
Provide the complete, working implementation. Maintain the existing code style and patterns.`
  },
  {
    id:"excel-formula", name:"Excel Formula Generator", description:"Create Excel / Google Sheets formulas without the headache", emoji:"📊", color:"#22d3ee", category:"code",
    fields:[
      {type:"textarea",id:"task",label:"What do you need the formula to do? *",placeholder:"e.g. Calculate the average sales per region from column B where column A matches 'North', and only if the date in column C is in 2024", rows:4},
      {type:"chips",id:"tool",label:"Spreadsheet App",options:["Microsoft Excel","Google Sheets","Both compatible"]},
    ],
    systemPrompt:"You are an Excel/Google Sheets expert who creates complex formulas with clear explanations.",
    buildUserPrompt:f=>`Create a ${f.tool||"Google Sheets"} formula for: "${f.task}"
Provide:
**Formula:** \`=YOUR_FORMULA_HERE\`
**How to use it:** [step-by-step setup instructions]
**How it works:** [plain English explanation of each part]
**Alternative approach:** [simpler or different formula if applicable]
**Sample data structure:** [what your columns/data should look like]`
  },

  // ── WRITING ASSISTANT ────────────────────────────────────────
  {
    id:"text-improver", name:"Text Improver", description:"Refine your writing by eliminating errors, redundancies, and improving clarity", emoji:"✨", color:"#8b5cf6", category:"writing",
    fields:[
      {type:"textarea",id:"text",label:"Paste text to improve *",placeholder:"Paste your draft text here...", rows:6},
      {type:"chips",id:"focus",label:"Improvement Focus",options:["Overall quality","Clarity & conciseness","Professional tone","Engagement & flow","Grammar & style","Stronger vocabulary","All improvements"]},
    ],
    systemPrompt:"You are a professional editor who improves writing while preserving the author's voice.",
    buildUserPrompt:f=>`Improve this text, focusing on: ${f.focus||"All improvements"}
ORIGINAL:
${f.text}
Provide:
**Improved Version:** [rewritten text]
**Changes Made:** [bullet list of key improvements]
**Tone Analysis:** [before → after tone shift]`
  },
  {
    id:"grammar-checker", name:"Grammar & Style Checker", description:"Check and correct grammar mistakes for clear, error-free, professional writing", emoji:"✅", color:"#8b5cf6", category:"writing",
    fields:[
      {type:"textarea",id:"text",label:"Paste your text *",placeholder:"Paste the text you want checked...", rows:7},
      {type:"chips",id:"style",label:"Writing Style",options:["Business/Professional","Academic","Casual/Conversational","Creative","Technical"]},
    ],
    systemPrompt:"You are a professional proofreader and grammar expert.",
    buildUserPrompt:f=>`Check and correct this ${f.style||"Professional"} text:
${f.text}
Provide:
**Corrected Text:** [full corrected version]
**Errors Found:** [numbered list: original → correction + rule explanation]
**Style Suggestions:** [optional improvements beyond grammar]
**Overall Assessment:** [readability score description and key strengths]`
  },
  {
    id:"paraphrasing-tool", name:"AI Paraphrasing Tool", description:"Rephrase content without losing the original message", emoji:"🔄", color:"#8b5cf6", category:"writing",
    fields:[
      {type:"textarea",id:"content",label:"Paste text to paraphrase *",placeholder:"Paste the text you want to rephrase here...", rows:6},
      {type:"chips",id:"tone",label:"Output Tone",options:["Same as original","More formal","More casual","More creative","Simpler","Academic"]},
      {type:"chips",id:"mode",label:"Mode",options:["Standard","Fluency","Creative","Formal","Academic","Anti-AI detection"]},
    ],
    systemPrompt:"You are an expert paraphrasing specialist. Preserve meaning, transform expression.",
    buildUserPrompt:f=>`Paraphrase this text. Mode: ${f.mode||"Standard"} | Tone: ${f.tone||"Same as original"}
ORIGINAL: ${f.content}
Write ONLY the paraphrased version. Change sentence structure significantly (not just synonyms). Maintain approximately the same length.`
  },
  {
    id:"content-simplifier", name:"Content Simplifier", description:"Make complex content simple — clear, readable, understandable by anyone", emoji:"💡", color:"#8b5cf6", category:"writing",
    fields:[
      {type:"textarea",id:"text",label:"Paste complex text *",placeholder:"Paste technical, academic, or complex content here...", rows:6},
      {type:"chips",id:"level",label:"Simplify to Level",options:["5th grade (children)","8th grade (teenager)","General public (adult)","Senior executive (busy, no jargon)","Non-native English speaker"]},
    ],
    systemPrompt:"You are a communication expert who makes complex ideas crystal clear.",
    buildUserPrompt:f=>`Simplify this text to ${f.level||"General public"} level:
${f.text}
Keep: core meaning and all important information
Remove: jargon, complex sentence structures, unnecessary words
Add: analogies or examples where helpful
Provide simplified version with a brief readability note.`
  },
  {
    id:"essay-writer", name:"Essay Writer", description:"Create engaging, well-structured essays — plagiarism-free and grammar-perfect", emoji:"📜", color:"#8b5cf6", category:"writing",
    fields:[
      {type:"input",id:"topic",label:"Essay Topic *",placeholder:"e.g. The impact of social media on mental health in teenagers"},
      {type:"chips",id:"type",label:"Essay Type",options:["Argumentative","Expository","Descriptive","Narrative","Compare & Contrast","Persuasive","Analytical"]},
      {type:"chips",id:"length",label:"Length",options:["Short (300-500w)","Medium (600-900w)","Long (1000-1500w)","Extended (2000-2500w)"]},
    ],
    systemPrompt:"You are an academic writing expert. Write essays that are well-structured, insightful, and original.",
    buildUserPrompt:f=>`Write a ${f.type||"Argumentative"} essay about: "${f.topic}"
Length: ${f.length||"Medium (600-900w)"}
Include: compelling thesis, logical argument flow, 3 body paragraphs with topic sentences and evidence, strong conclusion. Use academic language but remain readable.`
  },
  {
    id:"creative-writing", name:"Creative Writing Generator", description:"Write essays, short stories, poems, and creative pieces on any topic", emoji:"🎭", color:"#8b5cf6", category:"writing",
    fields:[
      {type:"input",id:"topic",label:"Topic / Prompt *",placeholder:"e.g. A robot who learns what love means from an elderly woman in a retirement home"},
      {type:"chips",id:"format",label:"Creative Format",options:["Short story","Flash fiction","Poem (rhyming)","Poem (free verse)","Opening chapter","Dialogue scene","Fable/parable","Monologue"]},
      {type:"chips",id:"tone",label:"Tone",options:["Heartwarming","Dark & mysterious","Humorous","Dramatic","Inspirational","Suspenseful","Surreal"]},
    ],
    systemPrompt:"You are a creative writing master with published works in literary fiction, poetry, and storytelling.",
    buildUserPrompt:f=>`Write a ${f.format||"Short story"} about: "${f.topic}" | Tone: ${f.tone||"Heartwarming"}
Use: vivid imagery, compelling characters, emotional resonance, literary techniques. Make it memorable and original.`
  },
  {
    id:"language-translator", name:"Language Translator", description:"Quickly translate text from any language into any language you need", emoji:"🌍", color:"#8b5cf6", category:"writing",
    fields:[
      {type:"textarea",id:"text",label:"Text to translate *",placeholder:"Paste your text here...", rows:5},
      {type:"input",id:"from",label:"From Language",placeholder:"e.g. English (or 'auto-detect')"},
      {type:"input",id:"to",label:"To Language *",placeholder:"e.g. Spanish, French, Japanese, Arabic"},
      {type:"chips",id:"style",label:"Translation Style",options:["Formal","Casual","Business","Literary","Natural/Colloquial"]},
    ],
    systemPrompt:"You are a professional translator with expertise in multiple languages.",
    buildUserPrompt:f=>`Translate this text from ${f.from||"auto-detect"} to ${f.to||"Spanish"}.
Style: ${f.style||"Natural/Colloquial"}
TEXT: ${f.text}
Provide: Translation, then note any cultural adaptations made or alternative phrasings for key terms.`
  },
  {
    id:"summarize", name:"Summarize Pro", description:"Simplify complex information into easy-to-understand key points", emoji:"📌", color:"#8b5cf6", category:"writing",
    fields:[
      {type:"textarea",id:"text",label:"Paste text to summarize *",placeholder:"Paste article, document, or long text here...", rows:7},
      {type:"chips",id:"format",label:"Summary Format",options:["Bullet points","Executive summary","Tweet-length (280 chars)","1-paragraph","Numbered key takeaways","TL;DR"]},
      {type:"chips",id:"length",label:"Detail Level",options:["Very brief (20%)","Medium (40%)","Detailed (60%)"]},
    ],
    systemPrompt:"You are a summarization expert who distills information without losing key meaning.",
    buildUserPrompt:f=>`Summarize this text as ${f.format||"Bullet points"} at ${f.length||"Medium (40%)"} detail level:
${f.text}
Capture: all key points, main arguments, important data, actionable insights. Nothing essential should be left out.`
  },

  // ── BUSINESS ─────────────────────────────────────────────────
  {
    id:"business-name-generator", name:"Business Name Generator", description:"Find the perfect, brandable, domain-friendly business name instantly", emoji:"🏢", color:"#0ea5e9", category:"business",
    fields:[
      {type:"input",id:"industry",label:"Industry / Niche *",placeholder:"e.g. sustainable pet food delivery"},
      {type:"input",id:"keywords",label:"Key Values / Keywords",placeholder:"eco, fresh, paw, care, green"},
      {type:"chips",id:"style",label:"Name Style",options:["Modern & Tech","Classic & Trusted","Playful & Fun","Minimalist","Premium & Luxury","Bold & Energetic"]},
      {type:"chips",id:"count",label:"Names",options:["5 Names","10 Names","15 Names"]},
    ],
    systemPrompt:"You are a branding expert and creative naming consultant.",
    buildUserPrompt:f=>`Generate ${f.count||"10 Names"} business names for: "${f.industry}" | Keywords: ${f.keywords||"none"} | Style: ${f.style||"Modern & Tech"}
For each: **[Name]** — [why it works, brandability /10, if .com likely available, alternative domain extensions]`
  },
  {
    id:"business-idea-generator", name:"Business Idea Generator", description:"Get 10 unique, viable business ideas tailored to your interests and budget", emoji:"💡", color:"#0ea5e9", category:"business",
    fields:[
      {type:"input",id:"interests",label:"Your Interests / Skills *",placeholder:"e.g. writing, social media, cooking, technology"},
      {type:"input",id:"budget",label:"Starting Budget",placeholder:"e.g. $0-500, $1000-5000, $10k+"},
      {type:"chips",id:"type",label:"Business Type",options:["Online / Digital","Service-based","Product-based","Freelance","SaaS / App","Content creator","Mixed"]},
    ],
    systemPrompt:"You are a business strategist and entrepreneur who identifies profitable business opportunities.",
    buildUserPrompt:f=>`Generate 10 business ideas for someone with: Skills/interests: "${f.interests}" | Budget: ${f.budget||"any"} | Type: ${f.type||"Mixed"}
For each:
**[N]. [Business Name/Concept]**
💡 What it is: [1 sentence]
💰 Revenue model: [how it makes money]
🎯 Target customer: [who buys]
⚡ Getting started: [first 3 steps]
📈 Realistic monthly income potential: [range]
⚠️ Main challenge: [honest obstacle]`
  },
  {
    id:"brand-strategy", name:"Brand Strategy Generator", description:"Craft and refine your brand identity to stand out from the competition", emoji:"🎯", color:"#0ea5e9", category:"business",
    fields:[
      {type:"input",id:"brand",label:"Brand / Company Name *",placeholder:"e.g. NovaTech Solutions"},
      {type:"input",id:"product",label:"What You Sell",placeholder:"e.g. AI-powered CRM software for small businesses"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. small business owners with 1-20 employees"},
    ],
    systemPrompt:"You are a brand strategist who creates compelling brand identities.",
    buildUserPrompt:f=>`Create a complete brand strategy for: "${f.brand}" selling: "${f.product||"not specified"}" to: "${f.audience||"general"}"
Include:
🎯 Brand Positioning Statement
💬 Brand Voice & Tone (3-5 adjectives + examples)
🏆 Unique Value Proposition (UVP)
📖 Brand Story (2-3 paragraphs)
🎨 Visual Identity Suggestions (colors, typography style, imagery direction)
📣 Key Brand Messages (3 core messages)
🆚 Differentiation (how to stand out vs competitors)
📣 Tagline options (5 options)`
  },
  {
    id:"elevator-pitch", name:"Elevator Pitch Generator", description:"Craft a compelling 30-60 second pitch that communicates your business perfectly", emoji:"🎤", color:"#0ea5e9", category:"business",
    fields:[
      {type:"input",id:"product",label:"Product / Service / Startup *",placeholder:"e.g. AI tool that turns blog posts into podcast episodes automatically"},
      {type:"input",id:"audience",label:"Pitch Audience",placeholder:"e.g. startup investors, potential customers, conference audience"},
      {type:"chips",id:"length",label:"Pitch Length",options:["30 seconds","60 seconds","2 minutes","3 minutes"]},
    ],
    systemPrompt:"You are a pitch coach who has helped 100+ startups nail their investor pitches.",
    buildUserPrompt:f=>`Write 2 elevator pitch variations for: "${f.product}" targeting: "${f.audience||"general audience"}" | Length: ${f.length||"60 seconds"}
**Pitch 1 — Problem-first:**
[Hook with relatable problem → solution reveal → unique differentiator → results/traction → CTA]
**Pitch 2 — Story-led:**
[Founder story or customer story → problem insight → product → impact → ask/CTA]
Both: conversational, no jargon, memorable close`
  },
  {
    id:"okr-generator", name:"OKR Generator", description:"Set clear, measurable goals and track progress to achieve business objectives", emoji:"📈", color:"#0ea5e9", category:"business",
    fields:[
      {type:"input",id:"company",label:"Company / Team *",placeholder:"e.g. Marketing team at SaaS startup"},
      {type:"input",id:"goal",label:"High-Level Goal / Focus Area",placeholder:"e.g. grow ARR by 40% and expand to enterprise customers"},
      {type:"chips",id:"period",label:"Time Period",options:["Q1 (3 months)","Q2 (3 months)","Half-year","Annual"]},
    ],
    systemPrompt:"You are an OKR coach who helps teams set ambitious, measurable goals.",
    buildUserPrompt:f=>`Create a complete OKR framework for: "${f.company}" | Focus: "${f.goal||"growth"}" | Period: ${f.period||"Q1 (3 months)"}
Format:
**OBJECTIVE 1:** [inspiring, qualitative, motivating — not a number]
  Key Result 1.1: [specific, measurable, 0-100% trackable]
  Key Result 1.2: [specific, measurable]
  Key Result 1.3: [specific, measurable]
**OBJECTIVE 2:** [second objective]
  Key Results: [3 measurable KRs]
**OBJECTIVE 3:** [third objective]
  Key Results: [3 measurable KRs]
**🔑 Key Success Metrics Dashboard:** [weekly check-in template]`
  },
  {
    id:"competitive-landscape", name:"Competitive Landscape Analyzer", description:"Analyze market trends, competitor strategies, and identify growth opportunities", emoji:"🔭", color:"#0ea5e9", category:"business",
    fields:[
      {type:"input",id:"product",label:"Your Product / Business *",placeholder:"e.g. AI writing tool for marketing teams"},
      {type:"input",id:"competitors",label:"Known Competitors (optional)",placeholder:"e.g. Jasper, Copy.ai, ChatGPT"},
      {type:"input",id:"market",label:"Target Market",placeholder:"e.g. marketing agencies, content teams, freelancers"},
    ],
    systemPrompt:"You are a market research analyst and competitive intelligence expert.",
    buildUserPrompt:f=>`Analyze the competitive landscape for: "${f.product}" | Market: ${f.market||"general"} | Competitors: ${f.competitors||"identify the top ones"}
Include:
📊 Market Overview & Size estimate
🏆 Top 5 Competitors: [name, positioning, strengths, weaknesses, pricing]
📈 Market Trends (3-5 key trends)
🎯 Positioning Map (text description)
🔍 Whitespace Opportunities (3-5 gaps in the market)
⚔️ Differentiation Strategy recommendations
📣 Go-to-Market suggestions`
  },

  // ── MARKETING ────────────────────────────────────────────────
  {
    id:"aida-model", name:"AIDA Copywriting Model", description:"Craft compelling content using Attention → Interest → Desire → Action", emoji:"🎯", color:"#f43f5e", category:"marketing",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. AI fitness coaching app"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. busy professionals who want to stay fit"},
      {type:"chips",id:"format",label:"Content Format",options:["Landing page","Email","Ad copy","Sales page","Social post","Video script"]},
    ],
    systemPrompt:"You are a direct response copywriter who applies the AIDA framework.",
    buildUserPrompt:f=>`Write ${f.format||"Landing page"} copy for: "${f.product}" targeting: "${f.audience||"general"}" using the AIDA framework:
**ATTENTION:** [hook that stops them instantly — headline/opening]
**INTEREST:** [deepen interest with problem identification and key facts]
**DESIRE:** [build desire with benefits, transformation, social proof]
**ACTION:** [clear CTA with urgency or incentive]
Make each section transition naturally.`
  },
  {
    id:"landing-page-copy", name:"Landing Page Copywriter", description:"Create high-converting landing page content that showcases your product perfectly", emoji:"🖥️", color:"#f43f5e", category:"marketing",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. Email marketing software for e-commerce stores"},
      {type:"input",id:"audience",label:"Target Customer",placeholder:"e.g. Shopify store owners with $10k+ monthly revenue"},
      {type:"input",id:"offer",label:"Main Offer / CTA",placeholder:"e.g. Start free 30-day trial — no credit card required"},
    ],
    systemPrompt:"You are a conversion copywriting expert who creates landing pages that convert at 3x industry average.",
    buildUserPrompt:f=>`Write complete landing page copy for: "${f.product}" targeting: "${f.audience||"general"}" | Offer: ${f.offer||"not specified"}
Sections:
🏆 HERO: Headline (7-12 words) + Subheadline (20-30 words) + CTA button text
😤 PROBLEM: Pain points section (3-4 pain points)
💡 SOLUTION: How it works (3 steps)
⭐ BENEFITS: Feature → benefit list (5-7 items)
💬 SOCIAL PROOF: 3 testimonial templates + trust badges
💰 PRICING: Pricing section copy (placeholder pricing)
❓ FAQ: 5 objection-handling FAQs
🎯 FINAL CTA: Closing section copy`
  },
  {
    id:"about-us-page", name:"About Us Page Generator", description:"Write a comprehensive 'About Us' page that tells your brand story compellingly", emoji:"🏠", color:"#f43f5e", category:"marketing",
    fields:[
      {type:"input",id:"company",label:"Company Name *",placeholder:"e.g. Bloom Analytics"},
      {type:"input",id:"what",label:"What You Do",placeholder:"e.g. We help e-commerce brands understand their customer data to increase retention"},
      {type:"input",id:"story",label:"Founding Story / Background",placeholder:"e.g. Founded in 2022 after our founder noticed most Shopify stores were flying blind with data"},
    ],
    systemPrompt:"You are a brand storytelling expert who writes About Us pages that build trust and connection.",
    buildUserPrompt:f=>`Write a complete About Us page for: "${f.company}" | What we do: "${f.what||"not specified"}" | Story: "${f.story||"not provided"}"
Include: Hero statement, Company story (origin, mission, why it matters), What we do & how, Core values (3-5), Team section placeholder, Social proof/milestones, Mission statement, CTA`
  },
  {
    id:"tagline-generator", name:"Tagline & Slogan Generator", description:"Create memorable taglines that resonate with your audience and enhance brand identity", emoji:"💬", color:"#f43f5e", category:"marketing",
    fields:[
      {type:"input",id:"brand",label:"Brand / Company *",placeholder:"e.g. EcoBottle — sustainable water bottles"},
      {type:"input",id:"values",label:"Core Values / Promise",placeholder:"e.g. sustainability, quality, modern design, reduce plastic waste"},
      {type:"chips",id:"style",label:"Tagline Style",options:["Short & punchy (2-4 words)","Benefit-focused","Emotional","Clever & witty","Inspirational","Action-oriented","Question"]},
    ],
    systemPrompt:"You are a brand copywriter specializing in memorable taglines.",
    buildUserPrompt:f=>`Generate 10 taglines for: "${f.brand}" | Values: ${f.values||"not specified"} | Style: ${f.style||"Mixed"}
For each:
**[Tagline]** → *Why it works: [brief explanation]* | Best for: [context — ad, website hero, product packaging]
Include variety: short/long, emotional/rational, action/statement.`
  },
  {
    id:"domain-name-ideas", name:"Domain Name Ideas Generator", description:"Dive into unique, engaging domain names for your website or brand", emoji:"🌐", color:"#f43f5e", category:"marketing",
    fields:[
      {type:"input",id:"business",label:"Business / Brand Concept *",placeholder:"e.g. AI-powered recipe generator for home cooks"},
      {type:"input",id:"keywords",label:"Keywords to Include (optional)",placeholder:"e.g. recipe, cook, ai, smart, kitchen"},
      {type:"chips",id:"style",label:"Domain Style",options:["Short & memorable","Keyword-rich","Creative/invented","Brand name style","Descriptive"]},
    ],
    systemPrompt:"You are a domain name expert and branding consultant.",
    buildUserPrompt:f=>`Generate 20 domain name ideas for: "${f.business}" | Keywords: ${f.keywords||"none"} | Style: ${f.style||"Mixed"}
Format as table:
| Domain Name | Extension (.com/.io/.co) | Why It Works | Availability likelihood |
Include: .com options primarily, some .io/.co alternatives. Mix of creative and keyword-based options.`
  },
  {
    id:"press-release", name:"Press Release Generator", description:"Create professional press releases in a clear, media-friendly format that grabs attention", emoji:"📰", color:"#f43f5e", category:"marketing",
    fields:[
      {type:"input",id:"announcement",label:"What are you announcing? *",placeholder:"e.g. Series A funding round of $5M led by Sequoia Capital"},
      {type:"input",id:"company",label:"Company Name",placeholder:"e.g. Bloom Analytics"},
      {type:"input",id:"quote",label:"Executive Quote (optional)",placeholder:"e.g. Sarah Chen, CEO — key message you want to convey"},
    ],
    systemPrompt:"You are a PR specialist who writes press releases that get picked up by major media outlets.",
    buildUserPrompt:f=>`Write a press release for: "${f.announcement}" | Company: ${f.company||"the company"} | Quote person: ${f.quote||"CEO"}
Structure: FOR IMMEDIATE RELEASE | [Headline] | [Dateline — City, Date] | [Lead paragraph — who, what, where, when, why] | [2nd paragraph — context & significance] | [Quote from executive] | [Supporting details — stats, background] | [Boilerplate about the company] | [Contact info placeholder] | ###`
  },

  // ── E-COMMERCE ───────────────────────────────────────────────
  {
    id:"product-description", name:"Product Description Generator", description:"Write compelling product descriptions that convert browsers into buyers", emoji:"🛍️", color:"#fb923c", category:"ecommerce",
    fields:[
      {type:"input",id:"product",label:"Product Name *",placeholder:"e.g. ErgoMax Standing Desk Converter"},
      {type:"textarea",id:"features",label:"Key Features & Benefits",placeholder:"• Height adjustable\n• Fits any desk\n• Cable management\n• Anti-slip mat", rows:4},
      {type:"input",id:"audience",label:"Target Customer",placeholder:"e.g. remote workers, gamers, people with back pain"},
      {type:"chips",id:"platform",label:"Platform",options:["Amazon listing","Shopify/eCommerce","Etsy","Instagram shop","General website"]},
    ],
    systemPrompt:"You are an e-commerce copywriter who creates product descriptions that increase conversion rates.",
    buildUserPrompt:f=>`Write a product description for: "${f.product}" on ${f.platform||"General website"}
Audience: ${f.audience||"general"} | Features: ${f.features||"not specified"}
Include: Hook headline, benefit-led opening (2-3 sentences), Feature → benefit bullets (✓ format), Social proof placeholder, CTA paragraph`
  },
  {
    id:"amazon-product-desc", name:"Amazon Product Description", description:"Create appealing Amazon product descriptions that boost visibility and conversions", emoji:"📦", color:"#fb923c", category:"ecommerce",
    fields:[
      {type:"input",id:"product",label:"Product Name *",placeholder:"e.g. Wireless Ergonomic Mouse for Mac"},
      {type:"textarea",id:"features",label:"Product Features",placeholder:"• 2.4GHz wireless\n• 6-button design\n• 18-month battery life\n• Compatible with Mac/PC", rows:4},
      {type:"input",id:"keyword",label:"Primary Keyword",placeholder:"e.g. ergonomic wireless mouse"},
    ],
    systemPrompt:"You are an Amazon SEO specialist. Write listings that rank and convert.",
    buildUserPrompt:f=>`Write a complete Amazon listing for: "${f.product}" | Primary keyword: ${f.keyword||"from product name"}
Include:
📌 TITLE: [under 200 chars, keyword-optimized, feature-rich]
📝 BULLET POINTS (5): [each starting with CAPS benefit name, 200 chars max, keyword-natural]
📖 PRODUCT DESCRIPTION: [keyword-rich, benefit-focused, 2000 chars, HTML-ready with <b> tags]
🔍 BACKEND KEYWORDS: [50 additional search terms, comma-separated]`
  },
  {
    id:"ebay-listing", name:"eBay Listing Optimizer", description:"Create great eBay titles and descriptions optimized for search visibility", emoji:"🏷️", color:"#fb923c", category:"ecommerce",
    fields:[
      {type:"input",id:"product",label:"Product *",placeholder:"e.g. Vintage 1970s Levis 501 Jeans Size 32x30"},
      {type:"input",id:"condition",label:"Condition & Details",placeholder:"e.g. Good used condition, minor fading, no tears, original buttons"},
      {type:"input",id:"price",label:"Price Range (optional)",placeholder:"e.g. $45-65"},
    ],
    systemPrompt:"You are an eBay SEO specialist who maximizes listing visibility and sales.",
    buildUserPrompt:f=>`Optimize an eBay listing for: "${f.product}" | Condition: ${f.condition||"not specified"} | Price: ${f.price||"not specified"}
Provide:
**Title (80 chars max):** [keyword-rich, specifics first]
**Subtitle (55 chars):** [additional appeal]
**Item Description:** [detailed, trust-building, 200-400 words with condition, dimensions if applicable, what's included]
**Suggested Category:** [eBay category path]
**Item Specifics:** [5-8 key attributes as Name: Value pairs]`
  },
  {
    id:"product-review-generator", name:"Product Review Generator", description:"Create compelling product review blog posts that are keyword-optimized and persuasive", emoji:"⭐", color:"#fb923c", category:"ecommerce",
    fields:[
      {type:"input",id:"product",label:"Product to Review *",placeholder:"e.g. Sony WH-1000XM5 Noise Cancelling Headphones"},
      {type:"input",id:"audience",label:"Who is this review for?",placeholder:"e.g. remote workers, audiophiles, frequent flyers"},
      {type:"chips",id:"tone",label:"Review Tone",options:["Honest & Balanced","Enthusiastic","Professional","Conversational","Technical deep-dive"]},
    ],
    systemPrompt:"You are a product review writer who creates thorough, honest, SEO-optimized reviews.",
    buildUserPrompt:f=>`Write a complete product review for: "${f.product}" | Audience: ${f.audience||"general"} | Tone: ${f.tone||"Honest & Balanced"}
Structure: SEO title + intro hook | Quick verdict (2-3 sentences) | Key specs table | Pros section (5-7 points) | Cons section (3-5 honest points) | Who is it for? | Who should skip it? | Comparison to alternatives | Verdict & score (/10) | Buy recommendation + CTA`
  },
  {
    id:"pricing-page-copy", name:"Pricing Page Copywriter", description:"Create compelling pricing page content that addresses objections and drives upgrades", emoji:"💎", color:"#fb923c", category:"ecommerce",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. project management SaaS tool"},
      {type:"input",id:"tiers",label:"Pricing Tiers (brief description)",placeholder:"e.g. Free, Pro $29/mo, Business $79/mo, Enterprise custom"},
      {type:"input",id:"audience",label:"Target Customer",placeholder:"e.g. freelancers, small teams, enterprises"},
    ],
    systemPrompt:"You are a conversion specialist who writes pricing pages that maximize upgrades.",
    buildUserPrompt:f=>`Write complete pricing page copy for: "${f.product}" | Tiers: ${f.tiers||"Free, Pro, Enterprise"} | Audience: ${f.audience||"general"}
Include: Page headline + subheadline | FAQ section (5 objection-handling questions) | Social proof section | Comparison table headers/labels | Guarantee/risk-reversal statement | Upgrade CTA copy for each tier | "Most popular" badge text | Annual vs monthly savings messaging`
  },

  // ── BOOK WRITING ─────────────────────────────────────────────
  {
    id:"book-title-generator", name:"Book Title Generator", description:"Brainstorm unique, fitting titles that perfectly align with your book's idea and genre", emoji:"📚", color:"#a78bfa", category:"book",
    fields:[
      {type:"input",id:"idea",label:"Book Idea / Concept *",placeholder:"e.g. A memoir about growing up as a first-generation immigrant in America"},
      {type:"chips",id:"genre",label:"Genre",options:["Fiction","Non-fiction","Self-help","Business","Fantasy","Thriller","Romance","Biography","Children's","Science Fiction","Mystery","Horror"]},
      {type:"chips",id:"count",label:"Titles",options:["5 Titles","10 Titles","15 Titles"]},
    ],
    systemPrompt:"You are a book titling expert who creates compelling titles that sell.",
    buildUserPrompt:f=>`Generate ${f.count||"10 Titles"} book titles for: "${f.idea}" | Genre: ${f.genre||"Fiction"}
For each: **[Title]** → [Subtitle suggestion if applicable] | Why it works: [brief reason] | Market appeal: [who it attracts]`
  },
  {
    id:"book-outline", name:"Book Outline Generator", description:"Create a detailed, structured book outline to simplify the writing process", emoji:"📋", color:"#a78bfa", category:"book",
    fields:[
      {type:"input",id:"title",label:"Book Title / Concept *",placeholder:"e.g. The Productivity Code: How to Do More in Less Time"},
      {type:"chips",id:"genre",label:"Genre",options:["Non-fiction/Self-help","Business","Fiction (novel)","Memoir","How-to guide","Biography"]},
      {type:"input",id:"audience",label:"Target Reader",placeholder:"e.g. busy professionals, entrepreneurs, students"},
    ],
    systemPrompt:"You are a professional book editor who creates comprehensive outlines for bestselling books.",
    buildUserPrompt:f=>`Create a complete book outline for: "${f.title}" | Genre: ${f.genre||"Non-fiction/Self-help"} | Reader: ${f.audience||"general"}
Include: Book premise & unique angle, Target reader profile, Chapter-by-chapter breakdown (8-12 chapters each with title, 3-5 key points, anecdote/story ideas), Introduction outline, Conclusion + actionable takeaways, Appendix/resource section`
  },
  {
    id:"book-idea", name:"Book Idea Generator", description:"Transform your initial book idea into a fully-fledged blueprint with market potential", emoji:"💡", color:"#a78bfa", category:"book",
    fields:[
      {type:"input",id:"seed",label:"Your Initial Idea *",placeholder:"e.g. something about how people misunderstand success"},
      {type:"input",id:"expertise",label:"Your Background / Expertise",placeholder:"e.g. 20 years in corporate HR, former teacher"},
      {type:"chips",id:"genre",label:"Preferred Genre",options:["Non-fiction","Business","Self-help","Memoir","Fiction","How-to","Inspirational"]},
    ],
    systemPrompt:"You are a literary agent and book development coach who identifies and develops winning book concepts.",
    buildUserPrompt:f=>`Develop a book concept from this seed idea: "${f.seed}" | Background: ${f.expertise||"not specified"} | Genre: ${f.genre||"Non-fiction"}
Provide:
📖 Working Title + 2 alternatives
🎯 Core Premise (2-3 sentences)
👥 Target Audience (specific)
🏆 Unique Angle (what makes this different)
📚 Similar Bestsellers (3 comparable titles)
📝 Chapter Outline (8-10 chapters)
💰 Market Potential assessment
🔑 Author Platform suggestions`
  },
  {
    id:"book-summarizer", name:"Book Summarizer", description:"Generate a comprehensive summary of any book with key insights and takeaways", emoji:"📖", color:"#a78bfa", category:"book",
    fields:[
      {type:"input",id:"title",label:"Book Title *",placeholder:"e.g. Atomic Habits"},
      {type:"input",id:"author",label:"Author",placeholder:"e.g. James Clear"},
      {type:"chips",id:"format",label:"Summary Format",options:["Key ideas & insights","Chapter-by-chapter","Executive summary","Actionable takeaways","Critical analysis"]},
    ],
    systemPrompt:"You are a literary analyst who creates insightful book summaries.",
    buildUserPrompt:f=>`Write a ${f.format||"Key ideas & insights"} summary of: "${f.title}" by ${f.author||"the author"}
Include: Core premise and thesis, Key concepts/frameworks (with explanations), Notable quotes, Actionable takeaways (5-10 practical points), Who should read it and why, Overall assessment`
  },
  {
    id:"kids-story", name:"Kids Story Book Generator", description:"Create fun, engaging stories for kids that spark imagination and learning", emoji:"🧒", color:"#a78bfa", category:"book",
    fields:[
      {type:"input",id:"theme",label:"Story Theme *",placeholder:"e.g. a young dragon who is afraid of fire"},
      {type:"chips",id:"age",label:"Age Group",options:["2-4 years (very simple)","4-6 years (simple)","6-9 years (chapter book)","9-12 years (middle grade)"]},
      {type:"input",id:"lesson",label:"Life Lesson to Teach",placeholder:"e.g. courage, kindness, honesty, sharing, perseverance"},
    ],
    systemPrompt:"You are a children's book author who creates stories that entertain and teach important values.",
    buildUserPrompt:f=>`Write a children's story for age group: ${f.age||"4-6 years"} about: "${f.theme}" | Lesson: ${f.lesson||"kindness"}
Include: Engaging title, vivid characters, simple but compelling plot, the lesson woven naturally into the story (not preachy), satisfying ending, [IMAGE SUGGESTION: scene descriptions for illustrations in brackets]
Keep language appropriate for ${f.age||"4-6 years"} — short sentences, simple words, repetition where helpful.`
  },

  // ── EDUCATION ────────────────────────────────────────────────
  {
    id:"quiz-generator", name:"Quiz Generator", description:"Create interactive quizzes that test knowledge and boost engagement", emoji:"❓", color:"#10b981", category:"education",
    fields:[
      {type:"input",id:"topic",label:"Quiz Topic *",placeholder:"e.g. World War II history, Python programming basics, Digital Marketing"},
      {type:"chips",id:"type",label:"Quiz Type",options:["Multiple choice (MCQ)","True/False","Fill in the blank","Short answer","Mixed format"]},
      {type:"chips",id:"difficulty",label:"Difficulty",options:["Easy","Medium","Hard","Mixed"]},
      {type:"chips",id:"count",label:"Questions",options:["5 Questions","10 Questions","15 Questions","20 Questions"]},
    ],
    systemPrompt:"You are an educational content designer who creates engaging, accurate quizzes.",
    buildUserPrompt:f=>`Create a ${f.count||"10 Questions"} ${f.type||"Multiple choice"} quiz on: "${f.topic}" | Difficulty: ${f.difficulty||"Medium"}
Format each question:
**Q[N]: [Question text]**
${f.type?.includes("Multiple")||!f.type ? "A) [option] B) [option] C) [option] D) [option]" : f.type?.includes("True") ? "A) True B) False" : "[Answer line]"}
✅ Answer: [correct answer] | 💡 Explanation: [brief reason]
End with: Answer Key summary`
  },
  {
    id:"lesson-plan", name:"Lesson Plan Generator", description:"Design outstanding, comprehensive lesson plans tailored to your educational needs", emoji:"🎓", color:"#10b981", category:"education",
    fields:[
      {type:"input",id:"topic",label:"Lesson Topic *",placeholder:"e.g. Introduction to Photosynthesis"},
      {type:"input",id:"grade",label:"Grade Level / Age Group",placeholder:"e.g. Grade 7 (12-13 year olds)"},
      {type:"chips",id:"duration",label:"Duration",options:["30 minutes","45 minutes","60 minutes","90 minutes","2 hours"]},
    ],
    systemPrompt:"You are a master teacher with 20 years of experience creating engaging lesson plans.",
    buildUserPrompt:f=>`Create a complete lesson plan for: "${f.topic}" | Grade: ${f.grade||"general"} | Duration: ${f.duration||"60 minutes"}
Include: Learning Objectives (3-5 SMART objectives), Materials needed, Vocabulary terms, Lesson flow: [Hook activity] → [Direct instruction] → [Guided practice] → [Independent practice] → [Assessment] → [Closure], Differentiation strategies (for advanced and struggling learners), Homework assignment, Assessment criteria`
  },
  {
    id:"essay-writer-edu", name:"Essay Writer", description:"Effortlessly create engaging, well-structured, plagiarism-free essays", emoji:"📝", color:"#10b981", category:"education",
    fields:[
      {type:"input",id:"topic",label:"Essay Topic *",placeholder:"e.g. The impact of social media on mental health in teenagers"},
      {type:"chips",id:"type",label:"Essay Type",options:["Argumentative","Expository","Descriptive","Narrative","Compare & Contrast","Persuasive","Analytical","Cause & Effect"]},
      {type:"chips",id:"length",label:"Length",options:["Short (300-500w)","Medium (600-900w)","Long (1000-1500w)","Extended (2000-2500w)"]},
    ],
    systemPrompt:"You are an academic writing expert. Write essays that are insightful, well-structured, and original.",
    buildUserPrompt:f=>`Write a ${f.type||"Argumentative"} essay: "${f.topic}" | Length: ${f.length||"Medium (600-900w)"}
Include: compelling thesis, logical argument flow, well-developed body paragraphs with evidence, smooth transitions, strong conclusion that synthesizes arguments.`
  },
  {
    id:"course-overview", name:"Course Overview Generator", description:"Generate course titles, descriptions, outcomes, and full outlines for any topic", emoji:"🎒", color:"#10b981", category:"education",
    fields:[
      {type:"input",id:"topic",label:"Course Topic *",placeholder:"e.g. Digital Marketing for E-commerce Beginners"},
      {type:"input",id:"audience",label:"Target Student",placeholder:"e.g. small business owners with no marketing experience"},
      {type:"chips",id:"duration",label:"Course Duration",options:["Mini course (1 hour)","Short course (3-5 hours)","Standard (8-12 hours)","Comprehensive (20+ hours)"]},
    ],
    systemPrompt:"You are an instructional designer who creates highly-rated online courses.",
    buildUserPrompt:f=>`Design a complete course overview for: "${f.topic}" | Student: ${f.audience||"general"} | Duration: ${f.duration||"Standard (8-12 hours)"}
Include: Course title (punchy, benefit-led) | Subtitle | Description (200 words) | Who is this for? | Prerequisites | 5-7 Learning outcomes | Full module breakdown (each with title, description, lessons, estimated time) | What's included | Instructor bio template`
  },
  {
    id:"homework-help", name:"Homework Help", description:"Get quick, clear explanations to help complete homework and assignments", emoji:"🖊️", color:"#10b981", category:"education",
    fields:[
      {type:"textarea",id:"question",label:"Your Homework Question *",placeholder:"Paste your homework question or describe what you need help with...", rows:5},
      {type:"input",id:"subject",label:"Subject",placeholder:"e.g. Mathematics, Chemistry, History, English Literature"},
      {type:"chips",id:"level",label:"Education Level",options:["Elementary school","Middle school","High school","University/College","Advanced/Graduate"]},
    ],
    systemPrompt:"You are a patient, expert tutor who explains concepts clearly without doing the work for students.",
    buildUserPrompt:f=>`Help with this ${f.subject||"homework"} question at ${f.level||"High school"} level:
${f.question}
Provide: Clear explanation of the concept | Step-by-step approach to solve it | Worked example (similar but different) | Key formulas or rules to remember | Common mistakes to avoid
Guide the learning, don't just give the answer.`
  },

  // ── HR TOOLS ─────────────────────────────────────────────────
  {
    id:"job-description", name:"Job Description Generator", description:"Create comprehensive, bias-free job descriptions that attract top talent", emoji:"💼", color:"#64748b", category:"hr",
    fields:[
      {type:"input",id:"role",label:"Job Title *",placeholder:"e.g. Senior Product Manager"},
      {type:"input",id:"company",label:"Company Name & Type",placeholder:"e.g. TechStartup — Series B SaaS company, 50 employees"},
      {type:"textarea",id:"requirements",label:"Key Requirements / Must-haves",placeholder:"e.g. 5+ years PM experience, B2B SaaS background, data-driven approach", rows:3},
    ],
    systemPrompt:"You are an HR specialist who writes compelling job descriptions that attract qualified candidates.",
    buildUserPrompt:f=>`Write a complete job description for: "${f.role}" at: "${f.company||"the company"}"
Requirements: ${f.requirements||"not specified"}
Include: Job title | About the company (2-3 sentences) | Role overview | Key responsibilities (8-10 bullets) | Required qualifications (5-7) | Nice-to-have qualifications (3-5) | What we offer/benefits (5-7) | Salary range placeholder | How to apply | EEO statement`
  },
  {
    id:"resume-writer", name:"AI Resume Builder", description:"Craft a tailored, professional resume that makes you stand out in the job market", emoji:"📄", color:"#64748b", category:"hr",
    fields:[
      {type:"input",id:"role",label:"Target Job Role *",placeholder:"e.g. Digital Marketing Manager"},
      {type:"textarea",id:"experience",label:"Your Work Experience",placeholder:"e.g. 3 years at ABC Corp as Marketing Coordinator, managed social media, ran email campaigns, increased leads by 40%", rows:4},
      {type:"input",id:"skills",label:"Key Skills",placeholder:"e.g. SEO, Google Analytics, HubSpot, content writing, team leadership"},
    ],
    systemPrompt:"You are a professional resume writer with 95% interview callback rate.",
    buildUserPrompt:f=>`Write a professional resume for someone targeting: "${f.role}"
Experience: ${f.experience||"not provided"} | Skills: ${f.skills||"not provided"}
Format (ATS-friendly):
📝 PROFESSIONAL SUMMARY: [3-4 sentences, value proposition]
💼 WORK EXPERIENCE: [Job title | Company | Dates → 4-6 achievement bullets each with metrics]
🎓 EDUCATION: [placeholder]
⚡ SKILLS: [organized by category]
🏆 ACHIEVEMENTS: [3 standout accomplishments]`
  },
  {
    id:"cover-letter", name:"CV Cover Letter Generator", description:"Write a tailored cover letter focusing on your qualifications and how you benefit the company", emoji:"✉️", color:"#64748b", category:"hr",
    fields:[
      {type:"input",id:"role",label:"Job Role / Company *",placeholder:"e.g. Marketing Manager at Google"},
      {type:"textarea",id:"background",label:"Your Background & Key Achievements",placeholder:"e.g. 5 years marketing experience, grew organic traffic 300%, led team of 8, relevant MBA", rows:3},
      {type:"input",id:"why",label:"Why This Role / Company?",placeholder:"e.g. love their mission in sustainability, perfect culture fit"},
    ],
    systemPrompt:"You are a career coach who writes cover letters with 80%+ callback rates.",
    buildUserPrompt:f=>`Write a compelling cover letter for: "${f.role}"
Background: ${f.background||"not provided"} | Why this role: ${f.why||"not specified"}
Structure: Opening hook (not 'I am applying...'), Connection to company/role, 2-3 achievement paragraphs with metrics, Why this company specifically, Strong closing with CTA
Tone: confident, genuine, specific — avoid generic platitudes. Under 400 words.`
  },
  {
    id:"interview-questions", name:"Interview Assessment Questions", description:"Create targeted interview questions for a detailed assessment of potential hires", emoji:"🎤", color:"#64748b", category:"hr",
    fields:[
      {type:"input",id:"role",label:"Job Role *",placeholder:"e.g. UX Designer"},
      {type:"chips",id:"type",label:"Question Type",options:["Behavioral (STAR)","Technical/Skills","Situational","Culture fit","Leadership","Mixed comprehensive"]},
      {type:"chips",id:"count",label:"Questions",options:["10 Questions","15 Questions","20 Questions","25 Questions"]},
    ],
    systemPrompt:"You are an expert hiring manager and organizational psychologist.",
    buildUserPrompt:f=>`Create ${f.count||"15 Questions"} ${f.type||"Mixed comprehensive"} interview questions for: "${f.role}"
For each question:
**Q[N]: [Question]**
*Type: [Behavioral/Technical/Situational]* | *Tests: [specific skill or trait]*
✅ What a strong answer includes: [2-3 elements]
🚩 Red flags to watch for: [1-2 concerning signs]`
  },
  {
    id:"job-rejection-email", name:"Job Rejection Email Generator", description:"Generate kind, professional job rejection emails that maintain positive relationships", emoji:"📮", color:"#64748b", category:"hr",
    fields:[
      {type:"input",id:"role",label:"Job Role Applied For *",placeholder:"e.g. Senior Software Engineer"},
      {type:"chips",id:"stage",label:"Rejection Stage",options:["Initial application review","After phone screen","After first interview","After final round","After offer stage"]},
      {type:"chips",id:"tone",label:"Tone",options:["Warm & encouraging","Professional & brief","Detailed feedback","Keep in touch for future"]},
    ],
    systemPrompt:"You are an HR professional who writes rejection emails that preserve employer brand and candidate relationships.",
    buildUserPrompt:f=>`Write 2 rejection email variations for a ${f.stage||"After first interview"} ${f.role||"position"} candidate.
Tone: ${f.tone||"Warm & encouraging"}
**Email 1:** [subject line + full body — respectful, specific, leaves door open]
**Email 2:** [different opening approach, slightly different tone, still constructive]
Both: acknowledge the effort, be specific about "not moving forward", avoid false hope, maintain dignity`
  },
  {
    id:"performance-review", name:"Employee Performance Review", description:"Generate insightful, constructive performance feedback for any employee", emoji:"📊", color:"#64748b", category:"hr",
    fields:[
      {type:"input",id:"employee",label:"Employee Role & Context *",placeholder:"e.g. Sales Representative, exceeded quota by 20%, struggles with reporting"},
      {type:"chips",id:"rating",label:"Overall Performance Rating",options:["Exceeds expectations","Meets expectations","Partially meets expectations","Does not meet expectations"]},
      {type:"chips",id:"tone",label:"Review Tone",options:["Formal HR-style","Constructive & encouraging","Direct & honest","Developmental focus"]},
    ],
    systemPrompt:"You are an experienced HR manager who writes fair, balanced, and constructive performance reviews.",
    buildUserPrompt:f=>`Write a performance review for: "${f.employee}" | Rating: ${f.rating||"Meets expectations"} | Tone: ${f.tone||"Constructive & encouraging"}
Include: Overall assessment summary, Key strengths (3-4 with specific examples), Areas for improvement (2-3 with actionable suggestions), Goal achievement review, SMART goals for next review period (3-4), Development recommendations, Manager summary closing`
  },

  // ── WEBSITE CONTENT ──────────────────────────────────────────
  {
    id:"service-page-content", name:"Service Page Content Generator", description:"Write SEO-friendly service page content that resonates with your audience", emoji:"⚙️", color:"#06b6d4", category:"website",
    fields:[
      {type:"input",id:"service",label:"Service Name *",placeholder:"e.g. Social Media Management for E-commerce Brands"},
      {type:"input",id:"company",label:"Company Name",placeholder:"e.g. Bloom Digital Agency"},
      {type:"input",id:"audience",label:"Target Client",placeholder:"e.g. DTC e-commerce brands doing $1M-10M revenue"},
    ],
    systemPrompt:"You are a B2B copywriter who creates service pages that generate qualified leads.",
    buildUserPrompt:f=>`Write complete service page content for: "${f.service}" | Company: ${f.company||"the company"} | Client: ${f.audience||"general"}
Sections: Hero headline + subheadline + CTA | What this service is (2-3 paragraphs) | What's included (detailed list) | Our process (4-6 steps) | Who it's for (ideal client profile) | Results/outcomes (3-5 measurable outcomes) | Testimonial placeholders | FAQ (5 questions) | Pricing mention + CTA`
  },
  {
    id:"website-popup", name:"Website Pop-up Message Generator", description:"Craft pop-up messages that convert visitors without annoying them", emoji:"💬", color:"#06b6d4", category:"website",
    fields:[
      {type:"input",id:"goal",label:"Pop-up Goal *",placeholder:"e.g. capture email for 10% discount, announce flash sale, promote webinar"},
      {type:"input",id:"brand",label:"Brand / Product",placeholder:"e.g. SkinGlow Beauty Store"},
      {type:"chips",id:"type",label:"Pop-up Type",options:["Exit intent","Time-delayed","Scroll-triggered","Welcome","Promotional","Cart abandonment"]},
    ],
    systemPrompt:"You are a conversion rate optimization specialist who creates high-converting pop-ups.",
    buildUserPrompt:f=>`Write 3 ${f.type||"Exit intent"} pop-up variations for: "${f.goal}" | Brand: ${f.brand||"the brand"}
For each:
**Pop-up [N]:**
📰 Headline: [under 8 words, value-focused]
📝 Body: [1-2 sentences max, benefit-led]
🎁 Offer: [specific and clear]
✅ CTA Button: [action text]
❌ Dismiss: [non-shaming exit text]
Why it converts: [psychology used]`
  },
  {
    id:"faq-generator", name:"FAQ Generator", description:"Create tailored FAQs that answer customer questions and reduce support load", emoji:"❓", color:"#06b6d4", category:"website",
    fields:[
      {type:"input",id:"product",label:"Product / Service / Topic *",placeholder:"e.g. SaaS subscription billing and plan management"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. small business owners new to SaaS"},
      {type:"chips",id:"count",label:"FAQs",options:["5 FAQs","10 FAQs","15 FAQs","20 FAQs"]},
    ],
    systemPrompt:"You are a customer experience expert who creates FAQs that reduce support tickets by 50%.",
    buildUserPrompt:f=>`Generate ${f.count||"10 FAQs"} for: "${f.product}" | Audience: ${f.audience||"general"}
Format:
**Q: [Natural customer question]**
A: [Clear, complete answer — direct, no fluff, 2-5 sentences]
Group by category: Pricing, Features, Getting started, Troubleshooting, Account management`
  },

  // ── VIDEO & SCRIPT ───────────────────────────────────────────
  {
    id:"explainer-video-script", name:"Explainer Video Script", description:"Create voiceover scripts that engage, explain, and convert viewers to action", emoji:"🎬", color:"#7c3aed", category:"video",
    fields:[
      {type:"input",id:"product",label:"Product / Service *",placeholder:"e.g. AI expense tracking app for freelancers"},
      {type:"input",id:"audience",label:"Target Audience",placeholder:"e.g. freelancers frustrated by manual expense tracking"},
      {type:"chips",id:"duration",label:"Video Duration",options:["30 seconds","60 seconds","90 seconds","2 minutes","3 minutes"]},
    ],
    systemPrompt:"You are a video script writer specializing in explainer videos with high conversion rates.",
    buildUserPrompt:f=>`Write an explainer video script for: "${f.product}" targeting: "${f.audience||"general"}" | Duration: ${f.duration||"90 seconds"}
Structure:
[HOOK - 0-10 sec]: [Problem statement that resonates immediately]
[PROBLEM - 10-30 sec]: [Agitate the pain point]
[SOLUTION INTRO - 30-50 sec]: [Introduce product naturally]
[HOW IT WORKS - 50-80 sec]: [3-step simple process]
[BENEFITS - 80-110 sec]: [Transformation/outcomes]
[CTA - last 15 sec]: [Clear next step]
Include: [B-ROLL suggestions], [ANIMATION directions], [MUSIC mood suggestions]`
  },
  {
    id:"podcast-script", name:"Podcast Script Generator", description:"Create detailed, engaging scripts for podcast episodes that captivate your audience", emoji:"🎙️", color:"#7c3aed", category:"video",
    fields:[
      {type:"input",id:"topic",label:"Episode Topic *",placeholder:"e.g. How to build a personal brand on LinkedIn in 2025"},
      {type:"input",id:"podcast",label:"Podcast Name / Style",placeholder:"e.g. The Marketing Hour — solo episode, educational"},
      {type:"chips",id:"duration",label:"Duration",options:["10-15 min","20-30 min","30-45 min","45-60 min"]},
    ],
    systemPrompt:"You are a podcast producer who creates compelling episode scripts.",
    buildUserPrompt:f=>`Write a podcast script for: "${f.topic}" | Show: ${f.podcast||"general podcast"} | Duration: ${f.duration||"20-30 min"}
Include:
[INTRO - 2 min]: Catchy hook + episode preview + sponsor slot placeholder
[SEGMENT 1 - personal connection or story hook]
[MAIN CONTENT - 3-4 segments]: [each with key points, examples, transitions]
[KEY TAKEAWAYS]: [3-5 actionable insights to summarize]
[OUTRO - CTA + subscribe + next episode tease]
Add: [SOUND EFFECT cues], [PAUSE markers], [EMPHASIS notes]`
  },
  {
    id:"kids-video-script", name:"Kids Video Script Generator", description:"Create fun, educational video scripts for children that entertain and teach", emoji:"👶", color:"#7c3aed", category:"video",
    fields:[
      {type:"input",id:"topic",label:"Video Topic *",placeholder:"e.g. Why do leaves change color in autumn?"},
      {type:"chips",id:"age",label:"Age Group",options:["2-4 years","4-7 years","7-10 years","10-13 years"]},
      {type:"chips",id:"duration",label:"Duration",options:["3-5 min","5-8 min","8-12 min"]},
    ],
    systemPrompt:"You are a children's content creator who makes educational videos that kids love and parents approve.",
    buildUserPrompt:f=>`Write a kids video script about: "${f.topic}" for age: ${f.age||"4-7 years"} | Duration: ${f.duration||"5-8 min"}
Include: Energetic opening with character/host introduction, Simple explanation using analogies kids understand, Fun facts, Interactive moments (questions to ask the audience), Repetition of key concepts, Upbeat closing with summary and sign-off
[VISUAL directions in brackets], simple vocabulary for age group`
  },

  // ── PERSONAL TOOLS ───────────────────────────────────────────
  {
    id:"travel-itinerary", name:"Travel Itinerary Planner", description:"Create your ideal travel itinerary with day-by-day schedules and recommendations", emoji:"✈️", color:"#0891b2", category:"personal",
    fields:[
      {type:"input",id:"destination",label:"Destination *",placeholder:"e.g. Tokyo, Japan for 7 days"},
      {type:"input",id:"preferences",label:"Travel Preferences",placeholder:"e.g. love food, culture, avoid tourist traps, moderate budget"},
      {type:"chips",id:"style",label:"Travel Style",options:["Adventure","Cultural","Relaxation","Food & Wine","Backpacker budget","Luxury","Family-friendly"]},
    ],
    systemPrompt:"You are an experienced travel planner who creates unforgettable, practical itineraries.",
    buildUserPrompt:f=>`Create a complete travel itinerary for: "${f.destination}" | Style: ${f.style||"Cultural"} | Preferences: ${f.preferences||"general"}
Format day-by-day:
**Day [N] — [Theme of the day]:**
🌅 Morning: [activity, location, tips, estimated time]
☀️ Afternoon: [activity, location, tips]
🌙 Evening: [restaurant/experience recommendation]
💡 Local tip: [insider knowledge]
💰 Estimated cost: [budget guide]
End with: Packing essentials, Transport tips, Best apps to download`
  },
  {
    id:"resume-from-job", name:"Resume Builder from Job Description", description:"Create a personalized resume tailored to a specific job description", emoji:"🎯", color:"#0891b2", category:"personal",
    fields:[
      {type:"textarea",id:"job",label:"Job Description (paste it) *",placeholder:"Paste the full job description here...", rows:5},
      {type:"textarea",id:"experience",label:"Your Experience & Skills",placeholder:"Briefly describe your background, key roles, achievements, and skills...", rows:4},
    ],
    systemPrompt:"You are a resume specialist who tailors CVs to specific job descriptions for maximum ATS score.",
    buildUserPrompt:f=>`Create a tailored resume optimized for this job description:
JOB: ${f.job}
MY BACKGROUND: ${f.experience||"not provided"}
Include: Keywords from the job description naturally, Achievement-focused bullets with metrics, Skills section matching job requirements, Summary statement that mirrors the job's language, ATS optimization`
  },
  {
    id:"thank-you-note", name:"Thank You Note Creator", description:"Create heartfelt, personalized thank you notes for any occasion", emoji:"💌", color:"#0891b2", category:"personal",
    fields:[
      {type:"input",id:"occasion",label:"Occasion / What are you thanking for? *",placeholder:"e.g. job interview, client referral, wedding gift, mentorship"},
      {type:"input",id:"person",label:"Who are you thanking?",placeholder:"e.g. Sarah, my direct manager / long-term client"},
      {type:"chips",id:"tone",label:"Tone",options:["Professional","Warm & personal","Formal","Casual","Heartfelt","Brief & punchy"]},
    ],
    systemPrompt:"You are a communications expert who writes authentic, memorable thank you notes.",
    buildUserPrompt:f=>`Write 3 thank you note variations for: "${f.occasion}" | To: ${f.person||"the recipient"} | Tone: ${f.tone||"Warm & personal"}
**Note 1 — Short (under 75 words):** [concise, sincere, specific]
**Note 2 — Medium (100-150 words):** [adds specific detail + emotional connection]
**Note 3 — Long (200-250 words):** [full story + impact + future connection]`
  },
  {
    id:"personal-message", name:"Personal Message Writer", description:"Draft personal messages that always hit the right tone for any occasion", emoji:"💬", color:"#0891b2", category:"personal",
    fields:[
      {type:"input",id:"occasion",label:"Occasion / Purpose *",placeholder:"e.g. birthday, condolences, congratulations, apology, reconnecting"},
      {type:"input",id:"relationship",label:"Your Relationship",placeholder:"e.g. close friend, colleague, distant relative, old schoolmate"},
      {type:"chips",id:"tone",label:"Tone",options:["Warm & loving","Professional yet personal","Humorous","Heartfelt","Casual","Formal"]},
    ],
    systemPrompt:"You are a communications expert who drafts perfect personal messages.",
    buildUserPrompt:f=>`Write 3 personal message variations for: "${f.occasion}" | Relationship: ${f.relationship||"friend"} | Tone: ${f.tone||"Warm & loving"}
**Message 1 — Brief (1-2 sentences):** [for text/WhatsApp]
**Message 2 — Card length (50-80 words):** [for card or short note]
**Message 3 — Full message (150-200 words):** [email or letter length]
Each should feel genuinely personal, not generic.`
  },
  {
    id:"recipe-generator", name:"Recipe Suggestions Generator", description:"Find the perfect recipe tailored to your ingredients, preferences, and dietary needs", emoji:"🍳", color:"#0891b2", category:"personal",
    fields:[
      {type:"input",id:"ingredients",label:"Available Ingredients *",placeholder:"e.g. chicken breast, lemon, garlic, pasta, spinach, cream"},
      {type:"chips",id:"cuisine",label:"Cuisine Style",options:["Italian","Asian","Mexican","Mediterranean","American","Indian","French","Anything goes"]},
      {type:"chips",id:"dietary",label:"Dietary Notes",options:["No restrictions","Vegetarian","Vegan","Gluten-free","Low-carb/Keto","Dairy-free","High protein"]},
      {type:"chips",id:"time",label:"Cooking Time",options:["Under 15 min","Under 30 min","Under 1 hour","Any time"]},
    ],
    systemPrompt:"You are a professional chef who creates delicious, practical recipes from any ingredients.",
    buildUserPrompt:f=>`Create 3 recipe suggestions using: ${f.ingredients} | Cuisine: ${f.cuisine||"Anything"} | Diet: ${f.dietary||"No restrictions"} | Time: ${f.time||"Under 30 min"}
For each recipe:
**🍽️ [Recipe Name]** (⏱️ [X] min | 👥 Serves [N])
📋 Full ingredients with quantities
📝 Step-by-step instructions
💡 Chef tips: [1-2 pro tips]
🔄 Substitutions: [easy swaps]`
  },

  // ── REWRITING ────────────────────────────────────────────────
  {
    id:"article-rewriter", name:"Article Rewriter", description:"Revamp articles to give a new look & sound human while bypassing AI detection", emoji:"✏️", color:"#84cc16", category:"rewriting",
    fields:[
      {type:"textarea",id:"content",label:"Paste article to rewrite *",placeholder:"Paste the full article or section here...", rows:7},
      {type:"chips",id:"style",label:"Rewriting Style",options:["Human-like & Natural","More Engaging","Simplified","Expanded","Condensed","Anti-AI detection"]},
    ],
    systemPrompt:"You are an expert content rewriter. Transform content to sound authentically human.",
    buildUserPrompt:f=>`Completely rewrite: [Mode: ${f.style||"Human-like & Natural"}]
${f.content}
Rules: Change sentence structure significantly (not just synonyms), vary sentence length naturally, use active voice, add human elements (transitions, rhetorical questions, analogies), make it flow as written by an experienced human.`
  },
  {
    id:"add-emojis", name:"Add Emojis to Text", description:"Add a touch of charm — cleverly place emojis in your text to make it engaging", emoji:"😊", color:"#84cc16", category:"rewriting",
    fields:[
      {type:"textarea",id:"text",label:"Paste your text *",placeholder:"Paste the text you want to add emojis to...", rows:6},
      {type:"chips",id:"density",label:"Emoji Density",options:["Minimal (1-2 per paragraph)","Moderate (every few sentences)","Heavy (social media style)"]},
      {type:"chips",id:"style",label:"Emoji Style",options:["Professional","Fun & casual","Emotional","Business-friendly"]},
    ],
    systemPrompt:"You are a social media copywriter who uses emojis strategically to enhance engagement.",
    buildUserPrompt:f=>`Add emojis to this text. Density: ${f.density||"Moderate"} | Style: ${f.style||"Fun & casual"}
TEXT: ${f.text}
Rules: Place emojis to enhance meaning (not randomly), relevant to context, improve readability. Return the complete text with emojis added.`
  },
  {
    id:"prompt-generator", name:"AI Prompt Generator", description:"Generate powerful, ready-to-use prompts for ChatGPT, Midjourney, DALL-E and more", emoji:"✨", color:"#84cc16", category:"rewriting",
    fields:[
      {type:"input",id:"topic",label:"What do you want to create? *",placeholder:"e.g. write a viral LinkedIn post about remote work productivity"},
      {type:"chips",id:"tool",label:"AI Tool",options:["ChatGPT / Claude","Midjourney","DALL-E / Stable Diffusion","Gemini","Any LLM"]},
      {type:"chips",id:"style",label:"Prompt Style",options:["Detailed & Precise","Creative & Open","Step-by-step","Role-play","Chain-of-thought"]},
    ],
    systemPrompt:"You are a world-class AI prompt engineer.",
    buildUserPrompt:f=>`Create 5 high-quality ${f.tool||"ChatGPT"} prompts for: "${f.topic}" | Style: ${f.style||"Detailed & Precise"}
For each:
**Prompt [N]: [Title]**
\`\`\`
[Complete, paste-ready prompt]
\`\`\`
*Why this works: [technique used]*`
  },
];

// ── Category config ───────────────────────────────────────────
const CATS: { id: Cat|"all"; label: string; emoji: string }[] = [
  {id:"all",       label:"All Tools",     emoji:"🔮"},
  {id:"blog",      label:"Blog & SEO",    emoji:"📝"},
  {id:"youtube",   label:"YouTube",       emoji:"▶️"},
  {id:"social",    label:"Social Media",  emoji:"📱"},
  {id:"email",     label:"Email",         emoji:"📧"},
  {id:"advertising",label:"Ads",         emoji:"📢"},
  {id:"code",      label:"Code",          emoji:"💻"},
  {id:"writing",   label:"Writing",       emoji:"✍️"},
  {id:"business",  label:"Business",      emoji:"🏢"},
  {id:"marketing", label:"Marketing",     emoji:"🎯"},
  {id:"ecommerce", label:"E-Commerce",    emoji:"🛍️"},
  {id:"book",      label:"Book Writing",  emoji:"📚"},
  {id:"education", label:"Education",     emoji:"🎓"},
  {id:"hr",        label:"HR Tools",      emoji:"👥"},
  {id:"website",   label:"Website",       emoji:"🖥️"},
  {id:"video",     label:"Video & Script",emoji:"🎬"},
  {id:"personal",  label:"Personal",      emoji:"🌟"},
  {id:"rewriting", label:"Rewriting",     emoji:"🔄"},
];

// ── Field renderer ────────────────────────────────────────────
function FieldRenderer({ field, value, onChange }: { field:FieldDef; value:string; onChange:(v:string)=>void }) {
  if (field.type==="input") return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
      <input className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors" placeholder={field.placeholder} value={value} onChange={e=>onChange(e.target.value)} />
    </div>
  );
  if (field.type==="textarea") return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
      <textarea className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none" rows={field.rows??4} placeholder={field.placeholder} value={value} onChange={e=>onChange(e.target.value)} />
    </div>
  );
  if (field.type==="select") return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
      <select className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none" value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">Choose…</option>
        {field.options.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
  if (field.type==="chips") return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
      <div className="flex flex-wrap gap-2">
        {field.options.map(o=>(
          <button key={o} type="button" onClick={()=>onChange(value===o?"":o)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${value===o?"border-violet-400 bg-violet-400/20 text-violet-300":"border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
  return null;
}

// ── Tool Modal ────────────────────────────────────────────────
function ToolModal({ tool, onClose }: { tool:ToolDef; onClose:()=>void }) {
  const [fields, setFields] = useState<Record<string,string>>({});
  const [output, setOutput] = useState(""); const [loading, setLoading] = useState(false); const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const setField = useCallback((id:string,val:string)=>setFields(prev=>({...prev,[id]:val})),[]);

  const toolTemplates = TEMPLATES[tool.id] || [];

  const applyTemplate = (tmpl: TemplateExample) => {
    setFields(tmpl.values);
    setOutput("");
  };

  const generate = async () => {
    if (!fields[tool.fields[0].id]?.trim()) return;
    setLoading(true); setOutput(""); setSaved(false);
    try {
      await streamTool(tool.systemPrompt, tool.buildUserPrompt(fields), chunk=>{
        setOutput(prev=>{
          const next=prev+chunk;
          setTimeout(()=>{if(outputRef.current) outputRef.current.scrollTop=outputRef.current.scrollHeight;},10);
          return next;
        });
      });
    } catch { setOutput("Generation failed. Please try again."); }
    finally { setLoading(false); }
  };

  const saveToLib = () => {
    if (!output) return;
    saveToMediaLibrary(tool.name, tool.emoji, tool.category, output);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const canGenerate = !!fields[tool.fields[0].id]?.trim();

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:40}} transition={{type:"spring",damping:25,stiffness:300}}
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#0d0d1f] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/8 shrink-0" style={{background:tool.color+"15"}}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{background:tool.color+"25"}}>{tool.emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base">{tool.name}</h3>
            <p className="text-white/45 text-xs truncate">{tool.description}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0"><X className="w-4 h-4"/></button>
        </div>

        {/* Template examples bar */}
        {toolTemplates.length > 0 && (
          <div className="px-6 py-3 border-b border-white/8 bg-white/[0.02]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-white/40 shrink-0">
                <Zap className="w-3 h-3" style={{color:tool.color}}/> Quick examples:
              </div>
              {toolTemplates.map((tmpl, i) => (
                <button key={i} onClick={() => applyTemplate(tmpl)}
                  className="px-3 py-1.5 rounded-full text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all">
                  {tmpl.label} →
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <div className="grid md:grid-cols-2 gap-0 min-h-full">
            {/* Form panel */}
            <div className="p-6 space-y-4 border-r border-white/8">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Configure Your Tool</p>
              {tool.fields.map(field=><FieldRenderer key={field.id} field={field} value={fields[field.id]??""} onChange={v=>setField(field.id,v)}/>)}
              <Button onClick={generate} disabled={!canGenerate||loading} className="w-full h-11 font-bold text-sm rounded-xl text-black mt-2" style={{background:canGenerate&&!loading?tool.color:undefined}}>
                {loading?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Generating…</>:<><Sparkles className="w-4 h-4 mr-2"/>Generate</>}
              </Button>
            </div>

            {/* Output panel */}
            <div className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Generated Output</p>
                {output&&<div className="flex gap-1.5 flex-wrap justify-end">
                  <button onClick={()=>{setOutput("");setFields({});setSaved(false);}} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-2.5 py-1.5 rounded-lg transition-colors"><RefreshCw className="w-3 h-3"/>Reset</button>
                  <button onClick={saveToLib} className={`flex items-center gap-1.5 text-xs border px-2.5 py-1.5 rounded-lg transition-colors ${saved?"border-emerald-500/40 text-emerald-400 bg-emerald-500/10":"border-white/10 text-white/50 hover:text-white hover:border-white/25"}`}>
                    {saved?<><Check className="w-3 h-3"/>Saved!</>:<><BookmarkPlus className="w-3 h-3"/>Save</>}
                  </button>
                  <button onClick={()=>{navigator.clipboard.writeText(output);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1.5 rounded-lg transition-colors">
                    {copied?<><Check className="w-3 h-3 text-green-400"/>Copied!</>:<><Copy className="w-3 h-3"/>Copy</>}
                  </button>
                </div>}
              </div>
              {!output&&!loading?(
                <div className="flex-1 min-h-[280px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 text-center px-6">
                  <span className="text-4xl opacity-30">{tool.emoji}</span>
                  <p className="text-white/25 text-sm">Fill in the form and click Generate<br/>to see your AI-created content here</p>
                  {toolTemplates.length > 0 && <p className="text-white/15 text-xs">Or click a quick example above to prefill the form</p>}
                </div>
              ):(
                <textarea ref={outputRef} className="flex-1 min-h-[280px] w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm leading-relaxed resize-none focus:outline-none font-mono" value={output} onChange={e=>setOutput(e.target.value)} placeholder={loading?"Generating your content…":""}/>
              )}
              {loading&&<div className="flex items-center gap-2 text-xs text-white/35"><Loader2 className="w-3 h-3 animate-spin" style={{color:tool.color}}/><span>AI is writing…</span></div>}
              {output && !loading && (
                <p className="text-xs text-white/20 text-center">Click "Save" to store this in your Media Library</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tool card ─────────────────────────────────────────────────
function ToolCard({ tool, onClick }: { tool:ToolDef; onClick:()=>void }) {
  return (
    <motion.button whileHover={{y:-3,scale:1.01}} whileTap={{scale:0.98}} onClick={onClick}
      className="text-left w-full p-4 rounded-xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/15 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110" style={{background:tool.color+"20"}}>{tool.emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-semibold leading-snug mb-0.5">{tool.name}</h3>
          <p className="text-white/35 text-xs leading-relaxed line-clamp-2">{tool.description}</p>
        </div>
      </div>
    </motion.button>
  );
}

// ── Main section ──────────────────────────────────────────────
export default function WritingToolsSection() {
  const [activeCat, setActiveCat] = useState<Cat|"all">("all");
  const [openTool, setOpenTool] = useState<ToolDef|null>(null);
  const [search, setSearch] = useState("");

  // Listen for category-select events dispatched by ToolsSection chips
  useEffect(() => {
    const handler = (e: Event) => {
      const cat = (e as CustomEvent<{ cat: string }>).detail?.cat as Cat | "all";
      if (cat) { setActiveCat(cat); setSearch(""); }
    };
    window.addEventListener("set-writing-cat", handler);
    return () => window.removeEventListener("set-writing-cat", handler);
  }, []);

  const filtered = TOOLS.filter(t => {
    const matchCat = activeCat==="all" || t.category===activeCat;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <section id="writing-tools" className="py-24 relative overflow-hidden bg-white/[0.01] border-t border-white/5">
      <div className="absolute right-0 top-0 w-[700px] h-[700px] bg-violet-600/5 rounded-full blur-[180px] pointer-events-none"/>
      <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"/>

      <div className="container px-4 mx-auto max-w-8xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-2"/> 100+ AI Writing Tools
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Transform Your Content with <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">AI-Powered Writing</span>
          </h2>
          <p className="text-lg text-white/45">Rise above the ordinary. Deliver extraordinary content. Every format, platform, and goal — covered.</p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"/>
            <input className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-5 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 transition-colors" placeholder="Search 100+ tools…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATS.map(cat=>{
            const count = cat.id==="all"?TOOLS.length:TOOLS.filter(t=>t.category===cat.id).length;
            return (
              <button key={cat.id} onClick={()=>setActiveCat(cat.id as Cat|"all")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all ${activeCat===cat.id?"bg-violet-500/20 border-violet-500/50 text-violet-300":"border-white/10 text-white/50 hover:text-white hover:border-white/20 bg-white/5"}`}>
                <span>{cat.emoji}</span> {cat.label} <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeCat===cat.id?"bg-violet-500/30 text-violet-300":"bg-white/10 text-white/30"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Tools grid */}
        <AnimatePresence mode="wait">
          <motion.div key={activeCat+search} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.15}}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filtered.map(tool=><ToolCard key={tool.id} tool={tool} onClick={()=>setOpenTool(tool)}/>)}
          </motion.div>
        </AnimatePresence>

        {filtered.length===0&&(
          <div className="text-center py-20">
            <p className="text-white/30 text-lg">No tools found for "{search}"</p>
            <button onClick={()=>{setSearch("");setActiveCat("all");}} className="mt-3 text-violet-400 text-sm hover:underline">Clear search</button>
          </div>
        )}

        <p className="text-center text-white/20 text-sm mt-10">Showing {filtered.length} of {TOOLS.length} tools • All free, no credits required</p>
      </div>

      <AnimatePresence>{openTool&&<ToolModal tool={openTool} onClose={()=>setOpenTool(null)}/>}</AnimatePresence>
    </section>
  );
}
