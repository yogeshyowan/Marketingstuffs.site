import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Loader2, Download, RefreshCw, Layers, AlertCircle, CheckCircle2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    CCEverywhere: {
      initialize: (config: {
        clientId: string;
        appName: string;
        appVersion?: { major: number; minor: number };
        platformCategory?: string;
      }) => Promise<{
        editor: CCEditor;
        module: unknown;
        quickAction: unknown;
      }>;
    };
  }
}

interface CCEditor {
  create: (opts: CCCreateOptions) => void;
  createWithAsset: (opts: CCCreateWithAssetOptions) => void;
  edit: (opts: CCEditOptions) => void;
}

interface CCPublishParams {
  asset: { data: string; dataType: string; type: string };
  exportButtonId: string;
}

interface CCCreateOptions {
  callbacks: {
    onPublish?: (intent: string, params: CCPublishParams) => void;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
    onLoadStart?: () => void;
    onLoad?: () => void;
  };
  outputParams?: { outputType: "base64" | "url" };
  inputParams?: {
    templateType?: string;
    canvasSize?: { width: number; height: number; unit: string };
  };
}

interface CCCreateWithAssetOptions extends CCCreateOptions {
  inputParams: CCCreateOptions["inputParams"] & {
    asset: { data: string; dataType: string; type: string };
  };
}

interface CCEditOptions extends CCCreateOptions {
  inputParams: {
    asset: { data: string; dataType: string; type: string };
  };
}

interface AdobeExpressEditorProps {
  brandName: string;
  productName: string;
  headline: string;
  tagline: string;
  platform: string;
  objective: string;
  generatedImageBase64?: string | null;
  onExport?: (dataUrl: string) => void;
}

type SDKState = "idle" | "loading" | "ready" | "error" | "no-key" | "editor-open";

// ── Platform canvas sizes ──────────────────────────────────────────────────────

const PLATFORM_SIZES: Record<string, { w: number; h: number; label: string }> = {
  Instagram:  { w: 1080, h: 1080, label: "1080 × 1080 (Square)" },
  TikTok:     { w: 1080, h: 1920, label: "1080 × 1920 (Vertical)" },
  Facebook:   { w: 1200, h: 628,  label: "1200 × 628 (Landscape)" },
  YouTube:    { w: 1920, h: 1080, label: "1920 × 1080 (Banner)" },
  LinkedIn:   { w: 1200, h: 627,  label: "1200 × 627 (Feed)" },
  "X (Twitter)": { w: 1200, h: 675, label: "1200 × 675 (Feed)" },
};

const TEMPLATE_TYPES: Record<string, string> = {
  product:     "social_media",
  sale:        "sale_promotion",
  awareness:   "brand",
  event:       "event",
  service:     "service",
  testimonial: "social_media",
};

// ── SDK loader ─────────────────────────────────────────────────────────────────

let sdkPromise: Promise<void> | null = null;

function loadAdobeSDK(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.CCEverywhere) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Adobe Express SDK"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AdobeExpressEditor({
  brandName,
  productName,
  headline,
  tagline,
  platform,
  objective,
  generatedImageBase64,
  onExport,
}: AdobeExpressEditorProps) {
  const [sdkState, setSdkState] = useState<SDKState>("idle");
  const [editor, setEditor] = useState<CCEditor | null>(null);
  const [exportedImage, setExportedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const clientId = import.meta.env.VITE_ADOBE_CLIENT_ID as string | undefined;
  const hasKey = Boolean(clientId);

  // ── Init SDK ───────────────────────────────────────────────────────────────

  const initSDK = useCallback(async () => {
    if (!hasKey) { setSdkState("no-key"); return; }
    setSdkState("loading");
    try {
      await loadAdobeSDK();
      const { editor: ed } = await window.CCEverywhere.initialize({
        clientId: clientId!,
        appName: "Marketingstuffs",
        platformCategory: "web",
      });
      setEditor(ed);
      setSdkState("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "SDK initialization failed");
      setSdkState("error");
    }
  }, [clientId, hasKey]);

  useEffect(() => {
    if (hasKey) { initSDK(); }
    else { setSdkState("no-key"); }
  }, [hasKey, initSDK]);

  // ── Open editor ────────────────────────────────────────────────────────────

  const openEditor = useCallback(() => {
    if (!editor) return;
    setSdkState("editor-open");

    const size = PLATFORM_SIZES[platform] ?? { w: 1080, h: 1080 };
    const templateType = TEMPLATE_TYPES[objective] ?? "social_media";

    const callbacks: CCCreateOptions["callbacks"] = {
      onPublish: (_intent, params) => {
        const dataUrl = `data:${params.asset.type};base64,${params.asset.data}`;
        setExportedImage(dataUrl);
        setSdkState("ready");
        onExport?.(dataUrl);
      },
      onCancel: () => setSdkState("ready"),
      onError: (err) => {
        setErrorMsg(String(err));
        setSdkState("error");
      },
    };

    const outputParams = { outputType: "base64" as const };

    // If AI already generated an image, open with it as background
    if (generatedImageBase64) {
      editor.createWithAsset({
        inputParams: {
          asset: {
            data: generatedImageBase64.replace(/^data:image\/\w+;base64,/, ""),
            dataType: "base64",
            type: "image/png",
          },
          canvasSize: { width: size.w, height: size.h, unit: "px" },
          templateType,
        },
        callbacks,
        outputParams,
      });
    } else {
      editor.create({
        inputParams: {
          canvasSize: { width: size.w, height: size.h, unit: "px" },
          templateType,
        },
        callbacks,
        outputParams,
      });
    }
  }, [editor, platform, objective, generatedImageBase64, onExport]);

  // ── Download helper ────────────────────────────────────────────────────────

  const downloadExport = () => {
    if (!exportedImage) return;
    const a = document.createElement("a");
    a.href = exportedImage;
    a.download = `${brandName || "ad"}-adobe-express.png`;
    a.click();
  };

  // ── No key state ───────────────────────────────────────────────────────────

  if (sdkState === "no-key") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#FF0000] to-[#FF6A00] p-2.5 shrink-0">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-1">Adobe Express Editor</h3>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Open a full drag-and-drop design editor — templates, photos, brand kits — without leaving this page. Export your finished design back here in one click.
            </p>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
              <div className="flex gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-300 font-medium">Setup required — takes 2 minutes</p>
              </div>
              <ol className="space-y-1.5 text-xs text-amber-200/80 ml-6 list-decimal">
                <li>Go to <strong>developer.adobe.com/console</strong></li>
                <li>Create a new project → Add API → <strong>Adobe Express Embed API</strong></li>
                <li>Add your Replit domain to allowed origins</li>
                <li>Copy your <strong>Client ID</strong></li>
                <li>Add it as <code className="bg-white/10 px-1 py-0.5 rounded">VITE_ADOBE_CLIENT_ID</code> in your Replit Secrets</li>
              </ol>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white/70 hover:text-white"
              onClick={() => window.open("https://developer.adobe.com/console", "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open Adobe Developer Console
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (sdkState === "error") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-sm font-medium text-red-300">Adobe Express failed to load</p>
        </div>
        <p className="text-xs text-red-400/80 mb-3 ml-6">{errorMsg}</p>
        <Button size="sm" variant="outline" className="ml-6 border-red-500/30 text-red-300" onClick={initSDK}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────

  const size = PLATFORM_SIZES[platform] ?? { w: 1080, h: 1080 };
  const isLoading = sdkState === "loading";
  const isEditorOpen = sdkState === "editor-open";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-[#FF0000] to-[#FF6A00] p-1.5">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Adobe Express Editor</p>
            <p className="text-xs text-white/50">{size.label ?? `${size.w} × ${size.h}`} · {platform}</p>
          </div>
        </div>
        {sdkState === "ready" && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ready
          </span>
        )}
        {isLoading && (
          <span className="flex items-center gap-1.5 text-xs text-white/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading SDK…
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">

        {/* Context summary */}
        {(headline || brandName) && (
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">Will be pre-loaded</p>
            <div className="grid grid-cols-2 gap-2">
              {headline && (
                <div>
                  <p className="text-[10px] text-white/40 mb-0.5">Headline</p>
                  <p className="text-sm text-white font-medium truncate">{headline}</p>
                </div>
              )}
              {tagline && (
                <div>
                  <p className="text-[10px] text-white/40 mb-0.5">Tagline</p>
                  <p className="text-sm text-white/80 truncate">{tagline}</p>
                </div>
              )}
              {brandName && (
                <div>
                  <p className="text-[10px] text-white/40 mb-0.5">Brand</p>
                  <p className="text-sm text-white/80 truncate">{brandName}</p>
                </div>
              )}
              {generatedImageBase64 && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-xs text-emerald-300">AI image included</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Open Editor button */}
        <Button
          className="w-full bg-gradient-to-r from-[#FF0000] to-[#FF6A00] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          onClick={openEditor}
          disabled={isLoading || isEditorOpen || sdkState !== "ready"}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading Adobe Express…</>
          ) : isEditorOpen ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Editor is open — check popup</>
          ) : (
            <><Wand2 className="h-4 w-4 mr-2" /> Open in Adobe Express Editor</>
          )}
        </Button>

        <p className="text-xs text-white/40 text-center">
          Opens a full design editor in a new panel · Save to export back here
        </p>

        {/* Exported result */}
        <AnimatePresence>
          {exportedImage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="rounded-lg overflow-hidden border border-white/10">
                <img src={exportedImage} alt="Adobe Express export" className="w-full object-contain max-h-64" />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={downloadExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Adobe Express Design
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-white/50 hover:text-white"
                onClick={openEditor}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Edit again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
