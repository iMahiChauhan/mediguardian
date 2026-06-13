"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  username: string;
  email: string;
}

interface HistoryRecord {
  id: number;
  symptoms_text: string;
  top_condition_name: string;
  severity: string;
  is_emergency: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("mediguardian_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userData = await apiFetch<User>("/api/auth/me");
        setUser(userData);

        try {
          const historyData = await apiFetch<HistoryRecord[]>(`/api/history/${userData.id}`);
          setHistory(historyData);
        } catch {
          setHistory([]);
        }
      } catch (err) {
        localStorage.removeItem("mediguardian_token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  if (loading) return <div className="text-center mt-20 animate-pulse text-muted-foreground font-semibold">Loading your medical hub...</div>;
  if (!user) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Welcome, <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{user.username}</span></h1>
          <p className="text-lg text-muted-foreground mt-1">Your centralized AI healthcare command center.</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem("mediguardian_token"); router.push("/login"); }}
          className="rounded-full bg-red-50 text-red-600 px-6 py-2 text-sm font-bold shadow-sm hover:bg-red-100 transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
        {/* Symptom Analyzer Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute -right-4 -top-4 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
          </div>
          <h3 className="text-xl font-bold mb-2 relative z-10">Symptom Analyzer</h3>
          <p className="text-sm text-blue-100 mb-6 relative z-10 line-clamp-2">Get instant, AI-driven triage for your symptoms securely.</p>
          <Link href="/symptoms" className="inline-block rounded-lg bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-md transition-colors hover:bg-white/30 relative z-10">
            Launch App &rarr;
          </Link>
        </div>

        {/* Medical Reports Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute -right-4 -top-4 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <h3 className="text-xl font-bold mb-2 relative z-10">Medical Reports</h3>
          <p className="text-sm text-emerald-100 mb-6 relative z-10 line-clamp-2">Upload blood test PDFs for instant OCR analysis and insights.</p>
          <Link href="/reports" className="inline-block rounded-lg bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-md transition-colors hover:bg-white/30 relative z-10">
            Launch App &rarr;
          </Link>
        </div>

        {/* Hospital Finder Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-6 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute -right-4 -top-4 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1 10V9H9V7h2V5h2v2h2v2h-2v3h-2z"/></svg>
          </div>
          <h3 className="text-xl font-bold mb-2 relative z-10">Hospital Finder</h3>
          <p className="text-sm text-rose-100 mb-6 relative z-10 line-clamp-2">Locate nearby care centers and active emergency rooms instantly.</p>
          <Link href="/hospitals" className="inline-block rounded-lg bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-md transition-colors hover:bg-white/30 relative z-10">
            Launch App &rarr;
          </Link>
        </div>

        {/* AI Chatbot Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 p-6 text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute -right-4 -top-4 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
          </div>
          <h3 className="text-xl font-bold mb-2 relative z-10">AI Chatbot</h3>
          <p className="text-sm text-violet-100 mb-6 relative z-10 line-clamp-2">Chat with your personalized medical assistant in any language.</p>
          <Link href="/chat" className="inline-block rounded-lg bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-md transition-colors hover:bg-white/30 relative z-10">
            Launch App &rarr;
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">Your Medical History</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{history.length} Records</span>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center bg-gray-50/50">
            <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No History Yet</h3>
            <p className="text-muted-foreground">Try analyzing some symptoms to build your medical profile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(record => (
              <div key={record.id} className="group flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{record.top_condition_name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${record.is_emergency ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {record.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 italic">"{record.symptoms_text}"</p>
                </div>
                <div className="mt-4 md:mt-0 text-left md:text-right border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                  <p className="text-sm font-semibold text-gray-900">{new Date(record.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-xs text-gray-400 mt-1">Logged via AI Analyzer</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
