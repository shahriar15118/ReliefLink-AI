import { useEffect, useRef, useState } from "react";
import { DisasterReport, Shelter, SOSAlert, RouteStep } from "../types";
import { Search, Shield, MapPin, Navigation } from "lucide-react";

interface MapPortalProps {
  reports: DisasterReport[];
  shelters: Shelter[];
  sosAlerts: SOSAlert[];
  activeRoutePath?: RouteStep[];
  onSelectReport?: (report: DisasterReport) => void;
  language: "en" | "bn";
}

export default function MapPortal({
  reports,
  shelters,
  sosAlerts,
  activeRoutePath,
  onSelectReport,
  language
}: MapPortalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const markersGroupRef = useRef<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Disasters" | "Shelters" | "Active SOS">("All");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  // Fallback map simulation if Leaflet CDN fails to load
  const [isLeafletAvailable, setIsLeafletAvailable] = useState<boolean>(true);

  useEffect(() => {
    if (!(window as any).L) {
      console.warn("ReliefLink AI: Leaflet not detected on window. Running interactive spatial grid canvas.");
      setIsLeafletAvailable(false);
      return;
    }

    const L = (window as any).L;

    // Initialize map if not loaded
    if (!mapRef.current && mapContainerRef.current) {
      try {
        // Center around Dhaka regional coordinates primarily
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true
        }).setView([23.8103, 90.4125], 12);

        // Load OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> contributors'
        }).addTo(mapRef.current);
      } catch (err) {
        console.error("Leaflet initialization crash:", err);
        setIsLeafletAvailable(false);
      }
    }

    return () => {
      // Map cleanup if components fully unmount
    };
  }, []);

  // Update Markers inside map
  useEffect(() => {
    if (!mapRef.current || !(window as any).L) return;
    const L = (window as any).L;

    // Remove old markers
    markersGroupRef.current.forEach(m => m.remove());
    markersGroupRef.current = [];

    // Filter points
    const terms = searchQuery.toLowerCase();
    
    // Draw Disaster Markers
    if (filterType === "All" || filterType === "Disasters") {
      reports
        .filter(r => r.locationName.toLowerCase().includes(terms) || r.type.toLowerCase().includes(terms))
        .forEach(rep => {
          // Color code severity
          const color = rep.severity === "Critical" ? "#f97316" : rep.severity === "High" ? "#ea580c" : "#eab308";
          
          const circle = L.circle([rep.latitude, rep.longitude], {
            color: color,
            fillColor: color,
            fillOpacity: 0.4,
            radius: rep.severity === "Critical" ? 350 : 200
          }).addTo(mapRef.current);

          const popupContent = `
            <div style="font-family: inherit; font-size: 11px; padding: 4px; min-width: 151px;">
              <strong style="color: ${color}; font-size:12px;">🚨 ${rep.type} - ${rep.severity}</strong><br/>
              <strong>Location:</strong> ${rep.locationName}<br/>
              <strong>Status:</strong> ${rep.status}<br/>
              <strong>Description:</strong> ${rep.description.substring(0, 100)}...<br/>
            </div>
          `;
          
          circle.bindPopup(popupContent);
          
          // Click handler to connect with core
          circle.on("click", () => {
            setActiveReportId(rep.id);
            if (onSelectReport) onSelectReport(rep);
          });

          markersGroupRef.current.push(circle);
        });
    }

    // Draw Shelter Markers
    if (filterType === "All" || filterType === "Shelters") {
      shelters
        .filter(s => s.name.toLowerCase().includes(terms))
        .forEach(shelter => {
          const capPercent = Math.round((shelter.occupancy / shelter.capacity) * 100);
          const colorStr = capPercent > 85 ? "#ef4444" : "#10b981";

          const circle = L.circle([shelter.latitude, shelter.longitude], {
            color: colorStr,
            fillColor: colorStr,
            fillOpacity: 0.6,
            radius: 250
          }).addTo(mapRef.current);

          const popupContent = `
            <div style="font-family: inherit; font-size: 11px; padding: 4px;">
              <strong style="color: ${colorStr}; font-size:12px;">🛖 ${shelter.name}</strong><br/>
              <strong>Intake:</strong> ${shelter.occupancy}/${shelter.capacity} (${capPercent}%)<br/>
              <strong>Rations Status:</strong> ${shelter.foodAvailability === "Adequate" ? "充足" : "Low"}<br/>
              <strong>Medical Desk:</strong> ${shelter.medicalStatus}
            </div>
          `;
          
          circle.bindPopup(popupContent);
          markersGroupRef.current.push(circle);
        });
    }

    // Draw active SOS flares
    if (filterType === "All" || filterType === "Active SOS") {
      sosAlerts
        .filter(a => a.name.toLowerCase().includes(terms) || a.currentNeeds.toLowerCase().includes(terms))
        .forEach(sos => {
          if (sos.status === "Resolved") return;
          
          const pulse = L.circle([sos.latitude, sos.longitude], {
            color: "#f97316",
            fillColor: "#ffedd5",
            fillOpacity: 0.8,
            radius: 120,
            weight: 3
          }).addTo(mapRef.current);

          const content = `
            <div style="font-family: inherit; font-size: 11px; padding: 4px; font-weight: 500;">
              <span style="background: #f97316; color:white; padding:1px 4px; border-radius:3px; font-weight:bold; font-size:9px;">CRITICAL SOS</span><br/>
              <strong>Name:</strong> ${sos.name}<br/>
              <strong>Needs:</strong> ${sos.currentNeeds}<br/>
              <strong>Phone:</strong> ${sos.phone}
            </div>
          `;

          pulse.bindPopup(content);
          markersGroupRef.current.push(pulse);
        });
    }

  }, [reports, shelters, sosAlerts, searchQuery, filterType, onSelectReport]);

  // Handle polyline route overlay drawing with smooth path animation
  useEffect(() => {
    if (!mapRef.current || !(window as any).L) return;
    const L = (window as any).L;

    // Clear existing polyline path
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (activeRoutePath && activeRoutePath.length > 0) {
      const coordinates = activeRoutePath.map(step => [step.latitude, step.longitude]);
      
      routePolylineRef.current = L.polyline(coordinates, {
        color: "#f97316", // orange core matching layout
        weight: 6,
        opacity: 0.85,
        dashArray: "10, 10",
        lineJoin: "round"
      }).addTo(mapRef.current);

      // Pan to fit the route on screen
      try {
        const bounds = L.latLngBounds(coordinates);
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      } catch (err) {
        console.warn("Bounds fitting delayed:", err);
      }
    }
  }, [activeRoutePath]);

  // Center Map on a report coord click
  const centerOnCoord = (lat: number, lng: number, reportId: string) => {
    setActiveReportId(reportId);
    if (mapRef.current && (window as any).L) {
      mapRef.current.setView([lat, lng], 14);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-lg h-[650px]" id="map-portal">
      {/* Sidebar event filtering ledger */}
      <div className="lg:col-span-1 border-r border-white/10 p-4 flex flex-col gap-4 overflow-y-auto bg-[#0e0e10]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-orange-400 font-bold bg-orange-600/10 border border-orange-500/20 px-2 py-0.5 rounded tracking-wider uppercase">LIVE DATA MARGIN</span>
          <h3 className="font-display font-semibold text-base text-white">
            {language === "en" ? "Crisis Directory Selector" : "ক্রাইসিস ডিরেক্টরি ফিল্টার"}
          </h3>
        </div>

        {/* Live Directory Filter toggles */}
        <div className="flex flex-col gap-1">
          {(["All", "Disasters", "Shelters", "Active SOS"] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs px-3 py-2 text-left rounded-lg font-medium transition-all flex items-center justify-between cursor-pointer ${filterType === type ? "bg-orange-600 text-white font-semibold" : "hover:bg-white/5 text-white/70 hover:text-white"}`}
            >
              <span>{type === "Active SOS" ? "⚠️ Active SOS" : type === "Disasters" ? "🚨 Disasters" : type === "Shelters" ? "🛖 Shelters" : "🌐 All System Assets"}</span>
              <span className="text-[10px] font-mono bg-white/15 px-1.5 py-0.5 rounded text-white">
                {type === "All" && (reports.length + shelters.length + sosAlerts.length)}
                {type === "Disasters" && reports.length}
                {type === "Shelters" && shelters.length}
                {type === "Active SOS" && sosAlerts.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search input field widget */}
        <div className="relative">
          <Search className="absolute left-2.5 top-3.5 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "en" ? "Search locations, wards..." : "অনুসন্ধান করুন..."}
            className="w-full bg-white/5 border border-white/10 text-white text-xs pl-8 pr-3 py-2.5 rounded-lg focus:outline-hidden focus:border-orange-500 placeholder-white/30"
          />
        </div>

        {/* Directory details render */}
        <div className="flex-1 space-y-2 mt-2">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block font-bold">DIRECTORY EVENTS LISTING</span>
          
          <div className="space-y-2 divide-y divide-white/5">
            {(filterType === "Disasters" || filterType === "All") ? (
              reports.map(rep => (
                <div
                  key={rep.id}
                  onClick={() => centerOnCoord(rep.latitude, rep.longitude, rep.id)}
                  className={`pt-2.5 pb-1 cursor-pointer transition-all ${activeReportId === rep.id ? "bg-orange-600/10 px-2 rounded-lg border-l-4 border-orange-500 text-white" : "hover:bg-white/5 text-white/80"}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-display text-white block truncate max-w-[140px]">{rep.type}</span>
                    <span className={`text-[9px] font-mono px-1.5 rounded-sm font-bold border ${rep.severity === "Critical" ? "bg-red-500/15 text-red-400 border-red-500/25" : rep.severity === "High" ? "bg-orange-500/15 text-orange-400 border-orange-500/25" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"}`}>
                      {rep.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 block truncate mt-0.5">{rep.locationName}</span>
                </div>
              ))
            ) : null}

            {filterType === "Shelters" ? (
              shelters.map(sh => (
                <div
                  key={sh.id}
                  onClick={() => centerOnCoord(sh.latitude, sh.longitude, sh.id)}
                  className="pt-2.5 pb-1 cursor-pointer hover:bg-white/5 text-white/80"
                >
                  <span className="text-xs font-semibold text-white block truncate">{sh.name}</span>
                  <div className="flex justify-between text-[10px] text-white/40 mt-0.5">
                    <span>Intake: {sh.occupancy}/{sh.capacity} persons</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {Math.round((sh.occupancy / sh.capacity) * 100)}% Occupied
                    </span>
                  </div>
                </div>
              ))
            ) : null}

            {filterType === "Active SOS" ? (
              sosAlerts.map(sos => (
                <div
                  key={sos.id}
                  onClick={() => centerOnCoord(sos.latitude, sos.longitude, sos.id)}
                  className="pt-2.5 pb-1 cursor-pointer hover:bg-white/5 text-white/80"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
                    <span className="text-xs font-bold text-orange-400 truncate block">{sos.name}</span>
                  </div>
                  <p className="text-[10px] text-white/40 truncate mt-0.5">{sos.currentNeeds}</p>
                </div>
              ))
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Map Frame display */}
      <div className="lg:col-span-3 border-l border-white/10 relative h-full bg-[#121214]">
        {isLeafletAvailable ? (
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        ) : (
          /* Fallback Mock Interactive Grid in case local container blocks Leaflet downloads */
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0e0e10] text-white p-6 space-y-6">
            <div className="text-center space-y-2">
              <Shield className="w-12 h-12 text-orange-500 mx-auto animate-bounce" />
              <h4 className="font-display font-medium text-lg leading-tight">Interactive Area Coordinate Matrix</h4>
              <p className="text-white/40 text-xs max-w-md font-sans">
                Active routes and coordinates telemetry are simulated numerically on the matrix system below.
              </p>
            </div>

            <div className="bg-[#121214] font-mono border border-white/10 p-4 rounded-xl max-w-lg w-full text-xs space-y-3">
              <div className="flex justify-between text-white/40 border-b border-white/10 pb-2">
                <span>Active Target Sector Coords</span>
                <span>Triage Indicator Score</span>
              </div>
              {reports.map((r) => (
                <div key={r.id} className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span>Sector [{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}] &bull; {r.type}</span>
                  </div>
                  <span className="text-orange-400 font-bold">Score {r.aiAnalysis?.structuralDamageScore || 65}%</span>
                </div>
              ))}

              {activeRoutePath && activeRoutePath.length > 0 && (
                <div className="border-t border-dashed border-orange-500/30 pt-3 space-y-1">
                  <span className="text-orange-400 font-bold block flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-orange-500 animate-spin" />
                    Optimal Response Path A* Routing Steps:
                  </span>
                  <div className="max-h-24 overflow-y-auto pl-2 border-l border-orange-500 py-1 space-y-1">
                    {activeRoutePath.map((step, idx) => (
                      <span key={idx} className="block text-[10px] text-white/50">
                        ({idx + 1}) Coords: [{step.latitude}, {step.longitude}] &bull; {step.roadName} (Risk: {step.riskFactor})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
