"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";

interface Hospital {
  id: number;
  name: string;
  address: string;
  distance_miles: number;
  specialties: string[];
  has_emergency_room: boolean;
}

export default function HospitalFinderPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchHospitals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ hospitals: Hospital[] }>(`/api/hospitals/search?q=${encodeURIComponent(query)}`);
      setHospitals(data.hospitals);
    } catch (err: any) {
      setError(err.message || "Failed to connect to the hospital service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Hospital <span className="text-primary">Finder</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Locate nearby medical centers, specialized clinics, and emergency rooms.
        </p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm mb-8 flex gap-4">
        <input 
          type="text" 
          placeholder="Search by city, specialty, or zip code..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
          onKeyDown={(e) => e.key === 'Enter' && searchHospitals()}
        />
        <button 
          onClick={searchHospitals}
          disabled={loading}
          className="rounded-xl bg-primary px-8 py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4 font-semibold">{error}</div>}

      <div className="space-y-4">
        {hospitals.map(h => (
          <div key={h.id} className="rounded-xl border bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-sm transition-shadow">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold">{h.name}</h3>
                {h.has_emergency_room && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                    ER Available
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{h.address}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {h.specialties.map(s => (
                  <span key={s} className="inline-flex rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <div className="text-3xl font-extrabold text-foreground">{h.distance_miles.toFixed(1)}</div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Miles Away</div>
              <button className="mt-3 rounded-lg border border-input bg-gray-50 px-4 py-2 text-sm font-semibold hover:bg-gray-100">
                Directions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
