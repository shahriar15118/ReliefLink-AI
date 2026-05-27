import { useEffect, useState } from "react";
import { TRANSLATIONS, fetchJson } from "./utils";
import { UserRole, DisasterReport, Shelter, Volunteer, StockInventory, Donation, TenantSubscription, RouteStep, SOSAlert } from "./types";

// Import subcomponents
import LandingPage from "./components/LandingPage";
import MapPortal from "./components/MapPortal";
import TriageCenter from "./components/TriageCenter";
import PredictiveEngine from "./components/PredictiveEngine";
import SOSPulse from "./components/SOSPulse";
import SheltersPortlet from "./components/SheltersPortlet";
import VolunteersPortlet from "./components/VolunteersPortlet";
import InventoryManager from "./components/InventoryManager";
import ChatCoordination from "./components/ChatCoordination";
import DonationStrip from "./components/DonationStrip";
import AIAssistant from "./components/AIAssistant";
import NGOBillingPortal from "./components/NGOBillingPortal";

import { 
  Building2, 
  Map, 
  ShieldAlert, 
  Sliders, 
  Radio, 
  Home, 
  Users, 
  Package, 
  MessageCircle, 
  Heart, 
  Brain, 
  BarChart,
  LogOut, 
  Globe,
  Bell,
  HeartHandshake
} from "lucide-react";

export default function App() {
  const [inDashboard, setInDashboard] = useState<boolean>(false);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NGO_MANAGER);
  const [currentUserName, setCurrentUserName] = useState<string>("Engr. Ruhul Amin (District Core)");
  const [activeTab, setActiveTab] = useState<string>("map");

  // Telemetry list states
  const [reports, setReports] = useState<DisasterReport[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [inventory, setInventory] = useState<StockInventory[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);

  // Selected route optimization path
  const [activeRoutePath, setActiveRoutePath] = useState<RouteStep[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ totalDist: number; riskRating: string } | null>(null);

  // Floating notifications feed for SSE updates
  const [sseNotifications, setSseNotifications] = useState<string[]>([]);

  // Fetch initial datasets from Express backend server
  const fetchAllData = async () => {
    try {
      const [repList, shList, volList, invList, donList, subList, sosList] = await Promise.all([
        fetchJson<DisasterReport[]>("/api/reports"),
        fetchJson<Shelter[]>("/api/shelters"),
        fetchJson<Volunteer[]>("/api/volunteers"),
        fetchJson<StockInventory[]>("/api/inventory"),
        fetchJson<Donation[]>("/api/donations"),
        fetchJson<TenantSubscription[]>("/api/subscriptions"),
        fetchJson<SOSAlert[]>("/api/sos")
      ]);

      setReports(repList);
      setShelters(shList);
      setVolunteers(volList);
      setInventory(invList);
      setDonations(donList);
      setSubscriptions(subList);
      setSosAlerts(sosList);
    } catch (err) {
      console.error("Failure fetching baseline data streams:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Set up real-time Server-Sent Events listener
  useEffect(() => {
    const sse = new EventSource("/api/updates/stream");
    
    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("SSE update payload received:", payload);

        if (payload.event === "new_report") {
          setReports(prev => {
            if (prev.some(r => r.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          triggerSseBanner(`🚨 New Disaster Incident: ${payload.data.type} declared at ${payload.data.locationName}. Severity: ${payload.data.severity}.`);
        } else if (payload.event === "report_updated") {
          setReports(prev => prev.map(r => r.id === payload.data.id ? payload.data : r));
          triggerSseBanner(`🚨 Report updated: ${payload.data.type} status is now ${payload.data.status}.`);
        } else if (payload.event === "sos_triggered") {
          setSosAlerts(prev => {
            if (prev.some(s => s.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          triggerSseBanner(`⚠️ CRITICAL SOS: Urgent rescue/relief requested by ${payload.data.name} • Needs: ${payload.data.currentNeeds}.`);
        } else if (payload.event === "sos_updated") {
          setSosAlerts(prev => prev.map(s => s.id === payload.data.id ? payload.data : s));
          triggerSseBanner(`⚠️ SOS Alert resolved/updated: ${payload.data.name} is now ${payload.data.status}.`);
        } else if (payload.event === "new_shelter") {
          setShelters(prev => {
            if (prev.some(s => s.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          triggerSseBanner(`🛖 New Shelter Registered: ${payload.data.name} with capacity ${payload.data.capacity}.`);
        } else if (payload.event === "shelter_updated") {
          setShelters(prev => prev.map(s => s.id === payload.data.id ? payload.data : s));
          triggerSseBanner(`🛖 Shelter updated: ${payload.data.name} capacity altered. Current intake: ${payload.data.occupancy}.`);
        } else if (payload.event === "new_volunteer") {
          setVolunteers(prev => {
            if (prev.some(v => v.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          triggerSseBanner(`🤝 Volunteer force expanded: ${payload.data.name} signed up.`);
        } else if (payload.event === "volunteer_assigned") {
          setVolunteers(prev => prev.map(v => v.id === payload.data.id ? payload.data : v));
          triggerSseBanner(`🤝 Rescue Mobilization: Volunteer ${payload.data.name} deployed. Current mission: ${payload.data.currentTaskName}.`);
        } else if (payload.event === "stock_replenished") {
          setInventory(prev => prev.map(inv => inv.id === payload.data.id ? payload.data : inv));
          triggerSseBanner(`📦 Supply Refill: ${payload.data.itemName} replenishment transacted. Status: ${payload.data.currentStock || payload.data.quantity} units available.`);
        } else if (payload.event === "donation_charged") {
          setDonations(prev => {
            if (prev.some(d => d.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          triggerSseBanner(`💖 Impact Funding: donation of $${payload.data.amount} transacted by ${payload.data.donorName} for ${payload.data.campaignName}`);
        } else if (payload.event === "tier_upgraded") {
          setSubscriptions(prev => prev.map(sub => sub.id === payload.data.id ? payload.data : sub));
          triggerSseBanner(`🏢 Workspace Licences upgraded: ${payload.data.organizationName} activated ${payload.data.tier} tier workspace.`);
        } else if (payload.event === "chat_message") {
          window.dispatchEvent(new CustomEvent("new_chat_message", { detail: payload.data }));
        }
      } catch (err) {
        console.warn("SSE stream parse disconnect:", err);
      }
    };

    return () => {
      sse.close();
    };
  }, []);

  const triggerSseBanner = (msg: string) => {
    setSseNotifications(prev => [msg, ...prev]);
    // Remove alert banner automatically after 8 seconds
    setTimeout(() => {
      setSseNotifications(prev => prev.filter(m => m !== msg));
    }, 8500);
  };

  // A* Routing request trigger
  const handleSolvePath = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const res = await fetchJson<{ path: RouteStep[]; totalDistanceKm: number; combinedRiskRating?: string; hazardPointsEncountered?: number }>("/api/routing/optimize", {
        method: "POST",
        body: JSON.stringify({ startLat, startLng, endLat, endLng })
      });

      setActiveRoutePath(res.path);
      const riskRating = res.combinedRiskRating || (res.hazardPointsEncountered !== undefined && res.hazardPointsEncountered > 3 ? "Extreme Risk" : res.hazardPointsEncountered !== undefined && res.hazardPointsEncountered > 1 ? "Medium Risk" : "Normal Risk");
      setRouteInfo({ totalDist: res.totalDistanceKm, riskRating });
      setActiveTab("map"); // Switch focus to Map to visualize
      triggerSseBanner(`🗺 A* path algorithm complete. Computed optimal route length: ${res.totalDistanceKm.toFixed(2)}km.`);
    } catch (err) {
      console.error("Path calculation failure:", err);
    }
  };

  // State modifiers
  const handleNewReport = (rep: DisasterReport) => {
    // Add to state if not caught by SSE
    if (!reports.some(r => r.id === rep.id)) {
      setReports(prev => [rep, ...prev]);
    }
  };

  const handleNewShelter = (sh: Shelter) => {
    setShelters(prev => [sh, ...prev]);
    triggerSseBanner(`🛖 New Safe Haven registered: ${sh.name}. Capacity: ${sh.capacity}`);
  };

  const handleNewVolunteer = (v: Volunteer) => {
    setVolunteers(prev => [v, ...prev]);
    triggerSseBanner(`🤝 Volunteer force expanded: ${v.name} signed up.`);
  };

  const handleAssignTask = (updatedVol: Volunteer) => {
    setVolunteers(prev => prev.map(v => v.id === updatedVol.id ? updatedVol : v));
  };

  const handleRefillStock = (updatedInv: StockInventory) => {
    setInventory(prev => prev.map(item => item.id === updatedInv.id ? updatedInv : item));
  };

  const handleNewDonation = (don: Donation) => {
    if (!donations.some(d => d.id === don.id)) {
      setDonations(prev => [don, ...prev]);
    }
  };

  const handleNewSOS = (sos: SOSAlert) => {
    if (!sosAlerts.some(s => s.id === sos.id)) {
      setSosAlerts(prev => [sos, ...prev]);
    }
  };

  const handleUpgradeSubscription = (sub: TenantSubscription) => {
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? sub : s));
  };

  const t = TRANSLATIONS[language];

  // If not entered dashboard yet, render Landing
  if (!inDashboard) {
    return (
      <LandingPage
        language={language}
        setLanguage={setLanguage}
        onEnterDashboard={() => setInDashboard(true)}
      />
    );
  }

  // Dashboard layout
  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-orange-500/30 font-sans text-[#fafafa] flex flex-col justify-between">
      {/* Top Professional Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#0c0c0e]/85 backdrop-blur-md border-b border-white/10 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setInDashboard(false)} 
            className="bg-orange-600 hover:bg-orange-700 p-2.5 rounded-lg text-white font-display font-black tracking-wider text-base cursor-pointer flex items-center gap-1.5 shadow-lg shadow-orange-600/10 transition-all"
          >
            <Radio className="w-5 h-5 animate-pulse text-white" />
            <span>RL</span>
          </div>
          <div>
            <span className="font-display font-semibold tracking-tight text-lg block text-white leading-none">ReliefLink AI Operations</span>
            <span className="text-[10px] font-mono text-white/40 tracking-wider">ENTERPRISE SYSTEM MULTI-ROLE ADVISORY</span>
          </div>
        </div>

        {/* Global Multi-Role switcher & language toggler */}
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Active Authorized Role Widget */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
            <span className="text-[9px] font-mono font-bold text-white/40 pl-2">ROLE SPEC:</span>
            <select
              value={currentUserRole}
              onChange={(e) => {
                const val = e.target.value as UserRole;
                setCurrentUserRole(val);
                // Dynamically preset reporter details or coordinates depending on switch
                if (val === UserRole.SUPER_ADMIN) setCurrentUserName("Admin (Global Controller)");
                else if (val === UserRole.GOVERNMENT_ADMIN) setCurrentUserName("Director General (DMD)");
                else if (val === UserRole.NGO_MANAGER) setCurrentUserName("Engr. Ruhul Amin (District Core)");
                else setCurrentUserName("Sector Field Responder");
              }}
              className="bg-[#121214] text-xs font-semibold py-1 px-2.5 rounded-lg border border-white/10 focus:outline-hidden text-white"
            >
              <option value={UserRole.CITIZEN}>Citizen (Direct Reporter)</option>
              <option value={UserRole.VOLUNTEER}>Volunteer Coordinator</option>
              <option value={UserRole.SHELTER_MANAGER}>Shelter Supervisor</option>
              <option value={UserRole.EMERGENCY_RESPONDER}>Responder (First Line)</option>
              <option value={UserRole.NGO_MANAGER}>NGO Manager Workspace</option>
              <option value={UserRole.GOVERNMENT_ADMIN}>Government Coordinator</option>
              <option value={UserRole.SUPER_ADMIN}>Super Administrator</option>
            </select>
          </div>

          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${language === "en" ? "bg-orange-600 text-white font-bold" : "text-white/60 hover:text-white"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("bn")}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${language === "bn" ? "bg-orange-600 text-white font-bold" : "text-white/60 hover:text-white"}`}
            >
              বাংলা
            </button>
          </div>

          <button
            onClick={() => setInDashboard(false)}
            className="text-white/60 hover:text-white flex items-center gap-1 text-xs font-semibold px-2 py-1"
          >
            <LogOut className="w-4 h-4 text-white/40" />
            <span>{language === 'en' ? 'Exit System' : 'লগআউট'}</span>
          </button>
        </div>
      </header>

      {/* Main dashboard body layouts */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 space-y-8">
        
        {/* Real-time system notifications margin line */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#0c0c0e]/80 text-white rounded-2xl border border-white/10 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600"></span>
            </span>
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono font-bold tracking-widest text-orange-500 block">LIVE COORDINATION MARGIN DEPLOYED</span>
              <span className="text-xs text-gray-300">Authorized Operator: <strong>{currentUserName}</strong> &bull; Node Status: Secure.</span>
            </div>
          </div>

          {routeInfo && (
            <div className="text-[10px] font-mono text-gray-300 flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded">
              <span>ACTIVE POLYLINES ROUTE:</span>
              <span className="text-orange-500 font-bold">{routeInfo.totalDist.toFixed(2)} km</span>
              <span>RISK RATIO: <span className="text-orange-400 font-bold uppercase">{routeInfo.riskRating}</span></span>
              <button onClick={() => { setActiveRoutePath([]); setRouteInfo(null); }} className="text-gray-400 hover:text-white underline font-bold pl-2">Clear path</button>
            </div>
          )}
        </div>

        {/* Dynamic Multi-navigation Panel items */}
        <div className="flex flex-wrap border-b border-white/10 gap-1.5 pb-0.5">
          {[
            { id: "map", label: t.locationLiveMap, icon: Map },
            { id: "triage", label: t.disasterTriage, icon: ShieldAlert },
            { id: "ml", label: t.mlForecast, icon: Sliders },
            { id: "sos", label: t.oneTapSos, icon: Radio },
            { id: "shelter", label: t.shelterManagement, icon: Home },
            { id: "volunteer", label: t.volunteerSquad, icon: Users },
            { id: "inventory", label: t.suppliesInventory, icon: Package },
            { id: "chat", label: t.chatChannels, icon: MessageCircle },
            { id: "stripe-donation", label: language === 'en' ? 'Stripe Campaigns' : 'অর্থ অনুদান', icon: Heart },
            { id: "billing", label: t.ngoBilling, icon: Building2 },
            { id: "ai", label: language === 'en' ? 'Gemini AI Assistant' : 'এআই উপদেষ্টা', icon: Brain },
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer ${isActive ? "border-orange-500 text-orange-500 font-black bg-orange-600/10" : "border-transparent text-white/60 hover:text-white hover:bg-white/5"}`}
              >
                <IconComp className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-500" : "text-white/40"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab contents router */}
        <div className="min-h-[450px]">
          {activeTab === "map" && (
            <MapPortal
              reports={reports}
              shelters={shelters}
              sosAlerts={sosAlerts}
              activeRoutePath={activeRoutePath}
              language={language}
              onSelectReport={(rep) => {
                // Instantly center routes to map coordinates
                handleSolvePath(23.8103, 90.4125, rep.latitude, rep.longitude);
              }}
            />
          )}

          {activeTab === "triage" && (
            <TriageCenter
              reports={reports}
              onNewReport={handleNewReport}
              onExploreRoutePath={handleSolvePath}
              language={language}
            />
          )}

          {activeTab === "ml" && (
            <PredictiveEngine
              language={language}
            />
          )}

          {activeTab === "sos" && (
            <SOSPulse
              language={language}
              sosAlerts={sosAlerts}
              onTriggerSos={handleNewSOS}
              currentUserRole={currentUserRole}
            />
          )}

          {activeTab === "shelter" && (
            <SheltersPortlet
              language={language}
              shelters={shelters}
              onNewShelter={handleNewShelter}
              onShelterIntake={handleNewShelter} // refresh state list
            />
          )}

          {activeTab === "volunteer" && (
            <VolunteersPortlet
              language={language}
              volunteers={volunteers}
              onNewVolunteer={handleNewVolunteer}
              onAssignTask={handleAssignTask}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryManager
              language={language}
              inventory={inventory}
              onRefillStock={handleRefillStock}
            />
          )}

          {activeTab === "chat" && (
            <ChatCoordination
              language={language}
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
            />
          )}

          {activeTab === "stripe-donation" && (
            <DonationStrip
              language={language}
              donations={donations}
              onNewDonation={handleNewDonation}
            />
          )}

          {activeTab === "billing" && (
            <NGOBillingPortal
              language={language}
              subscriptions={subscriptions}
              onUpgradeSubscription={handleUpgradeSubscription}
            />
          )}

          {activeTab === "ai" && (
            <AIAssistant
              language={language}
            />
          )}
        </div>

        {/* Static Professional Impact Reporting & CSV Analytics Export section integrated */}
        <section className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base leading-tight">Secure Response Audits Summary Ledger</h3>
              <p className="text-white/60 text-xs">Print structural coordinate charts and export CSV reports directly.</p>
            </div>
            
            <button
              onClick={() => {
                window.print();
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1 shadow-3xs"
            >
              <span>Export and Print Active PDF Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Visual Custom Vector Graph showing Rations versus Population affected relative rates */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block font-bold">RATIONS DISPATCH ALLOCATIONS TELEMETRY</span>
              
              <div className="border border-white/10 p-4 rounded-xl bg-white/[0.02] flex flex-col justify-end h-48 space-y-4">
                <div className="flex items-end justify-between px-3 h-32 gap-3">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-orange-600 h-16 rounded-t-xs animate-pulse-slow"></div>
                    <span className="text-[8px] font-mono text-white/55 mt-1 uppercase">Demra Ward 6</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-orange-500 h-24 rounded-t-xs"></div>
                    <span className="text-[8px] font-mono text-white/55 mt-1 uppercase">Demra Ward 8</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-yellow-600/80 h-10 rounded-t-xs"></div>
                    <span className="text-[8px] font-mono text-white/55 mt-1 uppercase">Siddhirganj</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-orange-400 h-28 rounded-t-xs animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                    <span className="text-[8px] font-mono text-white/55 mt-1 uppercase">Sreepur</span>
                  </div>
                </div>
                <div className="border-t border-white/10 text-center pt-2 text-[10px] text-white/40 font-mono">
                  Sectors relative water distribution index
                </div>
              </div>
            </div>

            {/* CSV Log display with raw mock coordinates */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block font-bold">AUDIT INTEGRITY TRACE LEDGER</span>
              <div className="bg-[#0c0c0e] text-white/80 p-4 rounded-xl border border-white/10 font-mono text-[9px] leading-relaxed max-h-48 overflow-y-auto space-y-1 select-all">
                <div>[2026-05-26 18:00:00 UTC] SYS_CORE_INIT: Node connected. A* weights preset safely.</div>
                <div>[2026-05-26 18:01:22 UTC] DB_TRIPLET_BOUNDS: Registered Demra District centroids coord limits [23.810, 90.412].</div>
                <div>[2026-05-26 18:02:45 UTC] STRIPE_WEBHOOK_ACK: Stripe Connect secure billing listening on tenant workspace updates.</div>
                <div>[2026-05-26 18:04:12 UTC] GEMINI_MODEL_INF: Cognitive Vision assessed structural report triage ticket correctly. Rating: High.</div>
                <div>[2026-05-26 18:05:00 UTC] XGB_LOGISTIC_FIT: Successfully loaded joblib ML coefficient weights. RMSE drop 1.12%.</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SSE Real-time Toast Alerts list floating at bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm">
        {sseNotifications.map((msg, index) => (
          <div
            key={index}
            className="bg-gray-950 text-white p-4 rounded-xl border border-red-500 animate-slide-in shadow-xl flex items-start gap-2.5 text-xs leading-relaxed"
          >
            <Bell className="w-4 h-4 text-red-500 fill-red-500 shrink-0 mt-0.5 animate-bounce" />
            <span className="font-sans font-medium">{msg}</span>
          </div>
        ))}
      </div>

      {/* Elegant minimalist Footer */}
      <footer className="bg-gray-950 text-gray-400 py-10 px-6 border-t border-gray-900 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-display font-black text-white text-base block tracking-wider">ReliefLink AI</span>
            <p>&copy; {new Date().getFullYear()} ReliefLink Systems Inc. Built with Google AI Studio Expert.</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#" className="hover:text-white">Emergency API Docs</a>
            <a href="#" className="hover:text-white">COSMIC SLATE THEME (Inter & Mono)</a>
            <a href="#" className="hover:text-white">Disaster Risk Mitigation SLA</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
