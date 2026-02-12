"use client";

import { useState, useEffect } from "react";
import { useSession } from "./session-provider";
import { Button } from "@/components/ui/button";
import { importLocalCheckIns } from "@/lib/checkins-api";
import { Upload, X } from "lucide-react";

const STORAGE_KEY = "anchor-psych-checkins";
const DISMISSED_KEY = "anchor-import-dismissed";

export function LocalStorageImportBanner() {
  const { user } = useSession();
  const [hasLocal, setHasLocal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<{ imported: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user?.role !== "ATHLETE") return;
    if (localStorage.getItem(DISMISSED_KEY)) {
      setDismissed(true);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasLocal(true);
        }
      }
    } catch {
      // ignore
    }
  }, [user]);

  if (!hasLocal || dismissed || result) return null;

  const handleImport = async () => {
    setImporting(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const checkIns = JSON.parse(raw);
      const res = await importLocalCheckIns(checkIns);
      setResult(res);
      // Clear localStorage after successful import
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(DISMISSED_KEY, "true");
      // Notify components to refresh
      window.dispatchEvent(new CustomEvent("anchor-checkin-saved"));
    } catch {
      // ignore
    } finally {
      setImporting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
      <Upload className="h-4 w-4 shrink-0 text-blue-600" />
      <p className="flex-1 text-blue-800">
        Found existing check-ins in this browser. Import them to your account?
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={handleImport}
        disabled={importing}
      >
        {importing ? "Importing..." : "Import"}
      </Button>
      <button
        onClick={handleDismiss}
        className="text-blue-400 hover:text-blue-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
