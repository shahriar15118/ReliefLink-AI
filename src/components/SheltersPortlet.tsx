import React, { useState } from "react";
import { Shelter } from "../types";
import { fetchJson } from "../utils";
import { Home, Plus, Users, ShieldCheck, Compass } from "lucide-react";

interface SheltersPortletProps {
  language: "en" | "bn";
  shelters: Shelter[];
  onNewShelter: (newShelter: Shelter) => void;
  onShelterIntake: (updatedShelter: Shelter) => void;
}

export default function SheltersPortlet({ language, shelters, onNewShelter, onShelterIntake }: SheltersPortletProps) {
  // Shelter create fields
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(300);
  const [water, setWater] = useState<"Adequate" | "Low" | "None">("Adequate");
  const [food, setFood] = useState<"Adequate" | "Low" | "None">("Adequate");

  const [latitude, setLatitude] = useState("23.8115");
  const [longitude, setLongitude] = useState("90.4140");

  const [isCreating, setIsCreating] = useState(false);
  
  // Intake tracking
  const [selectedShelterId, setSelectedShelterId] = useState<string>("");
  const [intakeCount, setIntakeCount] = useState<number>(10);
  const [isIntaking, setIsIntaking] = useState(false);
  const [intakeError, setIntakeError] = useState("");

  // Nearby shelter solver
  const [userLat, setUserLat] = useState("23.8100");
  const [userLng, setUserLng] = useState("90.4120");
  const [closestShelter, setClosestShelter] = useState<Shelter | null>(null);
  const [closestDistance, setClosestDistance] = useState<number | null>(null);

  // Geodist helper in km
  function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth Radius
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const handleCreateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsCreating(true);
    try {
      const payload = {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        capacity: Number(capacity),
        occupancy: 0,
        waterAvailability: water,
        foodAvailability: food,
        medicalStatus: "Good"
      };

      const res = await fetchJson<Shelter>("/api/shelters", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      onNewShelter(res);
      setName("");
      setCapacity(300);
    } catch (err) {
      console.error("Failed to construct shelter:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleIntakeVictims = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShelterId || intakeCount <= 0) return;

    setIsIntaking(true);
    setIntakeError("");

    try {
      const res = await fetchJson<Shelter>(`/api/shelters/${selectedShelterId}/intake`, {
        method: "POST",
        body: JSON.stringify({ victimCountJoined: Number(intakeCount) })
      });

      onShelterIntake(res);
      setIntakeCount(10);
    } catch (err: any) {
      setIntakeError(err.message || "Intake logic failed constraints check.");
    } finally {
      setIsIntaking(false);
    }
  };

  const handleFindClosest = () => {
    const uLat = parseFloat(userLat);
    const uLng = parseFloat(userLng);
    if (isNaN(uLat) || isNaN(uLng)) return;

    let minOption: Shelter | null = null;
    let minDist = 99999;

    shelters.forEach(sh => {
      const dist = calculateDistanceKm(uLat, uLng, sh.latitude, sh.longitude);
      if (dist < minDist) {
        minDist = dist;
        minOption = sh;
      }
    });

    setClosestShelter(minOption);
    setClosestDistance(minDist);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Registered capacities overview */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Home className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-display font-semibold text-white leading-tight">
              {language === "en" ? "Emergency Shelter Registry" : "নিরাপদ আশ্রয়কেন্দ্র ডিরেক্টরি"}
            </h3>
            <span className="text-[10px] font-mono text-white/40">CORE CIVIL CAPACITIES LEDGER</span>
          </div>
        </div>

        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {shelters.map(sh => {
            const pct = Math.round((sh.occupancy / sh.capacity) * 100);
            return (
              <div key={sh.id} className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[11px] font-bold text-white leading-tight">{sh.name}</span>
                  <span className={`text-[9px] font-mono px-1.5 rounded font-bold border ${pct > 80 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                    {pct}% FULL
                  </span>
                </div>

                <div className="space-y-1 font-sans">
                  <div className="flex justify-between text-[10px] font-mono text-white/40">
                    <span>Intake Level Occupied</span>
                    <span>{sh.occupancy}/{sh.capacity} Persons</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 80 ? "bg-orange-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                {/* Logistics status indicators */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 text-[8px] font-mono font-bold uppercase text-center border-t border-white/5">
                  <div className="bg-sky-500/10 text-sky-400 border border-sky-500/25 p-1 rounded">💧 Water: {sh.waterAvailability}</div>
                  <div className="bg-amber-500/10 text-amber-400 border border-amber-500/25 p-1 rounded">🍞 Food: {sh.foodAvailability}</div>
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 p-1 rounded">🩺 Med: {sh.medicalStatus}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER COLUMN: Create spaces and Intake tool */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        {/* Intake tool */}
        <div className="space-y-4 border-b border-white/5 pb-5">
          <h4 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
            <Users className="w-4 h-4 text-white/40" />
            <span>Shelter Intake Operations</span>
          </h4>

          <form onSubmit={handleIntakeVictims} className="space-y-3.5 text-xs font-sans text-white">
            <div>
              <label className="block text-white/60 mb-1">Target Base Site</label>
              <select
                value={selectedShelterId}
                onChange={(e) => { setSelectedShelterId(e.target.value); setIntakeError(""); }}
                required
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs font-sans text-white focus:outline-hidden focus:border-orange-500"
              >
                <option value="" className="bg-[#121214]">-- Choose Shelter Site --</option>
                {shelters.map(s => <option key={s.id} value={s.id} className="bg-[#121214]">{s.name} ({s.capacity - s.occupancy} seats left)</option>)}
              </select>
            </div>

            <div>
              <label className="block text-white/60 mb-1">Victims/Evacuees Volume to Intake</label>
              <input
                type="number"
                min="1"
                required
                value={intakeCount}
                onChange={(e) => setIntakeCount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isIntaking}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-white/10 text-white font-display font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Verify & Complete Intake</span>
            </button>

            {intakeError && (
              <div className="text-amber-400 bg-amber-500/10 p-2.5 rounded border border-amber-500/25 text-[10px] text-center font-bold font-mono">
                {intakeError}
              </div>
            )}
          </form>
        </div>

        {/* Create Shelter Form */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
            <Plus className="w-4 h-4 text-white/40" />
            <span>Register New Shelter Space</span>
          </h4>

          <form onSubmit={handleCreateShelter} className="space-y-3 text-xs font-sans text-white">
            <div>
              <input
                type="text"
                placeholder="Shelter Official Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-lg text-xs placeholder-white/20 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Capacity Ceiling"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-lg text-xs focus:outline-hidden focus:border-orange-500"
              />
              <select
                value={water}
                onChange={(e) => setWater(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-lg text-xs font-sans focus:outline-hidden focus:border-orange-500"
              >
                <option value="Adequate" className="bg-[#121214]">Adequate Water</option>
                <option value="Low" className="bg-[#121214]">Low Water</option>
                <option value="None" className="bg-[#121214]">No Water</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-display text-xs font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-orange-600/10 cursor-pointer"
            >
              <span>Build Active Shelter Profile</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: PROXIMITY FINDER ENGINE */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
          <Compass className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-display font-medium text-white leading-tight">
              Spatial Proximity Finder
            </h3>
            <span className="text-[10px] font-mono text-white/40">SOLVES GEOMETRIC NEAREST SHELTERS</span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-white/40 text-[11px] leading-relaxed font-sans">
            Enter your current coordinates below. The platform solver computes Haversine formulas dynamically over active databases to isolate nearest rescue shelters.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/40 font-mono mb-1.5 text-[9px]">YOUR LATITUDE</label>
              <input
                type="text"
                value={userLat}
                onChange={(e) => setUserLat(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-lg text-xs font-mono focus:outline-hidden focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-white/40 font-mono mb-1.5 text-[9px]">YOUR LONGITUDE</label>
              <input
                type="text"
                value={userLng}
                onChange={(e) => setUserLng(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-lg text-xs font-mono focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleFindClosest}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-display font-semibold py-3 rounded-lg text-xs tracking-tight shadow-md shadow-orange-600/10 cursor-pointer"
          >
            Solve Nearest Shelter Query
          </button>

          {closestShelter && closestDistance !== null && (
            <div className="p-4 bg-emerald-500/5 text-emerald-300 border border-emerald-500/20 rounded-xl space-y-2">
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase block w-fit">
                Optimal Proximity Solved
              </span>
              <strong className="block text-xs font-display text-white">{closestShelter.name}</strong>
              <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono">
                <span>Distance Bounds:</span>
                <span className="font-bold">{closestDistance.toFixed(2)} km away</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
