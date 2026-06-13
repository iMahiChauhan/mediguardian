"use client";

import { getApiUrl } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Form encoded for OAuth2
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const res = await fetch(getApiUrl("/api/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });

        if (!res.ok) throw new Error(await res.text() || "Login failed");
        
        const data = await res.json();
        localStorage.setItem("mediguardian_token", data.access_token);
        router.push("/dashboard");
      } else {
        const res = await fetch(getApiUrl("/api/auth/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password })
        });

        if (!res.ok) throw new Error(await res.text() || "Registration failed");
        
        // Auto-login after register
        setIsLogin(true);
        setError("Registration successful! Please log in.");
      }
    } catch (err: any) {
      setError(err.message.includes("detail") ? JSON.parse(err.message).detail : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 mt-12">
      <div className="rounded-2xl border border-border/50 bg-white p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? "Sign in to access your medical dashboard" : "Join MediGuardian to track your health"}
          </p>
        </div>

        {error && (
          <div className={`mb-6 rounded-xl p-4 text-sm ${error.includes("successful") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Username</label>
            <input 
              type="text" required
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full rounded-xl border border-input px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input 
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-input px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input 
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Register")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }} 
            className="ml-2 font-bold text-primary hover:underline"
          >
            {isLogin ? "Register" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
