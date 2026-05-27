import React, { useState } from "react";
import { SOSAlert, UserRole } from "../types";
import { fetchJson } from "../utils";
import { AlertOctagon, Radio, Loader, Bell } from "lucide-react";

interface SOSPulseProps {
  language: "en" | "bn";
  sosAlerts: SOSAlert[];
  onTriggerSos: (newSos: SOSAlert) => void;
  currentUserRole: UserRole;
}

export default function SOSPulse({ language, sosAlerts, onTriggerSos }: SOSPulseProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [needs, setNeeds] = useState("");
  const [medicalNeeded, setMedicalNeeded] = useState(false);
  const [isTrapped, setIsTrapped] = useState(false);

  // Simulation log of outbound emergency warning SMS
  const [smsLogs, setSmsLogs] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  const handleLaunchSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsActivating(true);
    setSuccessMsg("");

    // Read real coordinates safely with Dhaka city centroids fallback
    let latitude = 23.8103;
    let longitude = 90.4125;

    if (navigator.geolocation) {
      const posPromise = new Promise<GeolocationPosition>((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve, () => resolve({ coords: { latitude: 23.8103, longitude: 90.4125 } } as any));
      });
      const pos = await posPromise;
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    }

    try {
      const payload = {
        name,
        phone,
        latitude,
        longitude,
        medicalAssistanceRequired: medicalNeeded,
        trapped: isTrapped,
        currentNeeds: needs || "Immediate extraction needed"
      };

      const res = await fetchJson<SOSAlert>("/api/sos", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      onTriggerSos(res);
      setSuccessMsg(language === "en" ? "CRITICAL EMERGENCY TICKET ESTABLISHED." : "জরুরি এসওএস টিকেট সফলভাবে তৈরি করা হয়েছে।");
      
      const timeStr = new Date().toLocaleTimeString();
      const logs = [
        `[${timeStr}] Outbound SMS dispatched to responder base: "SOS alert received from ${name} at Dhaka Sector Coords [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]."`,
        `[${timeStr}] Civil Alert: Outbound SMS warning sent to general cellular contacts near coords.`
      ];
      setSmsLogs(prev => [...logs, ...prev]);

      // Reset values
      setName("");
      setPhone("");
      setNeeds("");
      setMedicalNeeded(false);
      setIsTrapped(false);
    } catch (err) {
      console.error("SOS launch failure:", err);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* SOS input form trigger */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl relative shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4 mb-4">
          <AlertOctagon className="w-5 h-5 text-orange-500 animate-pulse" />
          <div>
            <h3 className="font-display font-semibold text-white leading-tight">
              {language === "en" ? "SOS Disaster Emergency Panel" : "জরুরি সংকেত (SOS) প্যানেল"}
            </h3>
            <span className="text-[10px] font-mono text-white/40">RAPID TELEMETRY ESCALATION</span>
          </div>
        </div>

        <form onSubmit={handleLaunchSOS} className="space-y-4 text-xs">
          <div>
            <label className="block text-white/60 font-medium mb-1.5">Victim Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Abdur Rahim"
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-white/60 font-medium mb-1.5">Emergency Contact Cell</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +880 1700-112233"
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-white/60 font-medium mb-1.5">Target Needs Description</label>
            <textarea
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              placeholder="e.g. Water is high. Two elderly persons cannot swim"
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg text-xs h-20 resize-none"
            ></textarea>
          </div>

          {/* Quick toggle check boxes */}
          <div className="grid grid-cols-2 gap-3 pb-2 text-[11px]">
            <label className="flex items-center gap-2 bg-rose-500/5 p-2 border border-rose-500/20 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={medicalNeeded}
                onChange={(e) => setMedicalNeeded(e.target.checked)}
                className="rounded text-orange-500 focus:ring-0"
              />
              <span className="font-medium text-rose-300 truncate">Medical Aid Needed</span>
            </label>

            <label className="flex items-center gap-2 bg-amber-500/5 p-2 border border-amber-500/20 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={isTrapped}
                onChange={(e) => setIsTrapped(e.target.checked)}
                className="rounded text-orange-500 focus:ring-0"
              />
              <span className="font-medium text-amber-300 truncate">Trapped / Blocked</span>
            </label>
          </div>

          {/* Core SOS button */}
          <button
            type="submit"
            disabled={isActivating}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-display font-black py-4 rounded-xl text-sm transition-all shadow-md hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isActivating ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Radio className="w-5 h-5 animate-pulse" />
            )}
            <span>ACTIVATE ONE-TAP SOS PULSE</span>
          </button>

          {successMsg && (
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg border border-emerald-500/20 font-semibold text-center mt-2 animate-bounce">
              {successMsg}
            </div>
          )}
        </form>
      </div>

      {/* SOS Active Logs & list feeds */}
      <div className="lg:col-span-2 space-y-6">
        {/* Active Emergency alerts feed queue */}
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500 animate-bounce" />
              <div>
                <h3 className="font-display font-medium text-white leading-tight">
                  {language === "en" ? "Active Distress Flares Queue" : "সক্রিয় এসওএস অ্যালার্ট ফিড"}
                </h3>
                <span className="text-[10px] font-mono text-white/40">BROADCASTED LIVE COORDINATES</span>
              </div>
            </div>
            <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-mono font-bold">
              {sosAlerts.filter(s => s.status !== "Resolved").length} CRITICAL ACTIVE
            </span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {sosAlerts.length === 0 ? (
              <span className="text-white/40 text-xs font-mono block text-center py-8">
                No active distress flares logged. Grid status: secure.
              </span>
            ) : (
              sosAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3.5 border rounded-xl space-y-2 transition-all ${alert.status === "Active" ? "bg-orange-600/10 border-orange-500/30" : "bg-white/5 border-white/10"}`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping"></span>
                      <span className="font-bold text-white">{alert.name}</span>
                    </div>
                    <span className="font-mono text-white/40 font-medium truncate max-w-[150px]">{alert.phone}</span>
                  </div>

                  <p className="text-[11px] text-white/80 leading-relaxed font-sans pl-4 border-l border-orange-500">
                    {alert.currentNeeds}
                  </p>

                  <div className="flex flex-wrap justify-between items-center text-[10px] font-mono pt-1 text-white/50 border-t border-white/5">
                    <div className="flex gap-2">
                      {alert.medicalAssistanceRequired && (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">MEDICAL ASSISTANCE REQ</span>
                      )}
                      {alert.trapped && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">TRAPPED</span>
                      )}
                    </div>
                    <span>Closest Responder assigned: <strong className="text-orange-400">{alert.nearestResponderId || "Assigning..."}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Outbound SMS Logger simulator */}
        <div className="bg-[#0c0c0e] text-white p-5 rounded-2xl shadow-md border border-white/10 space-y-3">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">NGO Broadcast SMS Outbound Logger</span>
          </div>

          <div className="font-mono text-[10px] space-y-2 max-h-[140px] overflow-y-auto">
            {smsLogs.length === 0 ? (
              <span className="text-white/30 block italic">Waiting for emergency SOS pulse activation to logs outbound SMS streams...</span>
            ) : (
              smsLogs.map((log, idx) => (
                <div key={idx} className="bg-white/5 p-2 rounded border border-white/5 text-emerald-300 leading-relaxed">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
