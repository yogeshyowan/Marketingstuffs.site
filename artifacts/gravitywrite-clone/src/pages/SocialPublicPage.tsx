import { useParams } from "wouter";
import { SocialPageRenderer, SOCIAL_PAGE_KEY, defaultPage } from "@/components/SocialPageTab";
import type { SocialPageData } from "@/components/SocialPageTab";
import { Zap } from "lucide-react";

function loadPage(): SocialPageData {
  try { const s = localStorage.getItem(SOCIAL_PAGE_KEY); return s ? JSON.parse(s) : defaultPage(); }
  catch { return defaultPage(); }
}

export default function SocialPublicPage() {
  const { username } = useParams<{ username: string }>();
  const page = loadPage();

  // If username doesn't match stored page, show a generic not-found within the page style
  const isMatch = !username || username === page.username;

  if (!isMatch) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">😕</div>
        <h1 className="text-white text-xl font-bold">Page not found</h1>
        <p className="text-slate-400 text-sm">@{username} hasn't created their page yet.</p>
        <a href="/" className="flex items-center gap-2 mt-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
          <Zap className="w-4 h-4"/> Create your own page
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SocialPageRenderer page={page}/>
    </div>
  );
}
