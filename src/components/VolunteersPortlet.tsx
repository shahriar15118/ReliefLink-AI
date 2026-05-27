import React, { useState } from "react";
import { Volunteer } from "../types";
import { fetchJson } from "../utils";
import { Users, UserCheck, Trophy, Sparkles, PlusCircle } from "lucide-react";

interface VolunteersPortletProps {
  language: "en" | "bn";
  volunteers: Volunteer[];
  onNewVolunteer: (newVol: Volunteer) => void;
  onAssignTask: (updatedVol: Volunteer) => void;
}

export default function VolunteersPortlet({ language, volunteers, onNewVolunteer, onAssignTask }: VolunteersPortletProps) {
  // Register Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("First Aid");
  const [isRegistering, setIsRegistering] = useState(false);

  // Assignment fields
  const [targetVolId, setTargetVolId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsRegistering(true);
    try {
      const payload = {
        name,
        phone,
        skills: [skills],
        latitude: 23.8105,
        longitude: 90.4122
      };

      const res = await fetchJson<Volunteer>("/api/volunteers", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      onNewVolunteer(res);
      setName("");
      setPhone("");
    } catch (err) {
      console.error("Volunteer registration failure:", err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVolId || !taskName) return;

    setIsAssigning(true);
    try {
      const res = await fetchJson<Volunteer>(`/api/volunteers/${targetVolId}/assign`, {
        method: "POST",
        body: JSON.stringify({ taskName })
      });

      onAssignTask(res);
      setTargetVolId("");
      setTaskName("");
    } catch (err) {
      console.error("Assign task failed:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Sort by leaderboard score
  const leaderboard = [...volunteers].sort((a, b) => b.score - a.score);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Registered Volunteers & Skills */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Users className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-display font-medium text-white leading-tight">
              {language === "en" ? "Rescue Hand Registry" : "স্বেচ্ছাসেবক স্কোয়াড"}
            </h3>
            <span className="text-[10px] font-mono text-white/40">ACTIVE GEO-TAGGED SKILL RESERVES</span>
          </div>
        </div>

        <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
          {volunteers.map(vol => (
            <div key={vol.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">{vol.name}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${vol.available ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/10 text-white/60"}`}>
                  {vol.available ? "Available" : "On Duty"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 font-sans">
                {vol.skills.map((skill, index) => (
                  <span key={index} className="text-[9px] font-mono font-bold bg-white/5 text-white/50 border border-white/10 px-1.5 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>

              {!vol.available && vol.currentTaskName && (
                <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 text-[10px] text-red-400 font-mono">
                  Duty: {vol.currentTaskName}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER COLUMN: Task Assignment & Quick Registration Form */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        {/* Assign duty */}
        <div className="space-y-4 border-b border-white/5 pb-5">
          <h4 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
            <UserCheck className="w-4 h-4 text-white/40" />
            <span>Task Desynchronization Duty</span>
          </h4>

          <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs font-sans text-white">
            <div>
              <select
                value={targetVolId}
                onChange={(e) => setTargetVolId(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs focus:outline-hidden focus:border-orange-500 font-sans"
              >
                <option value="" className="bg-[#121214]">-- Choose Available Volunteer --</option>
                {volunteers.filter(v => v.available).map(v => (
                  <option key={v.id} value={v.id} className="bg-[#121214]">{v.name} ({v.skills[0]})</option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Cleansing flood debris Demra Road 2"
                required
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs focus:outline-[#f97316]/50 focus:outline bg-opacity-100"
              />
            </div>

            <button
              type="submit"
              disabled={isAssigning}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-white/10 text-white font-display text-xs font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-orange-600/10 cursor-pointer"
            >
              <span>Assign Mission Dispatch</span>
            </button>
          </form>
        </div>

        {/* Quick Join */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
            <PlusCircle className="w-4 h-4 text-white/40" />
            <span>Register Voluntary Hand</span>
          </h4>

          <form onSubmit={handleRegister} className="space-y-3 text-xs font-sans text-white">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs focus:outline-hidden focus:border-orange-500 placeholder-white/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Cell Mobile"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs focus:outline-hidden focus:border-orange-500 placeholder-white/20"
              />
              <select
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs font-sans focus:outline-hidden focus:border-orange-500"
              >
                <option value="First Aid" className="bg-[#121214]">First Aid</option>
                <option value="Search & Rescue" className="bg-[#121214]">Search & Rescue</option>
                <option value="Driving" className="bg-[#121214]">Driving</option>
                <option value="Coordination" className="bg-[#121214]">Coordination</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-display text-xs font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-orange-600/10 cursor-pointer"
            >
              <span>Commit Active Service</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Active achievement scoreboard leaderboard */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Trophy className="w-5 h-5 text-yellow-400 fill-yellow-400/20 animate-pulse" />
          <div>
            <h3 className="font-display font-semibold text-white leading-tight">
              Duty Honors Leaderboard
            </h3>
            <span className="text-[10px] font-mono text-white/40">HIGHEST LOGISTICS SCOREBOARDS POINTS</span>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
          {leaderboard.map((vol, idx) => (
            <div key={vol.id} className="p-3 bg-white/5 border border-white/15 rounded-xl flex items-center justify-between text-xs transition-all hover:bg-white/10 hover:border-orange-500/25">
              <div className="flex items-center gap-3">
                <span className={`font-display font-black text-sm block w-5 ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-zinc-300" : idx === 2 ? "text-amber-500" : "text-white/40"}`}>
                  #{idx + 1}
                </span>
                <div>
                  <span className="font-bold text-white flex items-center gap-1 font-sans">
                    {vol.name}
                    {idx === 0 && <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                  </span>
                  <span className="text-[9px] text-white/30 font-mono block">ID: {vol.id}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-display font-black text-white font-mono block leading-tight">{(vol.score ?? 0).toLocaleString()}</span>
                <span className="block text-[8px] text-white/30 font-mono font-bold uppercase">RESCUE PTS</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
