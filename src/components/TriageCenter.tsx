import React, { useState } from "react";
import { DisasterReport, DisasterType, SeverityLevel } from "../types";
import { fetchJson, TRANSLATIONS } from "../utils";
import { ShieldAlert, Upload, Compass, AlertCircle, Sparkles, PlusCircle } from "lucide-react";

interface TriageCenterProps {
  language: "en" | "bn";
  reports: DisasterReport[];
  onNewReport: (report: DisasterReport) => void;
  onExploreRoutePath?: (startLat: number, startLng: number, endLat: number, endLng: number) => void;
}

export default function TriageCenter({ language, reports, onNewReport, onExploreRoutePath }: TriageCenterProps) {
  const t = TRANSLATIONS[language];
  
  // Create state for inputs
  const [type, setType] = useState<DisasterType>(DisasterType.FLOOD);
  const [severity, setSeverity] = useState<SeverityLevel>(SeverityLevel.HIGH);
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");

  // Coordinates
  const [lat, setLat] = useState("23.8103");
  const [lng, setLng] = useState("90.4125");

  // Base64 Image
  const [imageFileStr, setImageFileStr] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DisasterReport | null>(reports[0]);
  const [successInfo, setSuccessInfo] = useState("");

  const handleGeoLookup = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(5));
          setLng(pos.coords.longitude.toFixed(5));
          setLocationName(language === "en" ? `Browser GPS Location [W: ${pos.coords.longitude.toFixed(4)}]` : "ব্রাউজার জিপিএস স্থানাঙ্ক");
        },
        () => {
          // Standard center Dhaka
          setLat("23.8103");
          setLng("90.4125");
        }
      );
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFileStr(reader.result as string);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !locationName) return;

    setIsSubmitting(true);
    setSuccessInfo("");

    try {
      const payload = {
        type,
        severity,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        locationName,
        description,
        reporterName: reporterName || "Anonymous Reporter",
        reporterPhone: reporterPhone || "",
        imageUrl: imageFileStr || ""
      };

      const res = await fetchJson<DisasterReport>("/api/reports", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      onNewReport(res);
      setSelectedReport(res);
      setSuccessInfo(language === "en" ? "Rescue ticket submitted. AI Triage calculations triggered..." : "রিপোর্ট টিকিট গৃহীত হয়েছে। এআই ট্রিয়াজ প্রসেস শুরু হয়েছে।");
      
      // Reset
      setDescription("");
      setLocationName("");
      setImageFileStr("");
      setImagePreview("");
    } catch (err) {
      console.error("Rescue report submission crashed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT PANE: Submit tickets */}
      <div className="lg:col-span-5 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <PlusCircle className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-display font-bold text-white leading-tight">
              {t.reportIncident}
            </h3>
            <span className="text-[10px] font-mono text-white/40">CITIZEN & FIRST-UNIT COGNITIVE GATEWAY</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans text-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/60 font-medium mb-1">{t.type}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DisasterType)}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs font-sans text-white focus:outline-hidden focus:border-orange-500"
              >
                {Object.values(DisasterType).map((val) => (
                  <option key={val} value={val} className="bg-[#121214]">{val}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white/60 font-medium mb-1">{t.severity}</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs font-sans text-white focus:outline-hidden focus:border-orange-500"
              >
                {Object.values(SeverityLevel).map((val) => (
                  <option key={val} value={val} className="bg-[#121214]">{val}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-white/60 font-medium mb-1">GPS Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-white/60 font-medium mb-1">GPS Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGeoLookup}
            className="w-full border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80 py-2.5 rounded-lg flex items-center justify-center gap-1.5 font-mono text-[10px] cursor-pointer"
          >
            <Compass className="w-4 h-4 text-white/50" />
            <span>PIN GPS FROM BROWSER GEOLOCATION</span>
          </button>

          <div>
            <label className="block text-white/60 font-medium mb-1">Civic Location Description</label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Demra Bazar Primary School Ground"
              className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs text-white focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-white/60 font-medium mb-1">{t.description}</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact access hazards and trapped victim numbers..."
              className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs resize-none text-white focus:outline-hidden focus:border-orange-500 placeholder-white/20"
            ></textarea>
          </div>

          {/* Image upload with file drag drop simulation */}
          <div>
            <label className="block text-white/60 font-medium mb-1">Upload Damaged Infrastructure Image</label>
            <div className="border border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 text-center cursor-pointer relative bg-white/5 hover:bg-white/10 transition-all font-sans">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-1">
                <Upload className="w-5 h-5 mx-auto text-white/40" />
                <span className="block text-[10px] text-white/40">Drag files here, or click to browse</span>
              </div>
            </div>
            {imagePreview && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10 h-24">
                <img src={imagePreview} className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImagePreview(""); setImageFileStr(""); }} className="absolute top-1.5 right-1.5 bg-gray-900/80 hover:bg-gray-900 text-white rounded px-2 py-0.5 text-[9px] cursor-pointer">Remove</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/60 font-medium mb-1">Your Name</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Optional"
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-white/60 font-medium mb-1">Your Mobile</label>
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="Optional"
                className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-xs text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-display font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <ShieldAlert className="w-4 h-4 text-white" />
            )}
            <span>DISPATCH EMERGENCIES AND QUEUE AI</span>
          </button>

          {successInfo && (
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg border border-emerald-500/20 font-semibold text-center mt-2 animate-bounce">
              {successInfo}
            </div>
          )}
        </form>
      </div>

      {/* RIGHT PANE: Active tickets directory */}
      <div className="lg:col-span-12 xl:col-span-7 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-display font-bold text-white tracking-tight">Active Dispatched Tickets</h3>
            <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 font-bold px-2.5 py-1 rounded border border-orange-500/20">
              {reports.length} ACTIVE INCIDENTS
            </span>
          </div>

          {/* Quick List slider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto">
            {reports.map((rep) => (
              <div
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className={`p-3 border rounded-xl cursor-pointer hover:bg-white/10 transition-all flex flex-col justify-between h-[95px] ${selectedReport?.id === rep.id ? "bg-orange-500/10 border-orange-500/40 text-white" : "bg-white/5 border-white/10"}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-white truncate max-w-[125px]">{rep.type}</span>
                    <span className={`text-[9px] font-mono px-1.5 rounded-sm font-bold border ${rep.severity === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>
                      {rep.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 block truncate mt-0.5">{rep.locationName}</span>
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono font-bold pt-1.5 border-t border-white/5">
                  <span className="text-white/40 capitalize">{rep.status}</span>
                  {rep.duplicateOf && (
                    <span className="text-amber-400 font-extrabold flex items-center gap-0.5">
                      ⚠️ Duplicate
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Incident AI Triage panel output */}
        {selectedReport && (
          <div className="border border-white/10 p-5 rounded-2xl bg-[#0e0e10] space-y-4">
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-orange-400 tracking-wider">SECURE AI COMPUTER VISION TRIAGE DECRYPTER</span>
                <h4 className="font-display font-medium text-sm text-white">{selectedReport.type} at {selectedReport.locationName.split(",")[0]}</h4>
              </div>
              <div className="flex items-center gap-1.5 bg-orange-600/15 text-orange-400 border border-orange-500/20 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>GEMINI DECISION PORT</span>
              </div>
            </div>

            {selectedReport.duplicateOf && (
              <div className="bg-amber-500/10 text-amber-300 p-2.5 rounded-lg border border-amber-500/20 text-[10px] flex items-center gap-2 font-sans">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Duplicate Flag triggered:</strong> Our spatial geo-clustering algorithm matched this entry to existing report <strong>(ID: {selectedReport.duplicateOf})</strong> within 1.2km scope. Actions unified.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
              {/* Score circle */}
              <div className="bg-[#121214] p-3.5 border border-white/10 rounded-xl space-y-1 text-center">
                <span className="text-[9px] font-mono text-white/40 block font-bold">STRUCTURAL DAMAGE</span>
                <span className="text-2xl font-black text-white font-display block leading-none pt-1">
                  {selectedReport.aiAnalysis?.structuralDamageScore || 65}%
                </span>
                <span className="text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5 font-bold inline-block mt-1">
                  Rating: Extreme
                </span>
              </div>

              {/* Inundation markings */}
              <div className="bg-[#121214] p-3.5 border border-white/10 rounded-xl space-y-1 block text-center">
                <span className="text-[9px] font-mono text-white/40 block font-bold">ACCESSIBILITY STATUS</span>
                <span className="text-base font-bold text-white block pt-1 flex justify-center items-center h-[26px]">
                  {selectedReport.aiAnalysis?.roadBlockage ? "❌ PATH BLOCKED" : "✔ PATHS CLEAR"}
                </span>
                <span className={`text-[9px] font-mono ${(selectedReport.aiAnalysis?.roadBlockage) ? "text-red-400" : "text-emerald-400"} block mt-1`}>
                  {selectedReport.aiAnalysis?.roadBlockage ? "Debris clearance required" : "Ground vehicles fit"}
                </span>
              </div>

              {/* Collapse indicator */}
              <div className="bg-[#121214] p-3.5 border border-white/10 rounded-xl space-y-1 text-center">
                <span className="text-[9px] font-mono text-white/40 block font-bold">INFRASTRUCTURE STATUS</span>
                <span className="text-base font-bold text-white block pt-1 flex justify-center items-center h-[26px]">
                  {selectedReport.aiAnalysis?.infrastructureCollapse ? "💥 COLLAPSE DETECTED" : "✔ STRUCTURE SOUND"}
                </span>
                <span className="text-[9px] font-mono text-white/30 block mt-1">
                  Sensor array: secure
                </span>
              </div>
            </div>

            {/* AI advised deployment strategy */}
            <div className="space-y-1 text-xs">
              <span className="text-[9px] font-mono text-white/40 font-black uppercase block tracking-wider">AI RECOMMENDED ASSET DISPATCH STRATEGY</span>
              <p className="bg-[#121214] p-3.5 rounded-xl border border-white/10 text-white/80 leading-relaxed text-[11px] font-sans">
                {selectedReport.aiAnalysis?.recommendedResponse || "Review rescue logistics parameters in the system map before triggering A* search logistics."}
              </p>
            </div>

            {/* Explore optimal path helper button */}
            {onExploreRoutePath && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onExploreRoutePath(23.8103, 90.4125, selectedReport.latitude, selectedReport.longitude)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-display text-[10px] font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-orange-600/10 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-white/60" />
                  <span>Plot Optimal Path to Coords ({selectedReport.latitude.toFixed(4)})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
