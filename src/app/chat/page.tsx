"use client";

import { apiFetch, getApiUrl } from "@/lib/api";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your personal medical AI. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
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

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiFetch<{ reply: string }>("/api/chat/message", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, message: userMsg, language }),
      });
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am having trouble connecting to the network." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl flex flex-col h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline mb-2 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="text-2xl font-extrabold text-foreground">Medical Assistant</h1>
        </div>
        <select 
          value={language} 
          onChange={e => setLanguage(e.target.value)}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="bn">বাংলা (Bengali)</option>
          <option value="te">తెలుగు (Telugu)</option>
          <option value="mr">मराठी (Marathi)</option>
          <option value="ta">தமிழ் (Tamil)</option>
          <option value="ur">اردو (Urdu)</option>
          <option value="gu">ગુજરાતી (Gujarati)</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
          <option value="ml">മലയാളം (Malayalam)</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div className="flex-1 rounded-2xl border border-border/50 bg-white p-4 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === "user" 
                  ? "bg-primary text-white rounded-br-none" 
                  : "bg-gray-100 text-gray-900 rounded-bl-none"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-gray-100 px-5 py-4 rounded-bl-none flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2 border-t pt-4">
          <input 
            type="text" 
            placeholder={language === "en" ? "Ask a medical question..." : "Haz una pregunta médica..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            className="flex-1 rounded-xl border border-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button 
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
