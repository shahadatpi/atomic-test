"use client";

import { useEffect, useState, useRef } from "react";
import { X, Download, Loader2, AlertTriangle, RefreshCw, Code, Bug } from "lucide-react";
import type { SelectedProblem } from "../types";
import type { PaperFormat } from "./PaperFormatPanel";

interface Props {
  selected: SelectedProblem[];
  format:   PaperFormat;
  onClose:  () => void;
}

type Status  = "loading" | "ready" | "error";
type SideTab = "none" | "latex" | "debug";

export default function PaperPreview({ selected, format, onClose }: Props) {
  const [status,   setStatus]   = useState<Status>("idle" as any);
  const [pdfUrl,   setPdfUrl]   = useState<string | null>(null);
  const [error,    setError]    = useState<string>("");
  const [slow,     setSlow]     = useState(false);
  const [sideTab,  setSideTab]  = useState<SideTab>("none");
  const [sideText, setSideText] = useState<string>("");
  const blobRef = useRef<Blob | null>(null);
  const filename = `${format.examTitle || "question-paper"}.pdf`;

  const body = () => JSON.stringify({ problems: selected, format });

  const generate = async () => {
    setStatus("loading" as Status);
    setError(""); setSlow(false); setSideTab("none");
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }

    const t = setTimeout(() => setSlow(true), 8000);
    try {
      const res = await fetch("/api/generate-paper", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: body(), signal: AbortSignal.timeout(180_000),
      });
      clearTimeout(t); setSlow(false);
      if (!res.ok) { setError(await res.text()); setStatus("error"); return; }
      const blob = await res.blob();
      blobRef.current = blob;
      setPdfUrl(URL.createObjectURL(blob));
      setStatus("ready");
    } catch (e) {
      clearTimeout(t); setSlow(false);
      setError(String(e)); setStatus("error");
    }
  };

  const openSide = async (tab: SideTab) => {
    if (sideTab === tab) { setSideTab("none"); return; }
    setSideTab(tab); setSideText("লোড হচ্ছে…");
    try {
      const endpoint = tab === "latex"
        ? "/api/generate-paper?latex=1"
        : "/api/generate-paper?debug=1";
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: body(),
      });
      const text = await res.text();
      setSideText(tab === "debug" ? JSON.stringify(JSON.parse(text), null, 2) : text);
    } catch (e) { setSideText(String(e)); }
  };

  const download = () => {
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => { generate(); }, []);

  const cqCount  = selected.filter(p => !p.problem_type?.includes("mcq")).length;
  const mcqCount = selected.filter(p =>  p.problem_type?.includes("mcq")).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold">{format.examTitle || "প্রশ্নপত্র"}</p>
            <p className="text-xs text-muted-foreground">
              {selected.length} প্রশ্ন — {cqCount} CQ · {mcqCount} MCQ · {format.time}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => openSide("debug")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${sideTab === "debug" ? "border-amber-400/50 text-amber-400 bg-amber-400/10" : "border-border text-muted-foreground hover:bg-accent/50"}`}>
            <Bug className="w-3.5 h-3.5" /> ডিবাগ
          </button>
          <button onClick={() => openSide("latex")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${sideTab === "latex" ? "border-emerald-400/50 text-emerald-400 bg-emerald-400/10" : "border-border text-muted-foreground hover:bg-accent/50"}`}>
            <Code className="w-3.5 h-3.5" /> LaTeX
          </button>
          {(status as string) === "error" && (
            <button onClick={generate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent/50 text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" /> আবার চেষ্টা
            </button>
          )}
          <button onClick={download} disabled={(status as string) !== "ready"}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors">
            <Download className="w-4 h-4" /> ডাউনলোড
          </button>
        </div>
      </div>

      {/* Body — PDF + optional side panel */}
      <div className="flex-1 overflow-hidden flex">

        {/* Main area */}
        <div className="flex-1 relative overflow-hidden">
          {(status as string) === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{slow ? "Question কম্পাইল হচ্ছে…" : "প্রশ্নপত্র তৈরি হচ্ছে…"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {slow ? "একটু অপেক্ষা করুন" : `${selected.length}টি প্রশ্ন`}
                </p>
              </div>
            </div>
          )}

          {(status as string) === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-background overflow-auto">
              <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium">PDF তৈরি করতে সমস্যা</p>
                </div>
                <pre className="bg-card border border-red-400/20 rounded-xl p-4 text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto max-h-72 font-mono">
                  {error}
                </pre>
                <p className="text-xs text-muted-foreground">
                  → "ডিবাগ" বাটনে ক্লিক করুন — server কী receive করছে দেখুন
                </p>
              </div>
            </div>
          )}

          {(status as string) === "ready" && pdfUrl && (
            <iframe src={`${pdfUrl}#toolbar=1&view=FitH`}
              className="w-full h-full border-0" title="PDF Preview" />
          )}
        </div>

        {/* Side panel — LaTeX source or debug JSON */}
        {sideTab !== "none" && (
          <div className="w-[480px] flex-shrink-0 border-l border-border bg-zinc-950 overflow-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-border px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                {sideTab === "debug" ? "Server receives (JSON)" : "Generated LaTeX source"}
              </span>
              <button onClick={() => setSideTab("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300 whitespace-pre leading-relaxed overflow-x-auto">
              {sideText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
