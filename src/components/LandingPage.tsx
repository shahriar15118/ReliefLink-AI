import React, { useState } from "react";
import { TRANSLATIONS } from "../utils";
import { Shield, Radio, HeartHandshake, BrainCircuit, CheckCircle2, Download, Send, ChevronRight } from "lucide-react";

interface LandingProps {
  language: "en" | "bn";
  setLanguage: (lang: "en" | "bn") => void;
  onEnterDashboard: () => void;
}

export default function LandingPage({ language, setLanguage, onEnterDashboard }: LandingProps) {
  const t = TRANSLATIONS[language];
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMsg) {
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setContactName("");
        setContactEmail("");
        setContactMsg("");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-orange-600 selection:text-white font-sans text-white/90">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-[#0c0c0e]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg text-white font-display font-black tracking-wider text-xl flex items-center gap-1.5 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
            <span>RL</span>
          </div>
          <div>
            <span className="font-display font-semibold tracking-tight text-xl block text-white leading-none">ReliefLink AI</span>
            <span className="text-[10px] font-mono text-white/40 tracking-wider">SECURE RESPONSE v2.5</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${language === "en" ? "bg-white/10 text-white font-bold" : "text-white/40 hover:text-white"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("bn")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${language === "bn" ? "bg-white/10 text-white font-bold" : "text-white/40 hover:text-white"}`}
            >
              বাংলা
            </button>
          </div>

          <button
            onClick={onEnterDashboard}
            className="bg-orange-600 hover:bg-orange-700 font-display text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <span>{language === 'en' ? 'Launch Core System' : 'সিস্টেম ম্যাপ চালু করুন'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Broadcast Marquee Emergency Banner */}
      <div className="bg-orange-600/10 border-y border-orange-500/15 text-orange-400 py-2 px-6 flex items-center gap-3 font-mono text-xs font-medium overflow-hidden shadow-sm">
        <span className="bg-orange-500 text-white px-2 py-0.5 rounded-sm font-black text-[10px] animate-pulse shrink-0">CRITICAL TELEMETRY</span>
        <div className="animate-marquee whitespace-nowrap scroll-smooth">
          {t.emergencyAlert} &bull; COGNITIVE ROUTING ENGINES ACTIVE &bull; {t.systemStatus}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full text-orange-400 text-xs font-semibold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-orange-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Enterprise-Grade Emergency Logistics System</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            {t.heroTitle}
          </h1>

          <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
            {t.heroDesc}
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={onEnterDashboard}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-display text-sm font-semibold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg shadow-md cursor-pointer"
            >
              <span>{t.explorePlatform}</span>
              <ChevronRight className="w-5 h-5 text-white/50" />
            </button>

            <a
              href="#pwa-download"
              className="w-full sm:w-auto border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/90 font-display text-sm font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-white/50" />
              <span>{language === 'en' ? 'Install Offline PWA App' : 'অফলাইন পিডব্লিউএ ডাউনলোড করুন'}</span>
            </a>
          </div>

          {/* Quick Metrics display */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div>
              <span className="block text-3xl font-black text-white font-display">42%</span>
              <span className="text-xs text-white/40 font-mono">Transit Time Reduced</span>
            </div>
            <div>
              <span className="block text-3xl font-black text-white font-display">12,450+</span>
              <span className="text-xs text-white/40 font-mono">Rescue Rations Deployed</span>
            </div>
            <div>
              <span className="block text-3xl font-black text-white font-display">94.1%</span>
              <span className="text-xs text-white/40 font-mono">ML Prediction Accuracy</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive UI Preview mockup */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none">
          <div className="bg-white/5 border border-white/10 p-2 rounded-2xl shadow-xl space-y-2">
            <div className="bg-[#121214] border border-white/5 rounded-xl p-6 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-mono text-white/40">ML RESOURCE OPTIMIZER FOR DEMRA</span>
                <span className="bg-[#10b981]/15 text-[#10b981] text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-[#10b981]/20 uppercase">XGBOOST VERIFIED</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60 font-sans">Flood Depth Level</span>
                  <span className="font-mono text-yellow-400 font-semibold">4.1 Meters</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60 font-sans">Local Area Population</span>
                  <span className="font-mono text-white font-semibold">1,250 Persons</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60 font-sans">A* Estimated Rescue Teams</span>
                  <span className="font-mono text-orange-400 font-semibold">14 Dynamic Squads</span>
                </div>
              </div>

              <div className="p-3 bg-[#0c0c0e] rounded-lg border border-white/5 space-y-3">
                <div className="flex items-center justify-between font-sans">
                  <span className="text-xs font-semibold text-white/80">Clean Water Target Recommendation</span>
                  <span className="text-xs text-orange-400 font-mono font-bold">75,000 Liters</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                <span className="text-xs font-bold text-white font-display">LIVE DISASTER TICKER MAP ACTIVE</span>
              </div>
              <button onClick={onEnterDashboard} className="text-xs text-orange-400 font-semibold flex items-center gap-1 hover:text-orange-300 transition-all cursor-pointer">
                <span>View Map</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Panel */}
      <section className="bg-[#121214] border-y border-white/10 py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-mono font-bold tracking-widest text-orange-400">MODULAR ARCHITECTURE</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
              Enterprise Tactical Features
            </h2>
            <p className="text-white/50 text-sm sm:text-base font-sans">
              A comprehensive system framework built for rapid, multi-tier coordination during extreme natural scenarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 font-sans">
            <div className="bg-[#0e0e10] p-6 rounded-2xl border border-white/10 hover:bg-[#121214] hover:border-orange-500/25 transition-all space-y-4">
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 p-3 w-fit rounded-xl">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Predictive ML Logistics</h3>
              <p className="text-white/40 text-xs leading-relaxed">
                Computes volume requirements for drinking water, nutrition packages, medical field beds, fuel logistics, and tents under strict Bayesian confidence intervals.
              </p>
            </div>

            <div className="bg-[#0e0e10] p-6 rounded-2xl border border-white/10 hover:bg-[#121214] hover:border-orange-500/25 transition-all space-y-4">
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 p-3 w-fit rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">A* Path Optimization</h3>
              <p className="text-white/40 text-xs leading-relaxed">
                Applies advanced constraint satisfaction algorithms to avoid collapsed buildings and deep waters, computing optimal routes for ground responders.
              </p>
            </div>

            <div className="bg-[#0e0e10] p-6 rounded-2xl border border-white/10 hover:bg-[#121214] hover:border-orange-500/25 transition-all space-y-4">
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 p-3 w-fit rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">AI Computer Vision</h3>
              <p className="text-white/40 text-xs leading-relaxed">
                Submits uploaded citizen rescue media straight to Gemini model engines to classify structural risks, road barriers, and flood elevations automatically.
              </p>
            </div>

            <div className="bg-[#0e0e10] p-6 rounded-2xl border border-white/10 hover:bg-[#121214] hover:border-orange-500/25 transition-all space-y-4">
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 p-3 w-fit rounded-xl">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Offline PWA Sync</h3>
              <p className="text-white/40 text-xs leading-relaxed">
                Local IndexedDB schemas buffer reporting queues and safety instructions during extreme communication towers downtime, flushing parameters upon online re-entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsoring Partner and NGO showcases */}
      <section className="py-16 px-6 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <h2 className="text-2xl font-display font-black text-white">Sponsors & Regional Network Integration</h2>
            <p className="text-white/50 text-sm font-sans">Empowering leading NGOs and corporate financial agents globally.</p>
          </div>
          <div className="text-xs text-mono bg-orange-500/10 text-orange-400 px-3 py-1 rounded border border-orange-500/20 font-bold uppercase tracking-wider">
            12 GLOBAL CONCESSION PARTNERS ACTIVE
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60 hover:opacity-100 transition-all font-sans font-medium">
          <div className="p-4 border border-white/10 text-center rounded-xl font-display font-bold tracking-tight text-white/50 bg-[#121214] hover:border-orange-500/30 hover:text-white transition-all">
            BANGLADESH RED CRESCENT
          </div>
          <div className="p-4 border border-white/10 text-center rounded-xl font-display font-bold tracking-tight text-white/50 bg-[#121214] hover:border-orange-500/30 hover:text-white transition-all">
            BRAC DISASTER UNIT
          </div>
          <div className="p-4 border border-white/10 text-center rounded-xl font-display font-bold tracking-tight text-white/50 bg-[#121214] hover:border-orange-500/30 hover:text-white transition-all">
            STRIPE CONNECT
          </div>
          <div className="p-4 border border-white/10 text-center rounded-xl font-display font-bold tracking-tight text-white/50 bg-[#121214] hover:border-orange-500/30 hover:text-white transition-all">
            WORLD FOOD FUND
          </div>
          <div className="p-4 border border-white/10 text-center rounded-xl font-display font-bold tracking-tight text-white/50 bg-[#121214] hover:border-orange-500/30 hover:text-white transition-all">
            UNHCR TELEMETRY
          </div>
          <div className="p-4 border border-white/10 text-center rounded-xl font-display font-bold tracking-tight text-white/50 bg-[#121214] hover:border-orange-500/30 hover:text-white transition-all">
            OPENSTREETMAP ADVISORY
          </div>
        </div>
      </section>

      {/* PWA offline banner */}
      <section id="pwa-download" className="bg-[#121214] text-white border border-white/10 rounded-3xl mx-6 py-16 px-8 max-w-7xl lg:mx-auto text-center space-y-8 relative overflow-hidden my-12">
        <div className="absolute inset-0 bg-orange-500/5 pointer-events-none"></div>
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight leading-[1.2]">
            {language === 'en' ? 'PWA Offline Mode & Emergency Instructions' : 'অফলাইন পিডব্লিউএ এবং জরুরি নির্দেশনা অ্যাপ'}
          </h2>
          <p className="text-white/60 text-sm leading-relaxed font-sans">
            {language === 'en' 
              ? 'Our Progressive Web App (PWA) buffers geographical coordinate tiles, first aid procedures, and emergency response forms inside IndexedDB storage during mobile data failures.'
              : 'মোবাইল নেটওয়ার্ক বন্ধ থাকলেও অ্যাপের অফলাইন পিডব্লিউএ মোড আপনার ফোনে নির্দেশনা এবং উদ্ধার কাজ সচল রাখবে।'}
          </p>
          <div className="flex bg-[#0c0c0e] p-4 rounded-xl border border-white/10 max-w-xl mx-auto items-center justify-between text-left font-sans">
            <div>
              <span className="text-xs font-mono text-white/40 block">PWA STATUS REGISTERED</span>
              <span className="block text-sm font-semibold text-white">Version: 2.50.1 (Offline Capable)</span>
            </div>
            <button className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold font-display px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer">
              <Download className="w-4 h-4" />
              <span>Install to Device</span>
            </button>
          </div>
        </div>
      </section>

      {/* Contact partner form section */}
      <section className="py-16 px-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white">Partner with ReliefLink AI</h2>
          <p className="text-white/40 text-sm font-sans">Send your enterprise query to our secure government coordination team.</p>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-4 bg-[#121214] p-8 rounded-2xl border border-white/10 shadow-xs font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-white/50 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white focus:bg-white/10 text-sm px-4 py-3 rounded-xl focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-white/50 mb-1.5">Official Email Address</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white focus:bg-white/10 text-sm px-4 py-3 rounded-xl focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-white/50 mb-1.5">Query Description</label>
            <textarea
              required
              rows={4}
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              placeholder="e.g. Requesting deployment license for local fire rescue modules..."
              className="w-full bg-white/5 border border-white/10 text-white focus:bg-white/10 text-sm px-4 py-3 rounded-xl focus:outline-hidden resize-none placeholder-white/20"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-display text-sm font-semibold py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-600/10 cursor-pointer"
          >
            <Send className="w-4 h-4 text-white/80" />
            <span>Submit Partner Query</span>
          </button>

          {isSent && (
            <div className="bg-emerald-500/10 text-emerald-400 text-xs px-4 py-3 rounded-xl text-center font-semibold border border-[#10b981]/20">
              Your security dispatch has been sent. Our team responds within 15 minutes in active zones.
            </div>
          )}
        </form>
      </section>

      {/* Professional Footer */}
      <footer className="bg-[#0c0c0e] text-white/40 py-12 px-6 border-t border-white/10 text-center sm:text-left">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-xs font-sans">
          <div className="space-y-1">
            <span className="font-display font-black text-white text-base block tracking-wider text-center sm:text-left">ReliefLink AI</span>
            <p>&copy; {new Date().getFullYear()} ReliefLink Systems Inc. Google AI Studio Enterprise Architect.</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#" className="hover:text-white transition-colors">Security Audits</a>
            <a href="#" className="hover:text-white transition-colors">GDPR & HIPAA Compliance</a>
            <a href="#" className="hover:text-white transition-colors">API References</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Rescue</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
