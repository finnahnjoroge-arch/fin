"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

interface ListingGenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (title: string, highlights: string, descriptionHtml: string) => void;
}

function textToHtml(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      if (line.startsWith("H1:")) return `<h1>${line.replace(/^H1:\s*/, "")}</h1>`;
      if (line.startsWith("H2:")) return `<h2>${line.replace(/^H2:\s*/, "")}</h2>`;
      if (line.startsWith("H3:")) return `<h3>${line.replace(/^H3:\s*/, "")}</h3>`;
      if (/^[•\-*]\s+/.test(line)) return `<p>${line}</p>`;
      return `<p>${line}</p>`;
    })
    .join("\n");
}

export default function ListingGenModal({
  open,
  onOpenChange,
  onInsert,
}: ListingGenModalProps) {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    title: string;
    highlights: string;
    description: string;
  } | null>(null);

  const generate = async () => {
    if (!raw.trim()) {
      setError("Please paste a WhatsApp message first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawMessage: raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!result) return;
    onInsert(result.title, result.highlights, textToHtml(result.description));
    setRaw("");
    setResult(null);
    setError("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setRaw("");
    setResult(null);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-amber-700/40 bg-[#FFFCF8] p-0 dark:border-amber-700/40 dark:bg-[#1A1612]">
        {/* Header */}
        <DialogHeader className="border-b border-amber-700/30 bg-[#1A1612] px-6 pb-4 pt-5 dark:bg-[#0F0D0A]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-lg text-[#1A1612]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-base font-bold text-white">
                ListingGen AI
              </DialogTitle>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-white/40">
                WhatsApp → Product Fields
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-500">
              Raw WhatsApp Message
            </label>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste your WhatsApp broadcast message here…"
              rows={5}
              className="w-full rounded-lg border border-amber-900/20 bg-amber-50/40 px-3 py-2.5 font-mono text-sm leading-relaxed outline-none transition-colors focus:border-amber-600 focus:ring-1 focus:ring-amber-600 dark:border-amber-700/30 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <Button
            onClick={generate}
            disabled={loading}
            className="w-full bg-amber-600 text-[#1A1612] hover:bg-amber-500 disabled:bg-amber-600/40"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Listing
              </>
            )}
          </Button>

          {/* Preview */}
          {result && (
            <div className="space-y-3 pt-1">
              <div className="overflow-hidden rounded-lg border border-amber-900/15 dark:border-amber-700/30">
                <div className="bg-[#1A1612] px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-500">
                  Name
                </div>
                <div className="bg-white px-3 py-2.5 text-sm font-bold text-[#1A1612] dark:bg-neutral-900 dark:text-white">
                  {result.title}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-amber-900/15 dark:border-amber-700/30">
                <div className="bg-[#1A1612] px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-500">
                  Key Features
                </div>
                <div className="whitespace-pre-wrap bg-white px-3 py-2.5 text-sm text-[#1A1612] dark:bg-neutral-900 dark:text-white">
                  {result.highlights}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-amber-900/15 dark:border-amber-700/30">
                <div className="bg-[#1A1612] px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-500">
                  Description
                </div>
                <div className="whitespace-pre-wrap bg-white px-3 py-2.5 text-sm text-[#1A1612] dark:bg-neutral-900 dark:text-white">
                  {result.description}
                </div>
              </div>

              <Button
                onClick={handleInsert}
                className="w-full bg-emerald-700 text-white hover:bg-emerald-600"
              >
                Insert into Form Fields
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
