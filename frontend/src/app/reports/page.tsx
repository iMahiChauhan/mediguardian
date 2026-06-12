"use client";

import { useState } from "react";
import Link from "next/link";

interface Metric {
  metric: string;
  value: string;
  status: "NORMAL" | "HIGH" | "ELEVATED" | "UNKNOWN";
  recommendation: string;
}

interface ReportResponse {
  filename: string;
  extracted_metrics: Metric[];
}

export default function ReportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadReport = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("mediguardian_token");
      const res = await fetch("http://localhost:8000/api/reports/analyze", {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload Failed: ${res.statusText}`);
      }

      const data: ReportResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to process the medical report.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "HIGH" || status === "ELEVATED") return "bg-red-50 text-red-700 border-red-200";
    if (status === "NORMAL") return "bg-green-50 text-green-700 border-green-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Medical <span className="text-primary">Reports OCR</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Upload your PDF lab reports. Our AI will extract the parameters and interpret the results for you.
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-white p-8 shadow-sm">
        <label className="block text-sm font-semibold mb-2">Upload Lab Report (PDF)</label>
        
        <div className="mt-2 flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-10">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
            <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary hover:text-primary/80">
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-gray-600 mt-1">{file ? file.name : "PDF up to 10MB"}</p>
          </div>
        </div>

        <button 
          onClick={uploadReport}
          disabled={!file || loading}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Analyzing Document..." : "Analyze Report"}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Upload Error</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-xl font-bold">Extracted Metrics from {result.filename}</h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.extracted_metrics.map((m, idx) => (
              <div key={idx} className={`rounded-xl border p-5 ${getStatusStyle(m.status)}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm opacity-80">{m.metric}</h4>
                  <span className="inline-flex rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
                    {m.status}
                  </span>
                </div>
                <div className="text-3xl font-extrabold mb-4">{m.value}</div>
                <p className="text-sm font-medium opacity-90 border-t border-black/10 pt-3">
                  {m.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
