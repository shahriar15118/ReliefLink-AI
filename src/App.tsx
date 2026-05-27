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
  HeartHandshake,
  Satellite,
  Activity
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
  
  // Real-time Automatic Satellite & Altimetry state
  const [satelliteData, setSatelliteData] = useState<{
    satelliteName: string;
    altitudeKm: number;
    precipitationIndex: number;
    windSpeedKph: number;
    submergenceWaterLevelM: number;
    inundatedAreaSqKm: number;
    cloudCoverPercent: number;
    lastSatelliteSync: string;
  }>({
    satelliteName: "Sentinel-6 Michael Freilich",
    altitudeKm: 1336.52,
    precipitationIndex: 124.5,
    windSpeedKph: 54.2,
    submergenceWaterLevelM: 4.12,
    inundatedAreaSqKm: 345.8,
    cloudCoverPercent: 88,
    lastSatelliteSync: new Date().toISOString()
  });

  // Selected route optimization path
  const [activeRoutePath, setActiveRoutePath] = useState<RouteStep[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ totalDist: number; riskRating: string } | null>(null);

  // Rich list of notifications (both toast popups and persistent dropdown history)
  type NotificationType = 'critical' | 'info' | 'success' | 'warning';
  interface ReliefNotification {
    id: string;
    message: string;
    timestamp: Date;
    type: NotificationType;
    tabLink?: string;
    entityId?: string;
    isSimulated?: boolean;
    unread: boolean;
  }

  const [notifications, setNotifications] = useState<ReliefNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<ReliefNotification[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);
  const [muteSimulations, setMuteSimulations] = useState<boolean>(true); // DEFAULT MUTING PERIODIC SPAM JITTER
  const [muteAllToasts, setMuteAllToasts] = useState<boolean>(false);

  // Fetch initial datasets from Express backend server
  const fetchAllData = async () => {
    try {
      const [repList, shList, volList, invList, donList, subList, sosList, satData] = await Promise.all([
        fetchJson<DisasterReport[]>("/api/reports"),
        fetchJson<Shelter[]>("/api/shelters"),
        fetchJson<Volunteer[]>("/api/volunteers"),
        fetchJson<StockInventory[]>("/api/inventory"),
        fetchJson<Donation[]>("/api/donations"),
        fetchJson<TenantSubscription[]>("/api/subscriptions"),
        fetchJson<SOSAlert[]>("/api/sos"),
        fetchJson<any>("/api/satellite").catch(() => null)
      ]);

      setReports(repList);
      setShelters(shList);
      setVolunteers(volList);
      setInventory(invList);
      setDonations(donList);
      setSubscriptions(subList);
      setSosAlerts(sosList);
      if (satData) {
        setSatelliteData(satData);
      }
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

        if (payload.event === "satellite_update") {
          setSatelliteData(payload.data);
          addNotification(
            `🛰 Satellite synchronized. Regional rainfall index: ${payload.data.precipitationIndex} mm/h. Submergence index: ${payload.data.submergenceWaterLevelM}m.`,
            'info',
            'map',
            undefined,
            true
          );
        } else if (payload.event === "new_report") {
          setReports(prev => {
            if (prev.some(r => r.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          addNotification(
            `🚨 New Disaster Incident: ${payload.data.type} declared at ${payload.data.locationName}. Severity: ${payload.data.severity}.`,
            'critical',
            'triage',
            payload.data.id,
            false
          );
        } else if (payload.event === "report_updated") {
          setReports(prev => prev.map(r => r.id === payload.data.id ? payload.data : r));
          addNotification(
            `🚨 Report updated: ${payload.data.type} status is now ${payload.data.status}.`,
            'warning',
            'triage',
            payload.data.id,
            false
          );
        } else if (payload.event === "sos_triggered") {
          setSosAlerts(prev => {
            if (prev.some(s => s.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          addNotification(
            `⚠️ CRITICAL SOS: Urgent rescue/relief requested by ${payload.data.name} • Needs: ${payload.data.currentNeeds}.`,
            'critical',
            'sos',
            payload.data.id,
            false
          );
        } else if (payload.event === "sos_updated") {
          setSosAlerts(prev => prev.map(s => s.id === payload.data.id ? payload.data : s));
          addNotification(
            `⚠️ SOS Alert resolved/updated: ${payload.data.name} is now ${payload.data.status}.`,
            'info',
            'sos',
            payload.data.id,
            false
          );
        } else if (payload.event === "new_shelter") {
          setShelters(prev => {
            if (prev.some(s => s.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          addNotification(
            `🛖 New Shelter Registered: ${payload.data.name} with capacity ${payload.data.capacity}.`,
            'success',
            'shelter',
            payload.data.id,
            false
          );
        } else if (payload.event === "shelter_updated") {
          setShelters(prev => prev.map(s => s.id === payload.data.id ? payload.data : s));
          addNotification(
            `🛖 Shelter updated: ${payload.data.name} capacity altered. Current intake: ${payload.data.occupancy}.`,
            'info',
            'shelter',
            payload.data.id,
            true
          );
        } else if (payload.event === "new_volunteer") {
          setVolunteers(prev => {
            if (prev.some(v => v.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          addNotification(
            `🤝 Volunteer force expanded: ${payload.data.name} signed up.`,
            'success',
            'volunteer',
            payload.data.id,
            false
          );
        } else if (payload.event === "volunteer_assigned") {
          setVolunteers(prev => prev.map(v => v.id === payload.data.id ? payload.data : v));
          addNotification(
            `🤝 Volunteer Patrol Jitter: Coordinate drift telemetry for ${payload.data.name} synced to Supabase (Mission: ${payload.data.currentTaskName || "Patrol duty"}).`,
            'info',
            'volunteer',
            payload.data.id,
            true
          );
        } else if (payload.event === "stock_replenished") {
          setInventory(prev => prev.map(inv => inv.id === payload.data.id ? payload.data : inv));
          addNotification(
            `📦 Supply level adjustment: ${payload.data.itemName} in stock quantity is now ${payload.data.quantity}.`,
            'info',
            'inventory',
            payload.data.id,
            true
          );
        } else if (payload.event === "donation_charged") {
          setDonations(prev => {
            if (prev.some(d => d.id === payload.data.id)) return prev;
            return [payload.data, ...prev];
          });
          addNotification(
            `💖 Impact Funding: donation of $${payload.data.amount} transacted by ${payload.data.donorName} for ${payload.data.campaignName}`,
            'success',
            'stripe-donation',
            payload.data.id,
            false
          );
        } else if (payload.event === "tier_upgraded") {
          setSubscriptions(prev => prev.map(sub => sub.id === payload.data.id ? payload.data : sub));
          addNotification(
            `🏢 Workspace Licences upgraded: ${payload.data.organizationName} activated ${payload.data.tier} tier workspace.`,
            'success',
            'billing',
            payload.data.id,
            false
          );
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
  }, [muteSimulations, muteAllToasts]);

  const addNotification = (
    message: string, 
    type: NotificationType = 'info', 
    tabLink?: string, 
    entityId?: string, 
    isSimulated: boolean = false
  ) => {
    const newNotif: ReliefNotification = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000000),
      message,
      timestamp: new Date(),
      type,
      tabLink,
      entityId,
      isSimulated,
      unread: true
    };

    setNotifications(prev => [newNotif, ...prev]);

    const shouldShowToast = !muteAllToasts && (!isSimulated || !muteSimulations);
    if (shouldShowToast) {
      setActiveToasts(prev => [newNotif, ...prev]);
      
      setTimeout(() => {
        setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
      }, 7000);
    }
  };

  const triggerSseBanner = (msg: string, type: NotificationType = 'info', tabLink?: string) => {
    addNotification(msg, type, tabLink, undefined, false);
  };

  const handleNotificationClick = (notif: ReliefNotification) => {
    // 1. Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
    // 2. Remove from active screen toasts
    setActiveToasts(prev => prev.filter(t => t.id !== notif.id));
    // 3. Switch view tab if links to operational section
    if (notif.tabLink) {
      setActiveTab(notif.tabLink);
      setShowNotificationCenter(false);
      
      // Auto centers or focuses mapping context
      if (notif.tabLink === "map" && notif.entityId) {
        const rep = reports.find(r => r.id === notif.entityId);
        if (rep) {
          handleSolvePath(23.8103, 90.4125, rep.latitude, rep.longitude);
        }
      }
    }
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

          {/* Real-time Interactive Notification Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              className="p-2 ml-1 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 relative cursor-pointer"
            >
              <Bell className={`w-4 h-4 ${notifications.some(n => n.unread) ? 'text-red-500' : 'text-white/60'}`} />
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse border border-gray-950 shadow-md">
                  {notifications.filter(n => n.unread).length}
                </span>
              )}
            </button>

            {/* Dropdown Menu Panel for Alerts */}
            {showNotificationCenter && (
              <div 
                className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-[#0c0c0e]/95 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 space-y-3 font-sans"
                style={{ backdropFilter: "blur(12px)" }}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'en' ? 'Alerts Center' : 'সিস্টেম এলার্ট'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-white/10 text-[9px] text-white/60 font-mono">
                      {notifications.length} Total
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-sans">
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                        }}
                        className="text-[10px] text-orange-500 hover:text-white transition-colors underline cursor-pointer"
                      >
                        {language === 'en' ? 'Mark all read' : 'সব পঠিত'}
                      </button>
                    )}
                    <span className="text-white/20">|</span>
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-red-500 hover:text-white transition-colors underline cursor-pointer"
                    >
                      {language === 'en' ? 'Clear' : 'মুছুন'}
                    </button>
                  </div>
                </div>

                {/* Configurations parameters to control spamming */}
                <div className="bg-[#121214] p-3 rounded-xl space-y-2 border border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-white/80">
                    <span className="font-sans font-medium text-left">
                      {language === 'en' ? 'Mute Background/Simulated Updates' : 'ব্যাকগ্রাউন্ড এলার্ট এবং পপআপ বন্ধ রাখুন'}
                    </span>
                    <input 
                      type="checkbox"
                      checked={muteSimulations}
                      onChange={(e) => setMuteSimulations(e.target.checked)}
                      className="accent-orange-600 rounded cursor-pointer w-4 h-4 ml-2"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/80">
                    <span className="font-sans font-medium text-left">
                      {language === 'en' ? 'Mute All Popups completely' : 'সকল পপআপ সম্পূর্ণরূপে বন্ধ করুন'}
                    </span>
                    <input 
                      type="checkbox"
                      checked={muteAllToasts}
                      onChange={(e) => {
                        setMuteAllToasts(e.target.checked);
                        if (e.target.checked) {
                          setActiveToasts([]);
                        }
                      }}
                      className="accent-orange-600 rounded cursor-pointer w-4 h-4 ml-2"
                    />
                  </div>
                  <p className="text-[9px] text-white/40 leading-relaxed font-mono">
                    {language === 'en' 
                      ? '* Automatic coordinates updates and drone drops generate repeated system changes. Checking these avoids interrupting visual focus.' 
                      : '* অটোমেটিক ভলান্টিয়ারের স্থান পরিবর্তন এবং ড্রোন ড্রপ ক্রমাগত এলার্ট তৈরি করে। এটি চেক রাখলে স্ক্রিনের পপআপ আসা বন্ধ হয়ে যাবে এবং শান্তি পাবেন।'}
                  </p>
                </div>

                {/* List items */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-white/40 text-xs font-sans">
                      {language === 'en' ? 'No recent notifications' : 'কোনো নতুন এলার্ট নেই'}
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      let typeTagColor = "bg-orange-500 text-orange-950";
                      let notifClass = "";
                      if (notif.unread) notifClass = "bg-white/5 font-semibold";

                      if (notif.type === 'critical') typeTagColor = "bg-red-500 text-red-950 font-bold animate-pulse";
                      else if (notif.type === 'success') typeTagColor = "bg-emerald-500 text-emerald-950";
                      else if (notif.type === 'warning') typeTagColor = "bg-amber-500 text-amber-950";
                      else if (notif.type === 'info') typeTagColor = "bg-blue-500 text-blue-950";

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-2.5 rounded-lg text-left text-xs transition-colors hover:bg-white/10 cursor-pointer ${notifClass} flex flex-col gap-1`}
                        >
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className={`text-[8px] uppercase px-1 py-0.5 rounded font-mono ${typeTagColor}`}>
                              {notif.type}
                            </span>
                            {notif.isSimulated && (
                              <span className="text-[8px] bg-white/10 text-white/40 px-1 py-0.5 rounded font-mono">
                                Simulated
                              </span>
                            )}
                            <span className="text-[9px] text-white/30 font-mono ml-auto">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-white/80 text-[11px] leading-snug font-sans">{notif.message}</p>
                          {notif.tabLink && (
                            <span className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold mt-1 flex items-center gap-1 font-sans">
                              <span>→ {language === 'en' ? `View Section` : `ট্যাবে গিয়ে দেখুন`}</span>
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
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

        {/* Real-time Sentinel-6 Satellite Radar Altimetry & Stream Feed */}
        <div className="relative overflow-hidden p-6 bg-[#0c0c0e]/95 border border-cyan-500/15 rounded-2xl shadow-lg space-y-4 font-sans">
          {/* Subtle scanning visual backdrop */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/25 animate-bounce" />
          <div className="absolute inset-0 bg-radial-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

          {/* Header row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/60 rounded-xl border border-cyan-500/30 text-cyan-400 animate-pulse">
                <Satellite className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xs md:text-sm font-display font-bold text-white tracking-wide uppercase flex items-center gap-2">
                  <span>{language === 'en' ? 'COPERNICUS SENTINEL-6 REAL-TIME SATELLITE ALTIDATA FEED' : 'কোপারনিকাস সেন্টিনেল-৬ রিয়েল-টাইম স্যাটেলাইট অল্টিমেট্রি ফিড'}</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{language === 'en' ? 'AUTOMATIC SYNC' : 'স্বয়ংক্রিয় সিঙ্ক'}</span>
                  </span>
                </h2>
                <p className="text-[10px] md:text-xs text-white/60 leading-relaxed max-w-2xl font-medium">
                  {language === 'en' 
                    ? 'Aperture Spaceborne Radar (SAR) and altimetry logs streams live from regional Ganges-Brahmaputra hydro-basin telemetry sensors.' 
                    : 'আঞ্চলিক গঙ্গা-ব্রহ্মপুত্র হাইড্রো-বেসিন টেলিমেন্টি সেন্সর থেকে রিয়েল-টাইমে প্রবাহিত অরবিটাল রাডার (সার) অল্টিমেট্রি লগ।'}
                </p>
              </div>
            </div>

            {/* Sync marker */}
            <div className="text-right font-mono text-[9px] text-white/40 bg-[#121214] border border-white/5 py-1 px-2.5 rounded-lg shrink-0">
              <span className="font-bold text-cyan-400">LAST SENSOR SWEEP: </span>
              <span>{new Date(satelliteData.lastSatelliteSync).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Grid indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 relative z-10">
            
            <div className="p-3 bg-[#111113] border border-white/5 rounded-xl space-y-1 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">{language === 'en' ? 'Orbital Altitude' : 'সূক্ষ্ম উচ্চতা'}</span>
              <div className="font-mono text-base font-black text-white leading-tight">
                {satelliteData.altitudeKm.toLocaleString()} <span className="text-[10px] font-normal text-white/40">KM</span>
              </div>
              <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase">✔ Drift Trajectory GPS</span>
            </div>

            <div className="p-3 bg-[#111113] border border-white/5 rounded-xl space-y-1 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">{language === 'en' ? 'Precipitation Index' : 'বৃষ্টির সূচক'}</span>
              <div className="font-mono text-base font-black text-rose-400 leading-tight">
                {satelliteData.precipitationIndex.toLocaleString()} <span className="text-[10px] font-normal text-rose-500/60">MM/H</span>
              </div>
              <span className="text-[8px] font-mono text-white/40 font-bold uppercase">SAR Microwave Pulse</span>
            </div>

            <div className="p-3 bg-[#111113] border border-white/5 rounded-xl space-y-1 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">{language === 'en' ? 'Est River Discharge' : 'নদী নিমজ্জন স্তর'}</span>
              <div className="font-mono text-base font-black text-cyan-400 leading-tight">
                {satelliteData.submergenceWaterLevelM.toLocaleString()} <span className="text-[10px] font-normal text-cyan-400/60">METER</span>
              </div>
              <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase">▲ +0.02m Altimetery</span>
            </div>

            <div className="p-3 bg-[#111113] border border-white/5 rounded-xl space-y-1 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">{language === 'en' ? 'Inundated Area' : 'প্লাবিত এলাকা'}</span>
              <div className="font-mono text-base font-black text-orange-400 leading-tight">
                {satelliteData.inundatedAreaSqKm.toLocaleString()} <span className="text-[10px] font-normal text-orange-500/60">KM²</span>
              </div>
              <span className="text-[8px] font-mono text-orange-400 font-bold uppercase">🛰 LANDWATER MAPPING</span>
            </div>

            <div className="p-3 bg-[#111113] border border-white/5 rounded-xl space-y-1 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">{language === 'en' ? 'Wind Velocity' : 'বাতাসের গতি'}</span>
              <div className="font-mono text-base font-black text-amber-400 leading-tight">
                {satelliteData.windSpeedKph.toLocaleString()} <span className="text-[10px] font-normal text-amber-500/60">KPH</span>
              </div>
              <span className="text-[8px] font-mono text-white/40 font-bold uppercase">Anemometer Radar</span>
            </div>

            <div className="p-3 bg-[#111113] border border-white/5 rounded-xl space-y-1 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">{language === 'en' ? 'Cloud Coverage' : 'মেঘের আচ্ছাদন'}</span>
              <div className="font-mono text-base font-black text-sky-400 leading-tight">
                {satelliteData.cloudCoverPercent}%
              </div>
              <span className="text-[8px] font-mono text-sky-400 font-bold uppercase">IR Satellite Sweep</span>
            </div>

          </div>

          {/* Sweep status text */}
          <div className="flex items-center gap-2 text-[9px] font-mono font-extrabold text-[#06b6d4]/90 uppercase pl-1 bg-[#0c0c0e]/95 relative z-10 select-none">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="tracking-widest animate-pulse">
              {language === 'en' ? 'Delta Spaceborne Sweep: Sweeping Ganges-Brahmaputra Hydrographic Basin...' : 'ডেল্টা মহাকাশ স্ক্যান: গঙ্গা-ব্রহ্মপুত্র নদী অববাহিকায় সুইপ চলছে...'}
            </span>
          </div>
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-[360px] sm:w-[400px]">
        {activeToasts.map((notif) => {
          let borderClass = "border-orange-500/50 hover:border-orange-500";
          let bgClass = "bg-orange-950/90";
          let textClass = "text-orange-200";
          let iconColor = "text-orange-400";
          
          if (notif.type === 'critical') {
            borderClass = "border-red-500 hover:border-red-400 shadow-lg shadow-red-950/50";
            bgClass = "bg-red-950/95";
            textClass = "text-red-100";
            iconColor = "text-red-400";
          } else if (notif.type === 'success') {
            borderClass = "border-emerald-500/50 hover:border-emerald-500";
            bgClass = "bg-[#091e14]/95";
            textClass = "text-emerald-100";
            iconColor = "text-emerald-400";
          } else if (notif.type === 'warning') {
            borderClass = "border-amber-500/50 hover:border-amber-500";
            bgClass = "bg-[#1f1a0e]/95";
            textClass = "text-amber-100";
            iconColor = "text-amber-400";
          } else if (notif.type === 'info') {
            borderClass = "border-blue-500/40 hover:border-blue-500";
            bgClass = "bg-[#0a1624]/95";
            textClass = "text-blue-100";
            iconColor = "text-blue-400";
          }

          return (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`group pointer-events-auto p-4 rounded-xl border ${bgClass} ${borderClass} transition-all duration-300 shadow-2xl flex flex-col gap-2.5 relative cursor-pointer transform hover:-translate-y-0.5 hover:scale-[1.01]`}
              style={{ backdropFilter: "blur(8px)" }}
            >
              {/* Dismiss button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToasts(prev => prev.filter(t => t.id !== notif.id));
                }}
                className="absolute top-2.5 right-2.5 text-white/40 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title={language === 'en' ? 'Dismiss' : 'বন্ধ করুন'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>

              <div className="flex items-start gap-2.5 pr-6">
                <Bell className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5 ${notif.type === 'critical' ? 'animate-bounce' : ''}`} />
                <div className="space-y-1">
                  <span className={`font-sans font-medium text-xs block leading-relaxed ${textClass}`}>{notif.message}</span>
                  <span className="text-[9px] font-mono opacity-50 block uppercase tracking-wider">
                    {new Date(notif.timestamp).toLocaleTimeString()} • {notif.type.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action buttons inside toast */}
              <div className="flex items-center gap-2 mt-0.5 pt-2 border-t border-white/10">
                {notif.tabLink && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(notif);
                    }}
                    className="text-[10px] font-semibold bg-white/10 hover:bg-orange-600 hover:text-white text-white px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <span>
                      {language === 'en' 
                        ? `Investigate / Go to ${notif.tabLink.toUpperCase()}` 
                        : `${notif.tabLink.toUpperCase()} ট্যাবে যান ও দেখুন`}
                    </span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToasts(prev => prev.filter(t => t.id !== notif.id));
                  }}
                  className="text-[9px] font-medium text-white/50 hover:text-white px-2 py-1 hover:bg-white/5 rounded-md transition-colors cursor-pointer ml-auto"
                >
                  {language === 'en' ? 'Dismiss' : 'বাতিল'}
                </button>
              </div>
            </div>
          );
        })}
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
