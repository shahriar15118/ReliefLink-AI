import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, UserRole } from "../types";
import { fetchJson } from "../utils";
import { MessageSquare, Users, Radio, Send } from "lucide-react";

interface ChatCoordinationProps {
  language: "en" | "bn";
  currentUserRole: UserRole;
  currentUserName: string;
}

export default function ChatCoordination({ language, currentUserRole, currentUserName }: ChatCoordinationProps) {
  const [activeChannel, setActiveChannel] = useState<"broadcast" | "ngo-coordination" | "volunteers">("ngo-coordination");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch channel chat messages from express server
  const loadMessages = async () => {
    try {
      const list = await fetchJson<ChatMessage[]>(`/api/chat/${activeChannel}`);
      setMessages(list);
    } catch (err) {
      console.error("Failed to load coordinators chat:", err);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Poll messages

    const handleNewMessage = (e: Event) => {
      const customEvent = e as CustomEvent<ChatMessage>;
      if (customEvent.detail && customEvent.detail.channelId === activeChannel) {
        setMessages(prev => {
          if (prev.some(m => m.id === customEvent.detail.id)) return prev;
          return [...prev, customEvent.detail];
        });
      }
    };

    window.addEventListener("new_chat_message", handleNewMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("new_chat_message", handleNewMessage);
    };
  }, [activeChannel]);

  // Scroll to bottom helper
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const payload = {
      senderName: currentUserName,
      senderRole: currentUserRole,
      text: newMessage
    };

    setNewMessage("");

    try {
      const res = await fetchJson<ChatMessage>(`/api/chat/${activeChannel}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setMessages(prev => [...prev, res]);

      // Simulate a smart responder response typing status indicator
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        const botPayload = {
          senderName: "Maj. Islam (Responder Ground Command)",
          senderRole: UserRole.EMERGENCY_RESPONDER,
          text: `Acknowledged, message from ${currentUserRole} logged. We have deployed coordination units. A* pathing showing roads clear in sector centroid.`
        };
        await fetchJson<ChatMessage>(`/api/chat/${activeChannel}`, {
          method: "POST",
          body: JSON.stringify(botPayload)
        });
        loadMessages();
      }, 2500);

    } catch (err) {
      console.error("Outbound chat failure:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-lg h-[480px]">
      {/* Channels Sidebar List */}
      <div className="lg:col-span-1 border-r border-white/10 p-4 bg-[#0e0e10] flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-mono text-white/40 block uppercase tracking-widest font-bold">CRISIS COMMS COORDINATOR</span>
          <h3 className="font-display font-bold text-white text-sm mt-1">
            {language === "en" ? "Coordination Rooms" : "সমন্বয় চ্যাট রুম"}
          </h3>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <button
            onClick={() => setActiveChannel("broadcast")}
            className={`text-xs px-3.5 py-3 rounded-xl font-medium text-left transition-all flex items-center justify-between cursor-pointer ${activeChannel === "broadcast" ? "bg-orange-600 text-white shadow-xs font-bold" : "hover:bg-white/5 text-white/70 hover:text-white font-semibold"}`}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse shrink-0" />
              <span>🚨 Global Broadcast</span>
            </div>
          </button>

          <button
            onClick={() => setActiveChannel("ngo-coordination")}
            className={`text-xs px-3.5 py-3 rounded-xl font-medium text-left transition-all flex items-center justify-between cursor-pointer ${activeChannel === "ngo-coordination" ? "bg-orange-600 text-white shadow-xs font-bold" : "hover:bg-white/5 text-white/70 hover:text-white font-semibold"}`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" />
              <span>🏢 NGO Managers Desk</span>
            </div>
          </button>

          <button
            onClick={() => setActiveChannel("volunteers")}
            className={`text-xs px-3.5 py-3 rounded-xl font-medium text-left transition-all flex items-center justify-between cursor-pointer ${activeChannel === "volunteers" ? "bg-orange-600 text-white shadow-xs font-bold" : "hover:bg-white/5 text-white/70 hover:text-white font-semibold"}`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>🤝 Volunteer Dispatch</span>
            </div>
          </button>
        </div>

        <div className="text-[10px] text-white/30 font-mono text-center p-2 border-t border-white/10 uppercase">
          SECURE ENCRYPTED LOG
        </div>
      </div>

      {/* Main Channels Chat Body rendering */}
      <div className="lg:col-span-3 flex flex-col h-full bg-[#0e0e10]">
        {/* Header indicator */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#121214]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Room Channel ID: {activeChannel}</span>
          </div>
          <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider font-bold">2 Responders online</span>
        </div>

        {/* Messages list context */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3" ref={scrollRef}>
          {messages.map((msg) => {
            const isSelf = msg.senderName === currentUserName;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${isSelf ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div className="flex gap-2 items-center mb-0.5 text-[9px] text-white/40 font-mono">
                  <span>{msg.senderName}</span>
                  <span className="bg-white/10 text-white/70 px-1.5 py-0.5 rounded scale-90 uppercase font-black">{msg.senderRole}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${isSelf ? "bg-orange-600 text-white rounded-tr-none shadow-md shadow-orange-600/10" : "bg-white/5 text-white border border-white/10 rounded-tl-none"}`}
                >
                  {msg.text}
                </div>
                <span className="text-[8px] font-mono text-white/30 mt-0.5">{new Date(msg.createdAt).toLocaleTimeString()}</span>
              </div>
            );
          })}

          {/* Type status loading mockup */}
          {isTyping && (
            <div className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/10 w-fit rounded-xl">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              <span className="text-[10px] text-white/40 font-mono">Agency responder typing...</span>
            </div>
          )}
        </div>

        {/* Input Form submit panel */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#121214] flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={language === 'en' ? "Transmit coordination update to room..." : "কোঅর্ডিনেশন বার্তার বিবরণ টাইপ করুন..."}
            className="flex-1 bg-white/5 border border-white/10 text-white text-xs px-4 py-3 rounded-xl focus:outline-hidden focus:border-orange-500 placeholder-white/30"
          />
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl transition-all shadow-md shadow-orange-600/10 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
