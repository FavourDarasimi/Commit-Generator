"use client";
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Copy,
  Github,
  Moon,
  Sun,
  BookOpen,
  Cpu,
  LifeBuoy,
} from "lucide-react";

interface CommitResult {
  commitMessage: string;
  body: string;
  alternatives: string[];
}

export default function CommitGen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [changes, setChanges] = useState("");
  const [gitDiff, setGitDiff] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleGenerate = async () => {
    const hasDescription = changes.trim();
    const hasDiff = gitDiff.trim();

    if (!hasDescription && !hasDiff) {
      setError("Please describe your changes or paste a git diff");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changes: changes.trim(),
          gitDiff: gitDiff.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate commit message");
      }

      setResult(data);
    } catch (err: any) {
      setError("AI Service not available");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  const handleClear = () => {
    setChanges("");
    setGitDiff("");
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0c10] text-slate-800 dark:text-slate-300 font-sans p-4 md:p-8 transition-colors">
      {/* Navigation */}
      <nav className="flex items-center justify-between max-w-7xl mx-auto mb-16">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Github className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
            CommitGen
          </span>
        </div>
        {/* <div className="flex items-center gap-4">
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? (
              <Sun className="w-5 h-5 text-slate-400 hover:text-slate-200" />
            ) : (
              <Moon className="w-5 h-5 text-slate-400 hover:text-slate-200" />
            )}
          </button>
        </div> */}
      </nav>

      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 relative">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Generate clean Git commit messages
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Turn your diffs into conventional commits in seconds.
          </p>
          <div className="absolute top-0 right-0 hidden md:flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            AI Powered
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-[#11141b] border border-gray-300 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-[#161b22] border-b border-gray-300 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Git Diff
                  </span>
                </div>
                <code className="text-xs bg-gray-200 dark:bg-slate-800/50 px-2 py-1 rounded text-slate-700 dark:text-slate-400">
                  git diff / git diff --cached
                </code>
              </div>
              <div className="p-4 min-h-100">
                <textarea
                  value={gitDiff}
                  onChange={(e) => setGitDiff(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full h-100 bg-transparent border-none focus:ring-0 text-sm font-mono text-slate-700 dark:text-slate-400 resize-none leading-relaxed outline-none scrollbar-hide placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="paste your git diff here... Example: diff --git a/src/main.js b/src/main.js ..."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Controls & Result */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-slate-900 dark:text-slate-300">
                Describe Your Changes{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                onChange={(e) => setChanges(e.target.value)}
                onKeyDown={handleKeyPress}
                value={changes}
                className="w-full bg-white dark:bg-[#11141b] border border-gray-300 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-900 dark:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                rows={4}
                placeholder="e.g. Fixing the login bug on the dashboard..."
              />
              <p className="mt-2 text-xs text-slate-500">
                Add context to help the AI generate a more accurate message.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={handleGenerate}
                className="flex-1 bg-blue-600 disabled:bg-blue-600/50 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Analyzing Changes..." : "Generate"}
              </button>
              <button
                onClick={handleClear}
                className="px-8 py-3 rounded-xl border border-gray-300 dark:border-slate-800 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-slate-900 dark:text-white"
              >
                Clear
              </button>
            </div>

            <div className="relative pt-6">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-300 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 dark:bg-[#0a0c10] px-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Result
                </span>
              </div>
            </div>

            {/* Generated Message Card */}
            <div className="bg-white dark:bg-[#11141b] border-2 border-blue-200 dark:border-blue-500/20 rounded-xl relative group overflow-hidden shadow-lg">
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

              <div className="bg-blue-50 dark:bg-[#191e28] p-4">
                {result ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <div className="w-5 h-5 rounded-full border-2 border-green-600 dark:border-green-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Generated Message
                      </span>
                    </div>
                    <Copy
                      onClick={() => copyToClipboard(result.commitMessage, 0)}
                      className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Result
                  </span>
                )}
              </div>

              <div className="font-mono text-sm space-y-4 text-slate-800 dark:text-slate-300 relative z-10 p-6">
                <div>
                  {result ? (
                    <div>
                      <div className="code-block">
                        <code className="text-green-700 dark:text-green-300 text-sm block whitespace-pre-wrap">
                          {result.commitMessage}
                        </code>
                      </div>
                      {result.body && (
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-700">
                          <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                            {result.body}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300 text-center">
                      Generated Messages will appear here
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-24 pt-8 border-t border-gray-300 dark:border-slate-900 flex justify-center gap-4 text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-slate-400 dark:border-slate-700 flex items-center justify-center text-[8px]">
            !
          </div>
          Built for developers
        </div>
      </footer>
    </div>
  );
}
