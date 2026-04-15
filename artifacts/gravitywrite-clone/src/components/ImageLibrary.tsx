import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, Check, Search, X, RefreshCw, ExternalLink, ImageIcon, Loader2, Sparkles, ZoomIn } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface ImageItem { id: string; prompt: string; label: string; seed: number; width?: number; height?: number; }
interface Category   { id: string; label: string; emoji: string; images: ImageItem[]; }

function pollinationsUrl(prompt: string, seed: number, w = 640, h = 480) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux&seed=${seed}`;
}

// ── Image categories + prompts ─────────────────────────────────
const CATEGORIES: Category[] = [
  {
    id: "business",
    label: "Business & Marketing",
    emoji: "💼",
    images: [
      { id:"bm1",  prompt:"modern minimalist office workspace with laptop and coffee, professional lighting, clean desk",                     label:"Modern Workspace",        seed:101 },
      { id:"bm2",  prompt:"diverse team meeting in bright conference room, collaborative business setting, professional",                    label:"Team Meeting",            seed:102 },
      { id:"bm3",  prompt:"entrepreneur working on laptop in stylish cafe, warm ambient lighting, productivity",                            label:"Work From Cafe",          seed:103 },
      { id:"bm4",  prompt:"business growth chart going up on digital screen, data visualization, success concept",                          label:"Business Growth",         seed:104 },
      { id:"bm5",  prompt:"professional business handshake, partnership deal, corporate setting, warm lighting",                            label:"Partnership",             seed:105 },
      { id:"bm6",  prompt:"startup office with sticky notes and whiteboards, brainstorming session, creative space",                        label:"Startup Brainstorm",      seed:106 },
      { id:"bm7",  prompt:"digital marketing dashboard on multiple screens, analytics and metrics, modern tech office",                     label:"Marketing Dashboard",     seed:107 },
      { id:"bm8",  prompt:"luxury brand product launch event, elegant venue, spotlights and crowd",                                         label:"Product Launch",          seed:108 },
      { id:"bm9",  prompt:"female CEO presenting to board room, confident leadership, corporate presentation",                              label:"Leadership",              seed:109 },
      { id:"bm10", prompt:"creative agency open plan office, colorful walls, designers working, vibrant workspace",                         label:"Creative Agency",         seed:110 },
      { id:"bm11", prompt:"business strategy concept, chess pieces on board, planning and tactics metaphor",                                label:"Strategy",                seed:111 },
      { id:"bm12", prompt:"global business map with connection lines, international trade concept, world network",                          label:"Global Business",         seed:112 },
    ],
  },
  {
    id: "social",
    label: "Social Media",
    emoji: "📱",
    images: [
      { id:"sm1",  prompt:"aesthetic flat lay of coffee, journal, flowers and phone on marble, lifestyle blog",                             label:"Aesthetic Flat Lay",      seed:201 },
      { id:"sm2",  prompt:"influencer creating content at home studio with ring light and camera, creator setup",                           label:"Content Creator Setup",   seed:202 },
      { id:"sm3",  prompt:"healthy smoothie bowl with colorful toppings, overhead shot, food photography, vibrant",                        label:"Smoothie Bowl",           seed:203 },
      { id:"sm4",  prompt:"travel blogger with camera on mountain peak, adventure lifestyle, golden hour",                                  label:"Travel Adventure",        seed:204 },
      { id:"sm5",  prompt:"fashionable outfit flat lay, stylish clothing on white background, fashion blogger",                            label:"Fashion Flat Lay",        seed:205 },
      { id:"sm6",  prompt:"aesthetic home decor instagram photo, minimalist living room, neutral tones, cozy vibes",                       label:"Home Aesthetic",          seed:206 },
      { id:"sm7",  prompt:"fitness model doing workout in modern gym, athletic wear, motivational poster style",                           label:"Fitness Motivation",      seed:207 },
      { id:"sm8",  prompt:"artisan coffee being poured in stylish cafe, beautiful latte art, moody lighting",                              label:"Coffee Aesthetic",        seed:208 },
      { id:"sm9",  prompt:"social media notification screen with likes and followers exploding, viral content concept",                    label:"Viral Moment",            seed:209 },
      { id:"sm10", prompt:"young woman laughing with phone in hand, candid lifestyle photo, authentic social media",                       label:"Authentic Lifestyle",     seed:210 },
      { id:"sm11", prompt:"sunset beach selfie setup, golden hour glow, travel content creator",                                           label:"Beach Sunset Content",    seed:211 },
      { id:"sm12", prompt:"bookstagram aesthetic, stack of books with coffee and candles, cozy reading nook",                              label:"Bookstagram",             seed:212 },
    ],
  },
  {
    id: "blog",
    label: "Blog & Content",
    emoji: "📝",
    images: [
      { id:"bl1",  prompt:"writer typing on vintage typewriter, warm study lighting, books in background, creative writing",               label:"Writer at Work",          seed:301 },
      { id:"bl2",  prompt:"open notebook with pen on wooden desk, planning and writing concept, minimalist",                               label:"Planning Ideas",          seed:302 },
      { id:"bl3",  prompt:"library interior with tall bookshelves, warm lighting, knowledge and learning concept",                         label:"Library",                 seed:303 },
      { id:"bl4",  prompt:"blogger reading article on laptop with morning coffee, home office morning routine",                            label:"Morning Blogging",        seed:304 },
      { id:"bl5",  prompt:"digital content creation concept, floating words and ideas, creative mind map visual",                          label:"Content Creation",        seed:305 },
      { id:"bl6",  prompt:"hand writing in journal surrounded by autumn leaves and coffee, cozy blogging",                                 label:"Journal Writing",         seed:306 },
      { id:"bl7",  prompt:"SEO concept with magnifying glass over keywords, digital marketing, search engine",                             label:"SEO Concept",             seed:307 },
      { id:"bl8",  prompt:"editorial photography concept, magazine layout flat lay, premium content creation",                             label:"Editorial Style",         seed:308 },
      { id:"bl9",  prompt:"podcast recording setup with microphone and headphones, content creation studio",                               label:"Podcast Setup",           seed:309 },
      { id:"bl10", prompt:"video production behind the scenes, camera crew filming content, creator economy",                              label:"Video Production",        seed:310 },
      { id:"bl11", prompt:"trending topics board with colorful pins and strings, viral content planning",                                  label:"Trending Topics",         seed:311 },
      { id:"bl12", prompt:"dark mode code editor on screen with blog CMS interface, technical blogging",                                   label:"Tech Blogging",           seed:312 },
    ],
  },
  {
    id: "product",
    label: "Product Photography",
    emoji: "🛍️",
    images: [
      { id:"pr1",  prompt:"luxury skincare products on white marble with flowers, beauty photography, clean aesthetic",                    label:"Skincare Products",       seed:401 },
      { id:"pr2",  prompt:"premium smartphone floating in mid-air, tech product photography, gradient background",                         label:"Smartphone",              seed:402 },
      { id:"pr3",  prompt:"artisan coffee beans and brewing equipment flat lay, specialty coffee brand photography",                       label:"Coffee Products",         seed:403 },
      { id:"pr4",  prompt:"elegant perfume bottle with light reflections, luxury fragrance product photography",                           label:"Perfume Bottle",          seed:404 },
      { id:"pr5",  prompt:"healthy food products arranged beautifully, organic brand photography, natural colors",                         label:"Healthy Food",            seed:405 },
      { id:"pr6",  prompt:"fashion accessories flat lay, watch sunglasses wallet on textured background, lifestyle brand",                 label:"Fashion Accessories",     seed:406 },
      { id:"pr7",  prompt:"sports shoes floating with dynamic background, athletic brand product shot, energy",                            label:"Athletic Shoes",          seed:407 },
      { id:"pr8",  prompt:"eco-friendly packaging products, sustainable brand, green concept, natural materials",                          label:"Eco Packaging",           seed:408 },
      { id:"pr9",  prompt:"premium headphones on reflective surface, audio brand photography, dark dramatic lighting",                     label:"Premium Headphones",      seed:409 },
      { id:"pr10", prompt:"cookbook and cooking ingredients flat lay, food brand photography, warm kitchen tones",                         label:"Cookbook Vibes",          seed:410 },
      { id:"pr11", prompt:"high-end laptop on white background, minimalist tech product photography, Apple-style",                         label:"Laptop",                  seed:411 },
      { id:"pr12", prompt:"plant-based supplement bottles on natural wood, wellness brand photography",                                    label:"Wellness Products",       seed:412 },
    ],
  },
  {
    id: "people",
    label: "People & Portraits",
    emoji: "👤",
    images: [
      { id:"pe1",  prompt:"professional headshot of confident businesswoman in blue blazer, neutral background, 8K",                      label:"Professional Woman",      seed:501 },
      { id:"pe2",  prompt:"diverse group of young professionals smiling, team photo, inclusive workplace, warm tones",                    label:"Diverse Team",            seed:502 },
      { id:"pe3",  prompt:"entrepreneur at whiteboard presenting ideas, confident young man, startup setting",                             label:"Entrepreneur",            seed:503 },
      { id:"pe4",  prompt:"senior executive portrait, leadership and authority, dark suit, confident expression",                         label:"Senior Executive",        seed:504 },
      { id:"pe5",  prompt:"creative professional in colorful casual clothes, artist or designer portrait, natural light",                 label:"Creative Pro",            seed:505 },
      { id:"pe6",  prompt:"young woman on laptop outdoor cafe, digital nomad lifestyle, natural candid photo",                            label:"Digital Nomad",           seed:506 },
      { id:"pe7",  prompt:"speaker at conference stage with microphone, public speaking, audience in background",                         label:"Public Speaker",          seed:507 },
      { id:"pe8",  prompt:"customer service representative with headset smiling, support team, professional",                             label:"Customer Support",        seed:508 },
      { id:"pe9",  prompt:"doctor in white coat with friendly smile, healthcare professional portrait",                                    label:"Healthcare Pro",          seed:509 },
      { id:"pe10", prompt:"fitness trainer demonstrating exercise, athletic build, gym environment, motivational",                         label:"Fitness Trainer",         seed:510 },
      { id:"pe11", prompt:"tech worker coding on multiple monitors, developer portrait, night office glow",                               label:"Developer",               seed:511 },
      { id:"pe12", prompt:"chef in kitchen with professional tools, culinary arts portrait, restaurant setting",                          label:"Chef",                    seed:512 },
    ],
  },
  {
    id: "nature",
    label: "Nature & Travel",
    emoji: "🌿",
    images: [
      { id:"na1",  prompt:"misty mountain range at sunrise, dramatic golden light, epic landscape photography",                            label:"Mountain Sunrise",        seed:601 },
      { id:"na2",  prompt:"tropical beach paradise, crystal clear turquoise water, white sand, palm trees, aerial view",                  label:"Tropical Beach",          seed:602 },
      { id:"na3",  prompt:"ancient forest with sunlight filtering through tall trees, magical nature photography",                         label:"Enchanted Forest",        seed:603 },
      { id:"na4",  prompt:"northern lights aurora borealis over snowy landscape, night sky photography, colorful",                        label:"Northern Lights",         seed:604 },
      { id:"na5",  prompt:"cherry blossom trees in full bloom, japanese spring landscape, pink petals falling",                           label:"Cherry Blossom",          seed:605 },
      { id:"na6",  prompt:"desert dunes at sunset, orange golden sands, sahara landscape photography",                                    label:"Desert Sunset",           seed:606 },
      { id:"na7",  prompt:"waterfall in lush tropical rainforest, nature photography, long exposure, vibrant green",                      label:"Waterfall",               seed:607 },
      { id:"na8",  prompt:"cozy mountain cabin in snow winter, smoke from chimney, hygge concept, warm light inside",                    label:"Mountain Cabin",          seed:608 },
      { id:"na9",  prompt:"lavender fields in Provence France, purple rows, summer landscape, beautiful countryside",                     label:"Lavender Fields",         seed:609 },
      { id:"na10", prompt:"glacier and iceberg in arctic ocean, climate photography, dramatic blue tones",                                label:"Arctic Ice",              seed:610 },
      { id:"na11", prompt:"vineyard in Tuscany Italy, rolling hills, golden hour, scenic travel photography",                             label:"Tuscany Vineyard",        seed:611 },
      { id:"na12", prompt:"hot air balloon over Cappadocia Turkey at sunrise, travel photography",                                        label:"Hot Air Balloon",         seed:612 },
    ],
  },
  {
    id: "tech",
    label: "Technology & AI",
    emoji: "🤖",
    images: [
      { id:"te1",  prompt:"futuristic AI brain made of glowing neural networks, artificial intelligence concept, blue neon",              label:"AI Brain",                seed:701 },
      { id:"te2",  prompt:"holographic interface in dark room, sci-fi technology, hand touching virtual screen",                          label:"Holographic UI",          seed:702 },
      { id:"te3",  prompt:"circuit board close-up with glowing components, technology background, green and blue",                        label:"Circuit Board",           seed:703 },
      { id:"te4",  prompt:"data center with rows of servers, blue lighting, big data concept, tech photography",                          label:"Data Center",             seed:704 },
      { id:"te5",  prompt:"robot hand shaking human hand, AI collaboration concept, futuristic photography",                              label:"Human AI Handshake",      seed:705 },
      { id:"te6",  prompt:"cybersecurity concept, digital lock and shield, data protection, dark background with code",                   label:"Cybersecurity",           seed:706 },
      { id:"te7",  prompt:"blockchain network visualization, connected blocks, crypto technology concept, glowing",                       label:"Blockchain Network",      seed:707 },
      { id:"te8",  prompt:"smart city concept, aerial view of connected buildings with data streams, future tech",                        label:"Smart City",              seed:708 },
      { id:"te9",  prompt:"VR virtual reality headset concept, immersive technology, gaming and metaverse",                               label:"Virtual Reality",         seed:709 },
      { id:"te10", prompt:"machine learning concept with data patterns and algorithms, tech visualization",                               label:"Machine Learning",        seed:710 },
      { id:"te11", prompt:"autonomous self-driving car with sensors visualization, future mobility concept",                              label:"Self Driving Car",        seed:711 },
      { id:"te12", prompt:"space satellite above earth, tech and communication concept, orbital photography",                             label:"Satellite Tech",          seed:712 },
    ],
  },
  {
    id: "abstract",
    label: "Abstract & Backgrounds",
    emoji: "🎨",
    images: [
      { id:"ab1",  prompt:"fluid art with purple and gold colors, liquid paint swirls, abstract luxury background",                       label:"Liquid Gold Purple",      seed:801 },
      { id:"ab2",  prompt:"geometric low poly background, blue and teal gradient, modern abstract art",                                   label:"Geometric Low Poly",      seed:802 },
      { id:"ab3",  prompt:"neon light trails on dark background, long exposure street photography abstract",                              label:"Neon Light Trails",       seed:803 },
      { id:"ab4",  prompt:"minimalist gradient background, soft pink and lavender, clean design background",                              label:"Soft Gradient",           seed:804 },
      { id:"ab5",  prompt:"watercolor texture background, pastel colors bleeding, artistic paper texture",                                label:"Watercolor Texture",      seed:805 },
      { id:"ab6",  prompt:"dark forest bokeh background, mysterious atmosphere, blurred lights in darkness",                              label:"Dark Bokeh",              seed:806 },
      { id:"ab7",  prompt:"cosmic space nebula background, stars and galaxy, deep purple and blue universe",                              label:"Space Nebula",            seed:807 },
      { id:"ab8",  prompt:"motion blur abstract art, colorful streaks of light, dynamic energy background",                              label:"Motion Blur Art",         seed:808 },
      { id:"ab9",  prompt:"marble texture background, white and grey elegant stone, luxury design element",                              label:"White Marble",            seed:809 },
      { id:"ab10", prompt:"abstract digital waveform visualization, sound wave art, music concept, blue gradient",                       label:"Sound Wave",              seed:810 },
      { id:"ab11", prompt:"bokeh circles of light on dark background, dreamy abstract photography, colorful dots",                       label:"Bokeh Lights",            seed:811 },
      { id:"ab12", prompt:"fibonacci spiral golden ratio pattern, nature mathematics concept, golden swirl",                              label:"Golden Spiral",           seed:812 },
    ],
  },
  {
    id: "food",
    label: "Food & Lifestyle",
    emoji: "🍽️",
    images: [
      { id:"fo1",  prompt:"gourmet restaurant dish plated beautifully, fine dining photography, artistic presentation",                   label:"Fine Dining",             seed:901 },
      { id:"fo2",  prompt:"fresh ingredients on cutting board, meal prep concept, colorful vegetables and herbs",                        label:"Meal Prep",               seed:902 },
      { id:"fo3",  prompt:"breakfast in bed with pancakes and orange juice, lifestyle photography, cozy morning",                        label:"Breakfast in Bed",        seed:903 },
      { id:"fo4",  prompt:"pizza fresh from wood fired oven, Italian food photography, rustic restaurant",                               label:"Wood Fired Pizza",        seed:904 },
      { id:"fo5",  prompt:"colorful acai bowl with toppings, healthy lifestyle food photography, Instagram worthy",                      label:"Acai Bowl",               seed:905 },
      { id:"fo6",  prompt:"wine tasting at vineyard, glasses with red wine, sommelier lifestyle photography",                            label:"Wine Tasting",            seed:906 },
      { id:"fo7",  prompt:"baking bread at home, hands kneading dough, warm kitchen, artisan baker lifestyle",                          label:"Artisan Baking",          seed:907 },
      { id:"fo8",  prompt:"sushi platter arrangement, Japanese cuisine photography, fresh fish and rice, elegant",                       label:"Sushi Platter",           seed:908 },
      { id:"fo9",  prompt:"hot chocolate and marshmallows on wooden table, cozy winter lifestyle, hygge concept",                       label:"Hot Chocolate",           seed:909 },
      { id:"fo10", prompt:"farmers market vegetables and fruits, organic produce, outdoor market photography",                           label:"Farmers Market",          seed:910 },
      { id:"fo11", prompt:"chocolate dessert photography, dark chocolate cake with ganache, luxury patisserie",                          label:"Chocolate Dessert",       seed:911 },
      { id:"fo12", prompt:"outdoor bbq party, grill with steaks and vegetables, summer gathering lifestyle",                             label:"BBQ Party",               seed:912 },
    ],
  },
  {
    id: "education",
    label: "Education & Learning",
    emoji: "🎓",
    images: [
      { id:"ed1",  prompt:"university campus exterior, classic architecture with students, academic photography",                         label:"University Campus",       seed:1001 },
      { id:"ed2",  prompt:"student studying with books and laptop, academic focus, library setting",                                     label:"Studying Hard",           seed:1002 },
      { id:"ed3",  prompt:"virtual classroom online learning concept, e-learning platform interface",                                    label:"Online Learning",         seed:1003 },
      { id:"ed4",  prompt:"teacher explaining on whiteboard to engaged students, classroom education",                                   label:"Classroom Teaching",      seed:1004 },
      { id:"ed5",  prompt:"stack of books with graduation cap, academic achievement concept, gold tones",                                label:"Graduation",              seed:1005 },
      { id:"ed6",  prompt:"brain with gears and light bulb concept, learning and creativity, education illustration",                   label:"Creative Learning",       seed:1006 },
      { id:"ed7",  prompt:"children doing science experiment in lab, STEM education photography, colorful",                              label:"STEM Learning",           seed:1007 },
      { id:"ed8",  prompt:"coding bootcamp, young developers at computers, programming education",                                       label:"Coding Bootcamp",         seed:1008 },
      { id:"ed9",  prompt:"online course completion certificate concept, achievement and skills learning",                               label:"Certificate Achievement", seed:1009 },
      { id:"ed10", prompt:"mentorship concept, experienced professional guiding young student, career development",                      label:"Mentorship",              seed:1010 },
      { id:"ed11", prompt:"library with globe and antique books, knowledge exploration concept",                                         label:"Knowledge Globe",         seed:1011 },
      { id:"ed12", prompt:"tablet with educational app for kids, interactive learning, colorful interface",                              label:"Kids Learning App",       seed:1012 },
    ],
  },
];

// ── Image card with lazy load ──────────────────────────────────
function ImageCard({ item, onView }: { item: ImageItem; onView: (item: ImageItem) => void }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = pollinationsUrl(item.prompt, item.seed, 512, 384);

  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const download = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a"); a.href = url; a.download = `${item.label.replace(/\s+/g, "-").toLowerCase()}.jpg`; a.target="_blank"; a.click();
  };

  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/8 cursor-pointer aspect-[4/3]"
      onClick={() => onView(item)}>
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/20">
          <ImageIcon className="w-8 h-8" />
          <span className="text-xs">Failed to load</span>
        </div>
      ) : (
        <img src={url} alt={item.label} className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)} onError={() => { setLoaded(true); setError(true); }} loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 gap-2">
        <p className="text-white text-xs font-semibold leading-snug">{item.label}</p>
        <div className="flex gap-2">
          <button onClick={copyUrl} className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white hover:bg-black/70 transition-colors">
            {copied ? <><Check className="w-3 h-3 text-green-400"/> Copied</> : <><Copy className="w-3 h-3"/> Copy URL</>}
          </button>
          <button onClick={download} className="flex items-center gap-1 px-2 py-1 bg-violet-500/70 backdrop-blur-sm rounded-lg text-xs text-white hover:bg-violet-500 transition-colors">
            <Download className="w-3 h-3"/> Save
          </button>
        </div>
      </div>
      {loaded && !error && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </motion.div>
  );
}

// ── Lightbox ───────────────────────────────────────────────────
function Lightbox({ item, onClose }: { item: ImageItem; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(item.prompt);
  const [currentSeed, setCurrentSeed] = useState(item.seed);
  const [url, setUrl] = useState(pollinationsUrl(item.prompt, item.seed, 1024, 768));
  const [loading, setLoading] = useState(false);

  const regenerate = () => {
    const newSeed = Math.floor(Math.random() * 99999);
    setCurrentSeed(newSeed);
    setLoading(true);
    setUrl(pollinationsUrl(customPrompt, newSeed, 1024, 768));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0d0d1f] border border-white/10 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <div>
            <h3 className="text-white font-bold">{item.label}</h3>
            <p className="text-white/35 text-xs">AI-Generated Image</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
        </div>
        <div className="flex flex-col md:flex-row flex-1 overflow-auto">
          <div className="flex-1 flex items-center justify-center p-4 min-h-64 bg-black/20">
            <img src={url} alt={item.label} className="max-w-full max-h-[50vh] object-contain rounded-xl"
              onLoad={() => setLoading(false)} onError={() => setLoading(false)} />
          </div>
          <div className="md:w-72 p-5 space-y-4 border-t md:border-t-0 md:border-l border-white/8">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Edit Prompt</label>
              <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs leading-relaxed resize-none focus:outline-none focus:border-violet-500/40 transition-colors" rows={5}
                value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} />
            </div>
            <button onClick={regenerate} disabled={loading} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
              {loading ? "Generating…" : "Regenerate"}
            </button>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex-1 py-2 border border-white/10 hover:border-white/25 rounded-xl text-xs text-white/60 hover:text-white flex items-center justify-center gap-1.5 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400"/> : <Copy className="w-3.5 h-3.5"/>} {copied ? "Copied!" : "Copy URL"}
              </button>
              <a href={url} download target="_blank" rel="noreferrer"
                className="flex-1 py-2 border border-white/10 hover:border-white/25 rounded-xl text-xs text-white/60 hover:text-white flex items-center justify-center gap-1.5 transition-colors">
                <Download className="w-3.5 h-3.5"/> Download
              </a>
            </div>
            <div className="pt-2 border-t border-white/8">
              <p className="text-xs font-medium text-white/40 mb-2">Copy prompt to use in AI tools:</p>
              <button onClick={() => navigator.clipboard.writeText(customPrompt)} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-white/60 hover:text-white flex items-center justify-center gap-2 transition-colors border border-white/8">
                <ExternalLink className="w-3 h-3"/> Copy Image Prompt
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function ImageLibrary({ embedded = false }: { embedded?: boolean } = {}) {
  const [activeCat, setActiveCat] = useState("business");
  const [search, setSearch] = useState("");
  const [lightboxItem, setLightboxItem] = useState<ImageItem | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");

  const generateCustom = () => {
    if (!customPrompt.trim()) return;
    setGenerating(true);
    const seed = Math.floor(Math.random() * 99999);
    const url = pollinationsUrl(customPrompt, seed, 1024, 768);
    setGeneratedUrl(url);
    setTimeout(() => setGenerating(false), 3000);
  };

  const currentCat = CATEGORIES.find(c => c.id === activeCat) || CATEGORIES[0];
  const filteredImages = search
    ? CATEGORIES.flatMap(c => c.images).filter(img => img.label.toLowerCase().includes(search.toLowerCase()) || img.prompt.toLowerCase().includes(search.toLowerCase()))
    : currentCat.images;

  const totalImages = CATEGORIES.reduce((sum, c) => sum + c.images.length, 0);

  const Wrapper = ({ children }: { children: React.ReactNode }) => embedded
    ? <div className="relative z-10"><div className="max-w-8xl mx-auto px-4">{children}</div></div>
    : (
      <section id="image-library" className="py-24 border-t border-white/5 bg-white/[0.01] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-[180px] pointer-events-none"/>
        <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[150px] pointer-events-none"/>
        <div className="container px-4 mx-auto max-w-8xl relative z-10">{children}</div>
      </section>
    );

  return (
    <Wrapper>
      <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-sm font-medium mb-6">
            <ImageIcon className="w-3.5 h-3.5 mr-2"/> {totalImages}+ Free AI Images
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Image <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">Library</span>
          </h2>
          <p className="text-lg text-white/45">Browse, regenerate, and download stunning AI-generated images for your content — completely free.</p>
        </div>

        {/* Custom generator */}
        <div className="max-w-2xl mx-auto mb-10 p-5 rounded-2xl border border-white/10 bg-white/[0.03]">
          <p className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-400"/> Generate Custom Image</p>
          <div className="flex gap-3">
            <input className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 transition-colors"
              placeholder="Describe any image you want to generate…"
              value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateCustom()} />
            <button onClick={generateCustom} disabled={!customPrompt.trim() || generating}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-white text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap">
              {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
              Generate
            </button>
          </div>
          {generatedUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
              <img src={generatedUrl} alt="Custom generated" className="w-full max-h-72 object-cover" onLoad={() => setGenerating(false)} />
              <div className="flex gap-2 p-3 border-t border-white/8">
                <button onClick={() => navigator.clipboard.writeText(generatedUrl)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors">
                  <Copy className="w-3 h-3"/> Copy URL
                </button>
                <a href={generatedUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg text-xs text-violet-300 transition-colors">
                  <Download className="w-3 h-3"/> Download
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"/>
            <input className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-5 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-500/40 transition-colors"
              placeholder="Search images…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${activeCat === cat.id ? "bg-pink-500/20 border-pink-500/50 text-pink-300" : "border-white/10 text-white/50 hover:text-white hover:border-white/20 bg-white/5"}`}>
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Category heading */}
        {!search && (
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white">{currentCat.emoji} {currentCat.label}</h3>
            <p className="text-white/30 text-sm">{currentCat.images.length} images — hover to copy or download</p>
          </div>
        )}
        {search && (
          <p className="text-center text-white/35 text-sm mb-6">{filteredImages.length} images matching "{search}"</p>
        )}

        {/* Image grid */}
        <AnimatePresence mode="wait">
          <motion.div key={activeCat + search} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filteredImages.map(img => (
              <ImageCard key={img.id} item={img} onView={setLightboxItem} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredImages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30">No images found for "{search}"</p>
            <button onClick={() => setSearch("")} className="mt-2 text-pink-400 text-sm hover:underline">Clear search</button>
          </div>
        )}

        <p className="text-center text-white/15 text-xs mt-10">All images generated by Pollinations.ai • Free to use • Click any image to edit & regenerate</p>

      <AnimatePresence>{lightboxItem && <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />}</AnimatePresence>
    </Wrapper>
  );
}
