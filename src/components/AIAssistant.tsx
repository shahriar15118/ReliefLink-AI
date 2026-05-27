import React, { useState, useRef, useEffect } from "react";
import { fetchJson } from "../utils";
import { BrainCircuit, Send, Volume2, User, Sparkles } from "lucide-react";

interface AIAssistantProps {
  language: "en" | "bn";
}

interface Message {
  id: string;
  sender: "user" | "gemini";
  text: string;
  createdAt: Date;
}

export default function AIAssistant({ language }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "gemini",
      text: language === "en" 
        ? "Hello, I am your ReliefLink AI Emergency Assistant. Enter your query about flash flood survival, shelter layouts, first aid procedures, or ML model retraining pipelines, and I will generate precise tactical instructions."
        : "নমস্কার, আমি আপনার রিলিফলিঙ্ক এআই জরুরি সহকারী। আকস্মিক বন্যা থেকে বেঁচে থাকা, আশ্রয়কেন্দ্রের লেআউট, বা ত্রাণ সহায়তার যেকোনো বিষয়ে প্রশ্ন করতে পারেন।",
      createdAt: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAudioReading, setIsAudioReading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;

    const userText = inputValue;
    setInputValue("");
    
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: userText,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const res = await fetchJson<{ answer: string }>("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: userText, lang: language })
      });

      const geminiMsg: Message = {
        id: Math.random().toString(),
        sender: "gemini",
        text: res.answer,
        createdAt: new Date()
      };

      setMessages(prev => [...prev, geminiMsg]);
    } catch (err) {
      console.error("Gemini assistant crash:", err);
      // Fallback
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "gemini",
          text: language === "en" 
            ? "Notice: The core secure Gemini network is currently busy. Safe advice: Instantly seek elevated ground. Do not consume standing flood waters. Contact closest local Demra NGO units immediately."
            : "সতর্কতা: আমাদের প্রধান সার্ভিস নেটওয়ার্ক বর্তমানে কিছুটা ব্যস্ত আছে। জরুরি বন্যা নিরাপত্তা বার্তা: দ্রুত উঁচু স্থানে আশ্রয় নিন। প্লাবিত পানি পান করবেন না। নিকটস্থ রিলিফ পয়েন্টে যোগাযোগ করুন।",
          createdAt: new Date()
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Web Audio Speech Synthesis voice reader
  const playAudioGuide = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("TTS is not supported in this browser.");
      return;
    }

    try {
      // Cancel previous voices
      window.speechSynthesis.cancel();
      setIsAudioReading(true);

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to isolate a Bangla BD voice if language is bn
      if (language === "bn") {
        utterance.lang = "bn-BD";
      } else {
        utterance.lang = "en-US";
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsAudioReading(false);
      utterance.onerror = () => setIsAudioReading(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis crashed:", e);
      setIsAudioReading(false);
    }
  };

  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
    setIsAudioReading(false);
  };

  return (
    <div className="bg-[#121214] border border-white/10 rounded-2xl shadow-xs overflow-hidden h-[480px] flex flex-col justify-between">
      {/* Header bar */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0c0c0e]/80">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-orange-500 animate-pulse" />
          <div>
            <h3 className="font-display font-semibold text-white text-sm">
              {language === "en" ? "ReliefLink AI Advisor" : "রিলিফলিঙ্ক এআই সহযোগী"}
            </h3>
            <span className="text-[10px] font-mono text-white/40">GEMINI PRO LIVE DIALOGUE CHANNEL</span>
          </div>
        </div>

        {isAudioReading && (
          <button
            onClick={handleStopAudio}
            className="text-[9px] font-mono bg-orange-500/10 text-orange-400 px-2 py-1 rounded font-bold animate-pulse border border-orange-500/20"
          >
            ⏹ STOP SPEECH AUDIO
          </button>
        )}
      </div>

      {/* Messages screen container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/20" ref={scrollRef}>
        {messages.map((m) => {
          const isGemini = m.sender === "gemini";
          return (
            <div key={m.id} className={`flex gap-3 max-w-[85%] ${isGemini ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
              {/* Avatar indicator */}
              <div className={`p-2.5 rounded-xl text-white shrink-0 h-fit ${isGemini ? "bg-orange-600 shadow-md shadow-orange-600/10" : "bg-zinc-800"}`}>
                {isGemini ? <Sparkles className="w-4 h-4 fill-yellow-250 text-yellow-300 animate-spin" style={{ animationDuration: '8s' }} /> : <User className="w-4 h-4" />}
              </div>

              <div className={`space-y-1 p-3.5 border rounded-2xl shadow-3xs ${isGemini ? "bg-[#18181b] border-white/10" : "bg-orange-600/10 border-orange-500/20"}`}>
                <p className="text-xs text-white/95 leading-relaxed font-sans select-text whitespace-pre-wrap">
                  {m.text}
                </p>

                {isGemini && (
                   <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/5">
                    <span className="text-[8px] font-mono text-white/40">{new Date(m.createdAt).toLocaleTimeString()}</span>
                    <button
                      type="button"
                      onClick={() => playAudioGuide(m.text)}
                      className="text-[9px] font-mono font-bold text-orange-400 flex items-center gap-1 hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
                      <span>Play Audio Voice</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Gemini processing state indicator */}
        {isGenerating && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="p-2.5 rounded-xl bg-orange-600 text-white shrink-0 animate-pulse">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="bg-[#18181b] p-4 border border-white/10 rounded-2xl shadow-3xs space-y-1.5 w-64">
              <span className="text-[10px] text-white/40 font-mono">Consolidating disaster indices...</span>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full animate-marquee" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input submission footer */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#0c0c0e]/80 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={language === 'en' ? "Ask: e.g. How to handle fresh severe flood trauma..." : "উদ্ধার বা প্রাথমিক চিকিৎসা নিয়ে প্রশ্ন করুন..."}
          className="flex-1 bg-white/5 border border-white/10 text-xs text-white px-4 py-3 rounded-xl focus:outline-hidden focus:border-orange-500 font-sans placeholder-white/30"
        />
        <button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl transition-all shadow-md shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
