import { useState } from "react";
import { X, Clock, ArrowRight, BookOpen, User, Tag, Calendar } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  image: string;
  content: string;
}

const POSTS: BlogPost[] = [
  {
    slug: "ai-content-marketing-2025",
    title: "How AI Is Revolutionizing Content Marketing in 2025",
    excerpt: "From automated blog writing to personalized campaigns, discover how AI tools are helping Indian businesses scale their content marketing 10x faster without increasing headcount.",
    category: "AI Marketing",
    readTime: "6 min read",
    date: "April 12, 2025",
    author: "Marketingstuffs Team",
    image: "https://image.pollinations.ai/prompt/AI%20content%20marketing%20India%202025%20digital%20growth%20flat%20illustration?width=800&height=450&nologo=true&model=flux",
    content: `## How AI Is Revolutionizing Content Marketing in 2025

Content marketing has always been about delivering the right message to the right audience at the right time. But in 2025, AI has transformed this from an art into a science — making it faster, cheaper, and more effective than ever.

### The Rise of AI-First Content Teams

Businesses in India and globally are restructuring their content teams. Instead of 10 writers producing 50 pieces a month, they now have 2 writers supported by AI tools producing 300+ pieces — at higher quality. The key isn't replacing humans; it's amplifying them.

**Key shifts happening right now:**

- **Automated first drafts**: AI tools like Marketingstuffs generate complete blog posts, ad copy, and social media content in minutes — not hours.
- **SEO optimization at scale**: AI analyzes search intent and weaves keywords naturally, something that previously required specialist SEO writers.
- **Personalization at scale**: AI can adapt the same base content for 50 different audience segments automatically.
- **Multilingual content**: Indian businesses can now instantly create content in Hindi, Tamil, Telugu, Marathi, and 35+ other languages.

### What AI Content Marketing Looks Like in Practice

Here's a real workflow a Bengaluru-based SaaS startup is using:

1. **Monday**: AI generates 20 blog topics based on trending keywords in their niche
2. **Tuesday**: AI writes full drafts for the top 5 topics; human editor reviews and polishes
3. **Wednesday**: AI creates social media variations for Instagram, LinkedIn, and Twitter from each blog
4. **Thursday**: AI generates email campaigns based on blog content for subscriber segments
5. **Friday**: Analytics review; AI suggests next week's content based on performance data

This entire workflow, which used to take a 5-person team all week, now takes 2 people 2 days.

### The Indian Market Opportunity

India's digital content consumption is growing at 18% year-over-year. With over 700 million internet users and rapidly growing e-commerce, the demand for quality content in regional languages and niches is enormous. AI makes it possible for a solo founder in Jaipur to compete with a funded startup in Mumbai — with the same quality of content output.

### Getting Started with AI Content Marketing

The barrier to entry has never been lower. Tools like **Marketingstuffs** give you a complete AI content stack for free — blog writer, social media manager, ad creator, email marketing, and more. Start with one tool, master it, then layer in others.

**The businesses winning in 2025 are those that combine human creativity with AI efficiency.** Neither alone is sufficient. Together, they're unstoppable.`,
  },
  {
    slug: "seo-blog-writing-guide",
    title: "Complete Guide to SEO Blog Writing with AI Tools",
    excerpt: "Learn the exact framework top bloggers use to rank on Google page 1 using AI-assisted content creation — with keyword research, structure, and on-page SEO all covered.",
    category: "SEO",
    readTime: "8 min read",
    date: "April 8, 2025",
    author: "Marketingstuffs Team",
    image: "https://image.pollinations.ai/prompt/SEO%20blog%20writing%20ranking%20Google%20content%20strategy%20minimal%20illustration?width=800&height=450&nologo=true&model=flux",
    content: `## Complete Guide to SEO Blog Writing with AI Tools

Ranking on Google's first page isn't magic — it's a repeatable process. In 2025, AI tools have made that process faster and more accessible to anyone willing to put in the work.

### Step 1: Keyword Research (The Foundation)

Before writing a single word, you need to know what your audience is searching for. Good keyword research answers three questions:

1. **What are people searching for?** (search intent)
2. **How many people search for it?** (search volume)
3. **How hard is it to rank for?** (competition)

**For new blogs, target keywords with:**
- Monthly searches: 500–5,000 (not too competitive)
- Keyword difficulty: Below 40 (tools like Ahrefs or Semrush show this)
- Clear commercial or informational intent

**Example**: Instead of targeting "digital marketing" (competition: 90/100), target "digital marketing tips for small restaurants in India" (competition: 12/100).

### Step 2: Content Structure That Google Loves

Google rewards content that is comprehensive, organized, and user-friendly. Here's the proven structure:

1. **H1 Title**: Include primary keyword naturally
2. **Introduction**: Hook the reader + state what they'll learn (150-200 words)
3. **H2 Sections**: Cover all subtopics related to the keyword (5-8 sections)
4. **H3 Subsections**: Break down complex points
5. **Conclusion**: Summarize + clear CTA

**AI tip**: Ask Marketingstuffs to "Write a comprehensive blog outline for [keyword]" — it generates the perfect structure based on top-ranking content.

### Step 3: On-Page SEO Checklist

Once your content is written, run through this checklist:

- ✅ Primary keyword in title (H1)
- ✅ Primary keyword in first 100 words
- ✅ Primary keyword in at least 2 H2 headings
- ✅ LSI keywords (related terms) used naturally throughout
- ✅ Meta description written with keyword + compelling hook
- ✅ Images have descriptive alt text
- ✅ Internal links to 3-5 related posts on your site
- ✅ External links to 2-3 authoritative sources
- ✅ Target reading time: 1,500–3,000 words for most topics

### Step 4: Using AI Without Getting Penalized

Google's Helpful Content Update rewards content that is genuinely helpful to humans — written by experts, for people, not search engines. Here's how to use AI ethically:

- Always add your own expertise, examples, and opinions
- Fact-check all AI-generated statistics and data
- Rewrite AI output in your unique voice
- Add original research, case studies, or quotes where possible
- Never publish raw AI output without editing

### Step 5: Promotion and Link Building

The best content in the world won't rank without links. Strategy for new bloggers:

1. Share on LinkedIn, Reddit (relevant subreddits), and Quora answers
2. Email other bloggers in your niche; mention their work in your article
3. Submit to content aggregators (Flipboard, Mix, Blogarama)
4. Repurpose into YouTube videos, which can link back to your blog

**With Marketingstuffs, you can create the blog, the social posts to promote it, the email newsletter to announce it, and the video script to accompany it — all in one platform.**`,
  },
  {
    slug: "youtube-growth-1000-subscribers",
    title: "YouTube Growth Hacks: Get Your First 1,000 Subscribers Faster",
    excerpt: "The exact strategies Indian YouTubers are using in 2025 to break the 1,000 subscriber mark quickly — from niche selection to title optimization and thumbnail psychology.",
    category: "YouTube",
    readTime: "7 min read",
    date: "April 5, 2025",
    author: "Marketingstuffs Team",
    image: "https://image.pollinations.ai/prompt/YouTube%20growth%20channel%201000%20subscribers%20creator%20India%20colorful%20illustration?width=800&height=450&nologo=true&model=flux",
    content: `## YouTube Growth Hacks: Get Your First 1,000 Subscribers Faster

The first 1,000 subscribers is the hardest milestone on YouTube. After that, the algorithm starts actively helping you grow. Here's the proven path to get there faster.

### Why 1,000 Subscribers Matters

YouTube requires 1,000 subscribers + 4,000 watch hours to monetize your channel. But more importantly, crossing 1k signals to the YouTube algorithm that real humans want to watch your content — unlocking new distribution.

### Step 1: Nail Your Niche (Not Too Broad, Not Too Narrow)

The biggest mistake new YouTubers make: trying to appeal to everyone. The algorithm rewards specificity.

**Bad niche**: "Lifestyle"
**Better niche**: "Budget travel in South India for solo travelers"
**Best niche**: "Budget solo travel in Rajasthan under ₹1,500/day"

The more specific you are, the faster you find your tribe — and the easier it is to create content your audience actively searches for.

### Step 2: The 3-Video Formula for Fast Growth

Your first 3 videos should follow this formula:

1. **Video 1**: Answer the #1 question in your niche (this gets search traffic)
2. **Video 2**: Share your personal story/journey (this builds connection)
3. **Video 3**: Your "best of" compilation or tutorial (this shows range)

Upload all 3 within your first 2 weeks. The algorithm rewards channels that post consistently.

### Step 3: Title + Thumbnail = Everything

Experienced YouTubers say the title and thumbnail account for 80% of a video's success. Here's what works:

**Title formula**: [Number/Emotion] + [Specific Benefit] + [Context]
- ✅ "I Spent ₹15,000 Traveling Kerala for 7 Days (Full Breakdown)"
- ✅ "5 Mistakes Killing Your Instagram Growth (Fixed!)"
- ❌ "My Travel Vlog | Kerala Trip"

**Thumbnail psychology**:
- Faces with strong emotions get more clicks (surprise, excitement)
- Bold, short text (3-5 words max)
- High contrast colors that stand out in YouTube's dark/light themes
- Create curiosity — don't reveal everything

**Use YT Growstuffs on Marketingstuffs** to generate 8 title variations and 3 thumbnail concepts for every video instantly.

### Step 4: The First 48 Hours Strategy

YouTube's algorithm judges a video mostly in the first 48 hours. Here's how to maximize this window:

1. **Post at the right time**: For Indian audiences, Thursday-Saturday 6-9 PM IST performs best
2. **Send to email list first**: Even a small list of 50 people watching helps
3. **Share in WhatsApp groups**: Relevant communities love niche-specific content
4. **Post short clip to Reels/Shorts**: Cross-promote for additional reach
5. **Respond to every comment**: Comment activity signals engagement to YouTube

### Step 5: The Comment → Subscribe Loop

Your video description is more powerful than most creators realize:

- First line: Include your primary keyword
- Pin a comment asking viewers a question (boosts comment count)
- Add chapter timestamps (improves watch time)
- Link to your 2-3 best performing videos

**The secret no one talks about**: End every video with "If this helped you, subscribe — I post every [day] about [niche]." Channels that explicitly ask for subscriptions grow 40% faster on average.`,
  },
  {
    slug: "email-vs-sms-marketing-india",
    title: "Email Marketing vs SMS Marketing: Which Works Better in India 2025?",
    excerpt: "A data-driven comparison of email and SMS marketing for Indian businesses, with open rates, conversion rates, and use cases for both channels — plus how to use them together.",
    category: "Marketing",
    readTime: "5 min read",
    date: "April 1, 2025",
    author: "Marketingstuffs Team",
    image: "https://image.pollinations.ai/prompt/Email%20vs%20SMS%20marketing%20comparison%20India%20business%20growth%20minimalist%20digital%20art?width=800&height=450&nologo=true&model=flux",
    content: `## Email Marketing vs SMS Marketing: Which Works Better in India 2025?

Both email and SMS marketing are powerful — but they serve different purposes. Here's a data-driven breakdown for Indian businesses.

### The Numbers: Email vs SMS

| Metric | Email | SMS |
|--------|-------|-----|
| Average open rate | 21% | 98% |
| Average click rate | 2.6% | 19% |
| Average response time | 90 minutes | 3 minutes |
| Cost per message | ₹0.05-0.20 | ₹0.12-0.50 |
| Best for | Detailed content, nurturing | Urgent offers, reminders |

### When to Use Email Marketing

Email excels when you need to deliver rich, detailed content:

**Best use cases for email:**
- Weekly newsletters with blog content
- Onboarding sequences for new customers
- Product launches with detailed features
- Monthly promotions and offers
- Re-engagement campaigns for dormant users
- B2B sales outreach (cold email)

**India-specific insight**: Email marketing performs best in metro cities (Mumbai, Bengaluru, Delhi) where smartphone users regularly check email for professional communications. Open rates for professional content average 28% in India vs. 21% globally.

### When to Use SMS Marketing

SMS is unbeatable for time-sensitive, high-urgency communications:

**Best use cases for SMS:**
- Flash sales (2-4 hour window deals)
- Appointment reminders
- OTP and transactional messages
- Event reminders
- Cart abandonment (send within 1 hour)
- Loyalty program updates

**India-specific insight**: WhatsApp Business (98% smartphone penetration in India) is increasingly replacing traditional SMS for marketing. Consider WhatsApp marketing as a third channel that combines SMS immediacy with email richness.

### The Winning Strategy: Use Both Together

The most effective marketers in India use a coordinated approach:

**Example: Flash Sale Campaign**

1. **Day -3**: Email announcing the upcoming sale (build anticipation)
2. **Day -1**: Email with early access for VIP subscribers
3. **Day 0, 8 AM**: SMS blast: "SALE IS LIVE ⚡ 50% off ends tonight. Shop now: [link]"
4. **Day 0, 6 PM**: Email reminder with featured products
5. **Day 0, 9 PM**: SMS: "3 hours left! ⏰ Sale ends at midnight."

This multichannel approach typically delivers 3.2x higher revenue than using a single channel.

### Compliance in India

**Email**: Follow CAN-SPAM + TRAI regulations. Always include an unsubscribe link. For commercial emails, ensure you have explicit consent.

**SMS**: TRAI's DND (Do Not Disturb) registry must be respected. Only send to opted-in users. Transactional SMS (OTP, order updates) can be sent to DND numbers; promotional SMS cannot.

**Use Marketingstuffs** to generate TCPA/TRAI-compliant email campaigns and SMS messages with built-in compliance guidance — saving your legal review time significantly.`,
  },
  {
    slug: "ai-website-builder-guide",
    title: "How to Build a Professional Business Website with AI in Under 30 Minutes",
    excerpt: "A step-by-step walkthrough of building a complete, SEO-ready business website using AI — from choosing your business type to publishing a site with all sections, contact forms, and local SEO.",
    category: "Website",
    readTime: "6 min read",
    date: "March 28, 2025",
    author: "Marketingstuffs Team",
    image: "https://image.pollinations.ai/prompt/AI%20website%20builder%20professional%20business%20site%20modern%20clean%20digital%20illustration?width=800&height=450&nologo=true&model=flux",
    content: `## How to Build a Professional Business Website with AI in Under 30 Minutes

Getting a professional website used to require a web developer, ₹30,000+, and weeks of back-and-forth. With AI website builders in 2025, a complete business website can be live in 30 minutes — for free.

### What You Get with an AI-Built Website

A properly built AI website includes:
- Hero section (compelling headline + CTA)
- About section (your story, team, values)
- Services/Products section
- Portfolio or case studies
- Testimonials section
- Contact form
- SEO meta tags and structured data
- Mobile-responsive design
- Privacy policy and terms of service

### Step 1: Gather Your Business Information

Before you start, prepare:
- **Business name** and tagline
- **Primary service/product** description (2-3 sentences)
- **Target customers** (who you serve)
- **Location** (city, state, or "online")
- **Contact details** (phone, email, WhatsApp)
- **3-5 key features** that set you apart
- **Color preference** (optional)

### Step 2: Use the AI Website Builder

On Marketingstuffs, click "Website Builder" in the navigation. The 5-step wizard walks you through:

1. **Business Details**: Name, type, tagline, description
2. **Content & AI**: Let AI write your copy or customize it
3. **Contact Info**: Phone, email, WhatsApp, social links
4. **Style & Template**: Choose from Minimal, Magazine, Corporate, or Creative
5. **SEO & Publishing**: Add keywords, meta description, and generate your sitemap

The AI generates all copy automatically based on your business type. A restaurant gets a different structure than a law firm — the AI understands context.

### Step 3: Review and Customize

Once generated, review each section:
- Is the headline compelling? (Should create curiosity or state a clear benefit)
- Does the About section sound human? (Add personal details the AI can't know)
- Are the services descriptions accurate? (Adjust pricing, specifics)
- Is the contact information correct?

**Pro tip**: The AI writes in professional English by default. For local businesses targeting Hindi or regional language audiences, add a note like "Include a Hinglish welcome message" and the AI will adapt.

### Step 4: SEO Optimization

Before publishing, optimize for search:

- **Business name + city keyword** in the page title
- **Services + location** in meta description
- **Google My Business** compatible structured data (the AI adds this automatically)
- **Schema markup** for local businesses, restaurants, professionals
- Add to **Google Search Console** after publishing

### Step 5: Go Live

Export your website as a complete HTML package from Marketingstuffs. Upload to:
- **GitHub Pages** (free, requires basic setup)
- **Netlify** (free, drag-and-drop deploy)
- **Hostinger** (₹69/month, Indian servers, great for local SEO)
- **Your existing hosting** (just upload the files)

**Local SEO bonus**: After publishing, submit your site URL to Google Search Console, create a Google My Business listing, and link them together. Within 4-6 weeks, your business should appear in local Google searches.`,
  },
  {
    slug: "social-media-strategy-india-2025",
    title: "Social Media Strategy for Indian Businesses: Complete 2025 Playbook",
    excerpt: "Which platforms actually work for Indian businesses in 2025? We break down Instagram, LinkedIn, WhatsApp, YouTube, and X with posting strategies, content types, and growth hacks for each.",
    category: "Social Media",
    readTime: "9 min read",
    date: "March 22, 2025",
    author: "Marketingstuffs Team",
    image: "https://image.pollinations.ai/prompt/Social%20media%20strategy%20India%20Instagram%20LinkedIn%20colorful%20marketing%20digital%20illustration?width=800&height=450&nologo=true&model=flux",
    content: `## Social Media Strategy for Indian Businesses: Complete 2025 Playbook

India has the world's largest social media market with 600M+ active users. But more users means more noise. Here's how Indian businesses win in 2025.

### Platform-by-Platform Breakdown

#### Instagram (800M+ Indian users)
**Best for**: D2C brands, restaurants, fashion, beauty, travel, creators

**What works in 2025**:
- Reels (30-60 seconds) get 3-5x the reach of static posts
- Carousel posts with educational content get saved and shared
- Stories with polls and questions boost engagement rate

**Posting frequency**: 3-5 Reels/week + 5-7 Stories/day
**Best times**: 7-9 AM, 12-2 PM, 7-10 PM IST

**Hashtag strategy**: 5-8 niche hashtags (not generic #love or #india) + 3 location tags + 2 branded hashtags. Avoid banned hashtags.

#### LinkedIn (110M+ Indian users)
**Best for**: B2B services, SaaS, consulting, HR, finance, education

**What works in 2025**:
- Founder/CEO personal posts outperform company page posts 5x
- "Hot takes" and opinion pieces get massive engagement
- Video thought leadership: 2-3 minute talking-head videos

**Posting frequency**: 3-5 posts/week (quality over quantity)
**Best times**: Tuesday-Thursday, 8-10 AM and 12-2 PM IST

**The Indian LinkedIn secret**: Posts in Hinglish (Hindi + English mix) get 40% more Indian engagement than pure English posts.

#### WhatsApp Business
**Best for**: Local businesses, e-commerce, services with repeat customers

**What works in 2025**:
- WhatsApp Broadcast for product updates to opted-in customers
- Catalog feature for product showcasing
- Quick reply templates for customer service

**Key rule**: Never add people without consent. Build your list organically through your website, Instagram bio link, and packaging.

#### YouTube (500M+ Indian users)
**Best for**: Education, entertainment, product reviews, tutorials, news

**What works in 2025**:
- Mix long-form (10-20 min) with YouTube Shorts (under 60 sec)
- Hindi content sees 3x faster growth than English in Tier 2/3 cities
- Shorts can be repurposed from long-form videos

**Use YT Growstuffs** on Marketingstuffs to generate ideas, titles, scripts, and tags for every video.

### The 4-1-1 Rule for Indian Businesses

For every 6 posts:
- **4 posts**: Pure value content (tips, tutorials, behind-the-scenes, education)
- **1 post**: Engagement content (polls, questions, "share your thoughts")
- **1 post**: Promotional content (product, service, offer)

Businesses that over-promote lose followers fast. Value-first wins every time.

### AI-Powered Content Creation

Creating content for 3-4 platforms, 4-5 times per week = 60-100 pieces of content per month. That's a full-time job — unless you use AI.

**Marketingstuffs workflow**:
1. Write one core piece of content (blog post or video)
2. Use the Social Media Manager to repurpose it for all platforms
3. AI tailors tone, length, and hashtags for each platform automatically
4. Schedule posts in advance with the built-in calendar

What used to take 20 hours/week now takes 2 hours — with better results.`,
  },
];

function BlogModal({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e1e] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#0e0e1e]/95 backdrop-blur-sm border-b border-white/8 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2.5 py-1 rounded-full">{post.category}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} />{post.readTime}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <img src={post.image} alt={post.title} className="w-full h-52 object-cover rounded-2xl mb-6" loading="lazy" />
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
            <span className="flex items-center gap-1"><User size={11} />{post.author}</span>
            <span className="flex items-center gap-1"><Calendar size={11} />{post.date}</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {post.content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold text-white mt-6 mb-3">{line.slice(3)}</h2>;
              if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-bold text-white mt-5 mb-2">{line.slice(4)}</h3>;
              if (line.startsWith("#### ")) return <h4 key={i} className="text-base font-bold text-violet-300 mt-4 mb-2">{line.slice(5)}</h4>;
              if (line.startsWith("- ✅ ")) return <p key={i} className="text-slate-300 text-sm my-1 flex items-start gap-2"><span className="text-emerald-400 shrink-0">✅</span>{line.slice(5)}</p>;
              if (line.startsWith("- ❌ ")) return <p key={i} className="text-slate-300 text-sm my-1 flex items-start gap-2"><span className="text-red-400 shrink-0">❌</span>{line.slice(5)}</p>;
              if (line.startsWith("- **")) {
                const match = line.match(/^- \*\*(.+?)\*\*: (.+)$/);
                if (match) return <p key={i} className="text-slate-300 text-sm my-1.5 pl-4"><span className="text-white font-semibold">{match[1]}</span>: {match[2]}</p>;
                return <p key={i} className="text-slate-300 text-sm my-1 pl-4">• {line.slice(2)}</p>;
              }
              if (line.startsWith("- ")) return <p key={i} className="text-slate-400 text-sm my-1 pl-4">• {line.slice(2)}</p>;
              if (line.startsWith("**")) {
                const clean = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                return <p key={i} className="text-slate-200 text-sm my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: clean }} />;
              }
              if (line.startsWith("| ")) return null;
              if (line.trim() === "") return <div key={i} className="my-2" />;
              return <p key={i} className="text-slate-300 text-sm my-2 leading-relaxed">{line}</p>;
            })}
          </div>
          <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between">
            <span className="text-slate-500 text-sm">Published on Marketingstuffs Blog</span>
            <a href="https://marketingstuffs.site" className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1 transition-colors">
              Visit Platform <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  "AI Marketing": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "SEO": "bg-green-500/20 text-green-400 border-green-500/30",
  "YouTube": "bg-red-500/20 text-red-400 border-red-500/30",
  "Marketing": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Website": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Social Media": "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export default function BlogsSection() {
  const [openPost, setOpenPost] = useState<BlogPost | null>(null);

  return (
    <section id="blogs" className="py-20 px-4 bg-gradient-to-b from-[#08080f] to-[#0b0c1b]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-1.5 mb-4">
            <BookOpen size={14} className="text-violet-400" />
            <span className="text-violet-300 text-sm font-semibold">Marketingstuffs Blog</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
            Growth Insights &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Marketing Tips</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Practical guides, strategies, and AI marketing insights for businesses in India and beyond.
          </p>
        </div>

        {/* Blog grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-all group cursor-pointer"
              onClick={() => setOpenPost(post)}
            >
              <div className="relative overflow-hidden h-44">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[post.category] || "bg-slate-700 text-slate-300"}`}>
                    {post.category}
                  </span>
                  <span className="text-slate-500 text-xs flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
                </div>
                <h3 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-violet-300 transition-colors">
                  {post.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">{post.date}</span>
                  <span className="text-violet-400 text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read more <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Blog modal */}
      {openPost && <BlogModal post={openPost} onClose={() => setOpenPost(null)} />}
    </section>
  );
}
