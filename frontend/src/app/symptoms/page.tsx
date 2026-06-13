"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

interface Condition {
  name: string;
  confidence: number;
  severity: Severity;
  recommended_specialist: string;
}

interface SymptomResponse {
  conditions: Condition[];
  is_emergency: boolean;
  emergency_message: string | null;
}

export default function SymptomsPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("mediguardian_token");
      if (!token) return;
      try {
        const data = await apiFetch<{ id: number }>("/api/auth/me");
        setUserId(data.id);
      } catch (e) {}
    };
    fetchUser();
  }, []);

  const analyzeSymptoms = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiFetch<SymptomResponse>("/api/symptoms", {
        method: "POST",
        body: JSON.stringify({ user_id: userId ? String(userId) : null, text, age: 30, gender: "prefer not to say" }),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to connect to the symptom service.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "EMERGENCY": return "bg-red-50 text-red-700 border-red-200";
      case "HIGH": return "bg-orange-50 text-orange-700 border-orange-200";
      case "MEDIUM": return "bg-amber-50 text-amber-700 border-amber-200";
      case "LOW": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Symptom <span className="text-primary">Analyzer</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Describe how you're feeling, and our AI will provide potential causes and recommended specialists.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50">
        <div className="p-6 sm:p-8">
          <label htmlFor="symptoms" className="block text-sm font-semibold text-foreground mb-2">
            How are you feeling today?
          </label>
          <textarea
            id="symptoms"
            rows={4}
            className="w-full resize-none rounded-xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g. I've had a severe headache since morning and a slight fever..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={analyzeSymptoms}
              disabled={!text.trim() || loading}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing...
                </>
              ) : (
                "Analyze Symptoms"
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Error analyzing symptoms</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-12 space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Analysis Results
            <div className="h-px flex-1 bg-border/60 ml-4"></div>
          </h2>
          
          {result.is_emergency && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-red-100 p-2 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800">Emergency Detected</h3>
                  <p className="mt-1 text-red-700">{result.emergency_message}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {result.conditions.map((condition, idx) => (
              <div 
                key={idx} 
                className={`relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md ${getSeverityColor(condition.severity)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                    {condition.severity}
                  </span>
                  <span className="text-sm font-medium opacity-80">
                    {Math.round(condition.confidence * 100)}% Match
                  </span>
                </div>
                
                <h4 className="text-lg font-bold mb-1">{condition.name}</h4>
                <p className="text-sm opacity-90 mt-2 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {condition.recommended_specialist}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
