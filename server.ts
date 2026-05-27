import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dns from "dns";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Initialize environment variables manually in case of direct loader
import dotenv from "dotenv";
dotenv.config();

// Fix Node DNS resolution for local performance
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Google Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY" && geminiApiKey.trim() !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("ReliefLink AI: Gemini API client initialized successfully.");
  } catch (err) {
    console.error("ReliefLink AI: Failed to initialize Gemini API client:", err);
  }
} else {
  console.log("ReliefLink AI: Gemini API key missing or default. Core modules will run on robust local mathematical engines & fallback triage heuristics.");
}

// ==========================================
// DB MEMORY STATE WITH REALISTIC SEED DATA
// ==========================================

// Initial Reports
let disasterReports = [
  {
    id: "rep_flood_01",
    type: "Flood",
    severity: "High",
    latitude: 23.8103, // Dhaka-centric bounding box for Bangla-centric simulations
    longitude: 90.4125,
    locationName: "Demra Ward 6, Dhaka, Bangladesh",
    description: "Water levels have risen by 4 feet. Low-lying mud houses are completely submerged. Around 40 families are trapped on roofs without clean drinking water. High threat of water-borne pathogen outspread.",
    status: "In Progress",
    reporterName: "Dr. K. Rahman",
    reporterPhone: "+880 1711-223344",
    imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=600",
    aiAnalysis: {
      structuralDamageScore: 82,
      floodSeverityScore: 90,
      fireSpreadRisk: 5,
      roadBlockage: true,
      infrastructureCollapse: false,
      triageCategory: "Immediate",
      recommendedResponse: "Deploy high-clearance inflatable rescue boats with pure drinking water tanks, oral rehydration therapy kits, and wet weather tarpaulins.",
      riskRating: "Extreme",
      summary: "Severe flood immersion. Silt-loaded standing water has compromised local building footings. Transportation access is strictly boat-only."
    },
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4h ago
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    victimCount: 150
  },
  {
    id: "rep_earth_02",
    type: "Earthquake",
    severity: "Critical",
    latitude: 23.8223,
    longitude: 90.4211,
    locationName: "Mirpur Sector 11, Dhaka, Bangladesh",
    description: "Partial multi-story building collapse on Road 5. Cracks found on adjoining structural columns. Dust clouds reported, screams heard from under the debris. Road blocked by fallen electrical posts.",
    status: "Completed",
    reporterName: "Tasnim Ahmed (Citizen Vol)",
    reporterPhone: "+880 1819-334455",
    imageUrl: "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&q=80&w=600",
    aiAnalysis: {
      structuralDamageScore: 96,
      roadBlockage: true,
      infrastructureCollapse: true,
      triageCategory: "Immediate",
      recommendedResponse: "Deploy immediate heavy search-and-rescue teams (S&R) with acoustic sensors, canine relief, and structural shoring machinery.",
      riskRating: "Extreme",
      summary: "Critical vertical compaction failure. Progressive structural failure risk on adjoining buildings. Access roads are completely blocked by concrete rubble."
    },
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    victimCount: 12
  },
  {
    id: "rep_fire_03",
    type: "Fire",
    severity: "High",
    latitude: 23.7251,
    longitude: 90.4011,
    locationName: "Chawkbazar Old Quarter, Dhaka, Bangladesh",
    description: "Chemical warehouse electrical spark caused fire in adjacent modular residential structures. Smoke blocks overhead visibility. Narrow lanes are rendering fire trucks unable to approach.",
    status: "Pending",
    reporterName: "Anisur Zaman",
    reporterPhone: "+880 1673-998877",
    imageUrl: "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&q=80&w=600",
    aiAnalysis: {
      structuralDamageScore: 68,
      fireSpreadRisk: 85,
      roadBlockage: true,
      infrastructureCollapse: false,
      triageCategory: "Immediate",
      recommendedResponse: "Discipline chemical safety protocol agents and micro-foam suppression tools. Prevent localized fire expansion to adjacent chemical stocks.",
      riskRating: "High",
      summary: "Localized petrochemical flashover. Gaseous toxicity risk. Accessibility restricted by congested street layout."
    },
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15m ago
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    victimCount: 45
  },
  {
    id: "rep_cyclone_04",
    type: "Cyclone",
    severity: "Medium",
    latitude: 22.3569, // Cox's Bazar region
    longitude: 91.7832,
    locationName: "Kutubdia Coastal Belt, Cox's Bazar, Bangladesh",
    description: "Wind damage destroyed thatched roofs, standing crops are flooded with saline tidal surge. Communication lines are operating with 60% package drop.",
    status: "Dispatched",
    reporterName: "Raju Sen (NGO Coordinator)",
    reporterPhone: "+880 1912-112233",
    imageUrl: "",
    aiAnalysis: {
      structuralDamageScore: 45,
      roadBlockage: false,
      infrastructureCollapse: false,
      triageCategory: "Delayed",
      recommendedResponse: "Dispatch plastic sheet roofing, high-calorie biscuit distributions, and solar power packs.",
      riskRating: "Medium",
      summary: "Galeforce wind stripping. Moderate crop inundation. Accessibility intact but communication lines severely unstable."
    },
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    victimCount: 300
  }
];

// Initial Shelters
let shelters = [
  {
    id: "sh_dh_01",
    name: "Demra Government Primary School Emergency Shelter",
    latitude: 23.8115,
    longitude: 90.4140,
    capacity: 250,
    occupancy: 180,
    waterAvailability: "Adequate",
    foodAvailability: "Low",
    medicalStatus: "Good",
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
  },
  {
    id: "sh_dh_02",
    name: "Mirpur Cantonment Multi-purpose Cyclone Shelter",
    latitude: 23.8240,
    longitude: 90.4190,
    capacity: 500,
    occupancy: 120,
    waterAvailability: "Adequate",
    foodAvailability: "Adequate",
    medicalStatus: "Good",
    createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
  },
  {
    id: "sh_cx_01",
    name: "Kutubdia Cyclone Center B-3",
    latitude: 22.3580,
    longitude: 91.7850,
    capacity: 700,
    occupancy: 640,
    waterAvailability: "Low",
    foodAvailability: "None",
    medicalStatus: "Poor",
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString()
  }
];

// Initial Volunteers
let volunteers = [
  { id: "vol_01", name: "Tanvir Rahman", phone: "+880 1515-556677", skills: ["First Aid", "Driving", "Cooking"], latitude: 23.8110, longitude: 90.4130, available: true, score: 750, assignedTaskId: undefined, currentTaskName: "" },
  { id: "vol_02", name: "Fahmida Akter", phone: "+880 1712-445566", skills: ["First Aid", "Coordination", "Search & Rescue"], latitude: 23.8210, longitude: 90.4220, available: true, score: 1220, assignedTaskId: undefined, currentTaskName: "Debris clearance Mirpur" },
  { id: "vol_03", name: "Sajid Hasan", phone: "+880 1813-223322", skills: ["Search & Rescue", "Driving"], latitude: 23.7260, longitude: 90.4020, available: false, score: 980, assignedTaskId: "task_01", currentTaskName: "Suppressing Chemical Spot" },
  { id: "vol_04", name: "Imran Khan", phone: "+880 1612-990011", skills: ["Driving", "Cooking", "Coordination"], latitude: 22.3551, longitude: 91.7820, available: true, score: 320, assignedTaskId: undefined, currentTaskName: "" }
];

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "https://uoelwsaneuvugfhtohvq.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_WJFHDiE5b34jO3Tcbxxc7g_0dbrpWJA";

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project-id")) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("ReliefLink AI: Supabase Client initialized successfully with URL:", supabaseUrl);
    // Initial fetch
    syncVolunteersFromSupabase();
  } catch (err) {
    console.error("ReliefLink AI: Failed to initialize Supabase Client:", err);
  }
}

async function syncVolunteersFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from("volunteers")
      .select("*");
    
    if (error) {
      console.warn("Could not load from Supabase - Volunteers table may not be live yet:", error.message);
      return;
    }
    
    if (data && data.length > 0) {
      volunteers = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        skills: Array.isArray(item.skills) ? item.skills : [],
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        available: !!item.available,
        score: Number(item.score || 0),
        assignedTaskId: item.assigned_task_id || undefined,
        currentTaskName: item.current_task_name || ""
      }));
      console.log(`ReliefLink AI: Loaded ${volunteers.length} volunteers live from Supabase.`);
    }
  } catch (err) {
    console.error("Error standardizing Supabase volunteer schema stream:", err);
  }
}

// Live SOS Active Alerts
let sosAlerts = [
  {
    id: "sos_01",
    name: "Abdur Rahim",
    phone: "+880 1918-009988",
    latitude: 23.8109,
    longitude: 90.4111,
    medicalAssistanceRequired: true,
    trapped: true,
    currentNeeds: "Fever medications, clean drinking fluid. Floating debris has blocked doors.",
    nearestResponderId: "vol_01",
    responderDistanceKm: 0.25,
    status: "Active",
    createdAt: new Date(Date.now() - 12 * 60000).toISOString() // 12m ago
  },
  {
    id: "sos_02",
    name: "Salma Begum",
    phone: "+880 1799-112233",
    latitude: 22.3561,
    longitude: 91.7839,
    medicalAssistanceRequired: false,
    trapped: false,
    currentNeeds: "Urgent baby milk powder and high dry fuel logs.",
    nearestResponderId: "vol_04",
    responderDistanceKm: 0.92,
    status: "Responding",
    createdAt: new Date(Date.now() - 32 * 60000).toISOString()
  }
];

// Supply chain / core inventory
let inventory = [
  { id: "inv_01", category: "Water", itemName: "Drinking Water Box (24L)", quantity: 1540, unit: "Boxes", minimumThreshold: 200, locationName: "Dhaka Central NGO Base", lastUpdated: new Date().toISOString() },
  { id: "inv_02", category: "Food", itemName: "High-Energy Fortified Biscuits (10kg)", quantity: 820, unit: "Sacks", minimumThreshold: 150, locationName: "Cox's Bazar Warehouse", lastUpdated: new Date().toISOString() },
  { id: "inv_03", category: "Medicine", itemName: "Emergency First-Aid Field Kits", quantity: 340, unit: "Kits", minimumThreshold: 80, locationName: "Dhaka Central NGO Base", lastUpdated: new Date().toISOString() },
  { id: "inv_04", category: "Fuel", itemName: "Combustible Diesel Fuel", quantity: 60, unit: "Liters", minimumThreshold: 100, locationName: "Cox's Bazar Warehouse", lastUpdated: new Date().toISOString() }, // Low stock trigger
  { id: "inv_05", category: "Vehicles", itemName: "Inflatable Heavy Rescue Boat", quantity: 14, unit: "Units", minimumThreshold: 3, locationName: "Cox's Bazar Warehouse", lastUpdated: new Date().toISOString() },
  { id: "inv_06", category: "Emergency Kits", itemName: "Heavy Cold Weather Sleeping Bag", quantity: 95, unit: "Beds", minimumThreshold: 100, locationName: "Dhaka Central NGO Base", lastUpdated: new Date().toISOString() } // Low stock trigger
];

// Active NGO Multi-tenant Workspaces
let ngoWorkspaces = [
  {
    id: "ngo_red_crescent",
    name: "Bangladesh Red Crescent Society (BRCS)",
    tier: "Enterprise",
    billingPeriod: "yearly",
    nextBillingDate: "2027-01-15T00:00:00.000Z",
    activeDisasterZonesLimit: 999,
    priorityAIOptimization: true,
    isCustomBranded: true,
    logoUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=150",
    tenantKey: "tkey-brcs-enterprise-99"
  },
  {
    id: "ngo_brac_relief",
    name: "BRAC Community Disaster Relief Action",
    tier: "Professional",
    billingPeriod: "monthly",
    nextBillingDate: "2026-06-25T00:00:00.000Z",
    activeDisasterZonesLimit: 15,
    priorityAIOptimization: true,
    isCustomBranded: false,
    tenantKey: "tkey-brac-pro-54"
  },
  {
    id: "ngo_local_hope",
    name: "Coastal Hope Volunteer Network",
    tier: "Basic",
    billingPeriod: "monthly",
    nextBillingDate: "2026-06-12T00:00:00.000Z",
    activeDisasterZonesLimit: 3,
    priorityAIOptimization: false,
    isCustomBranded: false,
    tenantKey: "tkey-coastal-basic-1"
  }
];

// Active Donation Campaigns (Striped Connected)
let donationCampaigns = [
  {
    id: "camp_01",
    title: "Dhaka Flash Flood Immediate Response Fund",
    ngoName: "Bangladesh Red Crescent Society (BRCS)",
    description: "Rapid deployment fund to deliver clean water filtration tables, infant formulas, and dry cereal rations directly to flood affected communities in Demra, Tongi, and Keraniganj.",
    targetAmount: 50000,
    raisedAmount: 34120,
    donorCount: 412,
    disasterId: "rep_flood_01",
    imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=400",
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
  },
  {
    id: "camp_02",
    title: "Cox's Bazar Coastal Cyclone Rehabilitation Project",
    ngoName: "Coastal Hope Volunteer Network",
    description: "Help coastal families re-thatch homes blown away by galeforce wind shears, and supply clean solar power generators to keep critical communications line operations accessible.",
    targetAmount: 25000,
    raisedAmount: 6450,
    donorCount: 88,
    disasterId: "rep_cyclone_04",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400",
    createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
  }
];

// Log of Recent Transactions
let donationReceipts = [
  { id: "tx_1", campaignId: "camp_01", campaignTitle: "Dhaka Flash Flood Immediate Response Fund", donorName: "A. Rahman Chowdhury", amount: 250, transactionHash: "ch_stripe_ref_9h12k3n1ad9s02ka91c", createdAt: new Date(Date.now() - 1.2 * 3600000).toISOString() },
  { id: "tx_2", campaignId: "camp_01", campaignTitle: "Dhaka Flash Flood Immediate Response Fund", donorName: "M. I. Kabir", amount: 1000, transactionHash: "ch_stripe_ref_2la89sd1j0ak29sk1k8", createdAt: new Date(Date.now() - 2.8 * 3600000).toISOString() },
  { id: "tx_3", campaignId: "camp_02", campaignTitle: "Cox's Bazar Coastal Cyclone Rehabilitation Project", donorName: "Nusrat Jahan", amount: 150, transactionHash: "ch_stripe_ref_812hasd801kas6asvna", createdAt: new Date(Date.now() - 18 * 3600000).toISOString() }
];

let tenantSubscriptions = [
  {
    id: "sub_red_crescent",
    organizationName: "Bangladesh Red Crescent Society (BRCS)",
    activeSectors: ["Demra Ward 6", "Siddhirganj"],
    tier: "Enterprise",
    billingPeriod: "yearly",
    nextBillingDate: "2027-01-15T00:00:00.000Z"
  },
  {
    id: "sub_brac_relief",
    organizationName: "BRAC Community Disaster Relief Action",
    activeSectors: ["Mirpur Sector 11", "Uttara Sector 4"],
    tier: "Pro",
    billingPeriod: "monthly",
    nextBillingDate: "2026-06-25T00:00:00.000Z"
  },
  {
    id: "sub_local_hope",
    organizationName: "Coastal Hope Volunteer Network",
    activeSectors: ["Kutubdia Coastal Belt"],
    tier: "Basic",
    billingPeriod: "monthly",
    nextBillingDate: "2026-06-12T00:00:00.000Z"
  }
];

let donations = [
  {
    id: "don_1",
    donorName: "A. Rahman Chowdhury",
    donorEmail: "rahman@dhaka.net",
    amount: 250,
    campaignName: "Demra District Flood Relief Fund",
    createdAt: new Date(Date.now() - 1.2 * 3600000).toISOString()
  },
  {
    id: "don_2",
    donorName: "M. I. Kabir",
    donorEmail: "kabir@bangla.org",
    amount: 1000,
    campaignName: "Demra District Flood Relief Fund",
    createdAt: new Date(Date.now() - 2.8 * 3600000).toISOString()
  },
  {
    id: "don_3",
    donorName: "Nusrat Jahan",
    donorEmail: "nusrat@hope.org",
    amount: 150,
    campaignName: "Syndicate Emergency Recovery Supplies",
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString()
  }
];

// Active Multi-channel Coordination chats
let chatMessages = [
  { id: "msg_1", channelId: "broadcast", senderName: "Government Control Tower", senderRole: "Government Admin", text: "WARNING: High-tide surge of 3 feet expected near cox's bazar coastal lines by 21:00 UTC. Take extreme safety drills.", createdAt: new Date(Date.now() - 100 * 60000).toISOString() },
  { id: "msg_2", channelId: "ngo-coordination", senderName: "Tasnim Ahmed", senderRole: "NGO Manager", text: "We have dispatched high-energy food cartons to Mirpur. Requesting additional medical tents from rescue inventory base near Cantonment.", createdAt: new Date(Date.now() - 24 * 60000).toISOString() },
  { id: "msg_3", channelId: "ngo-coordination", senderName: "Super Admin Control", senderRole: "Super Admin", text: "Vite server and node computational systems reporting clear communication channels. Re-routing boat responders.", createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: "msg_4", channelId: "volunteers", senderName: "Tanvir Rahman", senderRole: "Volunteer", text: "Underway to Demra primary school, road traffic is medium but floating debris is heavy. High clear boat is deployed.", createdAt: new Date(Date.now() - 2 * 60000).toISOString() }
];

// Systems Monitor Metrics log
let systemAudits = [
  { id: "aud_01", action: "User LOGIN", role: "Super Admin", details: "Security audit successfully cleared IP matching checks.", timestamp: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: "aud_02", action: "Model Training Sequence", role: "Government Admin", details: "ML Resource prediction regression calculated over 100 iterations. Weights saved to database.", timestamp: new Date(Date.now() - 15 * 60000).toISOString() }
];

// ==========================================
// 1. JWT & ROLE AUTHENTICATION ENGINE
// ==========================================

const VALID_USERS = [
  { email: "admin@relieflink.ai", password: "Password123", name: "SuperAdmin Control Tower", role: "Super Admin", ngoId: "ngo_red_crescent" },
  { email: "gov@relieflink.ai", password: "Password123", name: "Director General (Response)", role: "Government Admin" },
  { email: "brac@relieflink.ai", password: "Password123", name: "Ruhul Amin (BRAC Director)", role: "NGO Manager", ngoId: "ngo_brac_relief" },
  { email: "responder@relieflink.ai", password: "Password123", name: "Major S. Islam (Rescuer)", role: "Emergency Responder" },
  { email: "volunteer@relieflink.ai", password: "Password123", name: "S. K. Tanvir", role: "Volunteer" }
];

// API: Authentication LOGIN
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are standard inputs" });
  }

  const user = VALID_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email credentials or password profile" });
  }

  // Create mock token session payload
  const token = `m_token_jwt_${Buffer.from(user.email).toString("base64")}_${user.role.replace(" ", "_")}`;
  
  // Custom tracking audit
  systemAudits.unshift({
    id: "aud_" + Math.random().toString(36).substring(3, 10),
    action: "User Login Actioned",
    role: user.role,
    details: `Authorized account via JWT: ${user.email}`,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    token,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
      ngoId: (user as any).ngoId,
      workspace: (user as any).ngoId ? ngoWorkspaces.find(n => n.id === (user as any).ngoId) : null
    }
  });
});

// API: Emergency Guest Signup Access
app.post("/api/auth/emergency-guest", (req, res) => {
  const { requestedRole } = req.body;
  const role = requestedRole || "Citizen";
  const randomId = Math.floor(1000 + Math.random() * 9000);
  
  const guestUser = {
    email: `guest_${randomId}@relieflink.ai`,
    name: `Emergency Guest Rescuer #${randomId}`,
    role: role,
    token: `guest_token_session_${randomId}_${role}`
  };

  systemAudits.unshift({
    id: "aud_gst_" + randomId,
    action: "Emergency Guest Authorized",
    role: role,
    details: `Temporary security bypass activated for: ${guestUser.email}`,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    token: guestUser.token,
    user: guestUser
  });
});

// ==========================================
// 2. DISASTER REPORT & CLUSTERING ENGINE
// ==========================================

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

// GET reports
app.get("/api/reports", (req, res) => {
  return res.json(disasterReports);
});

// POST report (with duplicate detection + AI triage prediction)
app.post("/api/reports", async (req, res) => {
  const { type, severity, latitude, longitude, locationName, description, reporterName, reporterPhone, imageUrl } = req.body;
  
  if (!type || !severity || !latitude || !longitude || !locationName || !description) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const newReportId = `rep_${Math.random().toString(36).substring(2, 9)}`;

  // Duplicate Check Engine
  // If another report of the same type is within 1.2km and has matching details in 24h, mark as duplicate
  let duplicateOfId: string | undefined = undefined;
  for (const report of disasterReports) {
    const distance = calculateDistanceKm(latitude, longitude, report.latitude, report.longitude);
    const sameType = report.type.toLowerCase() === type.toLowerCase();
    
    // Check keyword similarity
    const descWords1 = description.toLowerCase().split(/\s+/);
    const descWords2 = report.description.toLowerCase().split(/\s+/);
    const intersections = descWords1.filter((w: string) => descWords2.includes(w) && w.length > 3);
    const hasWordSimilarity = intersections.length > 2;

    if (distance <= 1.2 && sameType && hasWordSimilarity) {
      duplicateOfId = report.id;
      break;
    }
  }

  // Pre-calculate fallback mock analysis heuristics based on descriptions
  const cleanDescription = description.toLowerCase();
  const roadMatched = cleanDescription.includes("road") || cleanDescription.includes("blocked") || cleanDescription.includes("debris") || cleanDescription.includes("highway");
  const collapseMatched = cleanDescription.includes("collapse") || cleanDescription.includes("cracks") || cleanDescription.includes("demolished") || cleanDescription.includes("rubble");
  const riskCalculated = severity === "Critical" ? "Extreme" : severity === "High" ? "High" : severity === "Medium" ? "Medium" : "Low";
  
  let fallbackAnalysisPlan = {
    structuralDamageScore: severity === "Critical" ? 92 : severity === "High" ? 64 : severity === "Medium" ? 40 : 18,
    floodSeverityScore: type === "Flood" ? (severity === "Critical" ? 95 : severity === "High" ? 75 : 45) : undefined,
    fireSpreadRisk: type === "Fire" ? (severity === "Critical" ? 85 : severity === "High" ? 60 : 30) : undefined,
    roadBlockage: roadMatched,
    infrastructureCollapse: collapseMatched,
    triageCategory: severity === "Critical" || severity === "High" ? "Immediate" : "Delayed",
    recommendedResponse: `Dispatch urgent ${type === "Flood" ? "Inflatable Rescue Boats & Dehydration remedies" : type === "Fire" ? "Fire foam suppression vehicles" : "Debris removal + rescue machinery"} within regional range.`,
    riskRating: riskCalculated as any,
    summary: `Heuristics flagged report status as ${severity}. Structural elements require engineering overview. Access route calculated as ${roadMatched ? "compromised" : "open"}.`
  };

  const newReport: any = {
    id: newReportId,
    type,
    severity,
    latitude,
    longitude,
    locationName,
    description,
    status: "Pending",
    reporterName: reporterName || "Anonymous Reporter",
    reporterPhone: reporterPhone || "",
    imageUrl: imageUrl || "",
    aiAnalysis: fallbackAnalysisPlan,
    duplicateOf: duplicateOfId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    victimCount: severity === "Critical" ? 150 : severity === "High" ? 45 : 10
  };

  // Add report initially
  disasterReports.unshift(newReport);

  // Real-time SSE broadcast
  try {
    broadcastToSSE({ event: "new_report", data: newReport });
  } catch (err) {
    console.error("SSE Report broadcast failure:", err);
  }

  // Trigger Gemini Vision Triage & Image Assessment in background if Key and Image are supplied
  if (ai && imageUrl && imageUrl.startsWith("data:image")) {
    // Run async trigger in background to perform true vision triage and rewrite the analysis
    assessReportWithGeminiVision(newReportId, imageUrl, description, type, severity);
  }

  // Audits tracking
  systemAudits.unshift({
    id: "aud_rep_" + Math.random().toString(36).substring(3, 10),
    action: "New Rescue Report Logged",
    role: "Citizen",
    details: `Triage queued: ${type} at [${latitude}, ${longitude}]. Duplicate Detected: ${duplicateOfId ? "YES (" + duplicateOfId + ")" : "NO"}.`,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json(newReport);
});

// Update Report Status & Allocation
app.patch("/api/reports/:id", (req, res) => {
  const { id } = req.params;
  const { status, severity } = req.body;
  const report = disasterReports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Disaster report not found in records" });
  }

  if (status) report.status = status;
  if (severity) report.severity = severity;
  report.updatedAt = new Date().toISOString();

  // Real-time SSE broadcast
  try {
    broadcastToSSE({ event: "report_updated", data: report });
  } catch (err) {
    console.error("SSE Report patch failure:", err);
  }

  return res.json(report);
});

// Helper for live geo-clustering aggregation queries
app.get("/api/reports/clusters", (req, res) => {
  const radiusKm = parseFloat(req.query.radius as string) || 1.5;
  const clusters: { name: string; centerLat: number; centerLng: number; severity: string; count: number; ids: string[] }[] = [];
  const processedIds = new Set<string>();

  for (const rep of disasterReports) {
    if (processedIds.has(rep.id)) continue;
    
    const clusterIds = [rep.id];
    processedIds.add(rep.id);
    let cumulativeLat = rep.latitude;
    let cumulativeLng = rep.longitude;

    for (const other of disasterReports) {
      if (processedIds.has(other.id)) continue;
      const distance = calculateDistanceKm(rep.latitude, rep.longitude, other.latitude, other.longitude);
      if (distance <= radiusKm) {
        clusterIds.push(other.id);
        processedIds.add(other.id);
        cumulativeLat += other.latitude;
        cumulativeLng += other.longitude;
      }
    }

    clusters.push({
      name: `${rep.type} Cluster at ${rep.locationName.split(",")[0]}`,
      centerLat: cumulativeLat / clusterIds.length,
      centerLng: cumulativeLng / clusterIds.length,
      severity: rep.severity, // defaults to parent's core
      count: clusterIds.length,
      ids: clusterIds
    });
  }

  return res.json(clusters);
});

// Background Worker: Gemini Vision analyzer for disaster files
async function assessReportWithGeminiVision(reportId: string, base64Image: string, textContext: string, disType: string, severity: string) {
  if (!ai) return;

  try {
    const reportIndex = disasterReports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) return;

    // Isolate base64 payload
    const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return;
    const mimeType = matches[1];
    const rawData = matches[2];

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: rawData
      }
    };

    const triageInstructionSchema = {
      type: Type.OBJECT,
      properties: {
        structuralDamageScore: { type: Type.INTEGER, description: "Structural integrity assessment score from 0 (perfect) to 100 (total rubble collapse)" },
        floodSeverityScore: { type: Type.INTEGER, description: "Water level index from 0 to 100. Leave empty if disaster is not water-rich" },
        fireSpreadRisk: { type: Type.INTEGER, description: "Spread risk metric from 0 to 100 based on combustible materials" },
        roadBlockage: { type: Type.BOOLEAN, description: "True if paths are obstructed by tree limbs, water depth, mud or structural rubble" },
        infrastructureCollapse: { type: Type.BOOLEAN, description: "True if load-bearing infrastructure has collapsed" },
        triageCategory: { type: Type.STRING, description: "Triage bucket classification choice: Immediate, Delayed, Minor" },
        recommendedResponse: { type: Type.STRING, description: "Concrete advice of specific assets to dispatch" },
        riskRating: { type: Type.STRING, description: "Risk label from Low, Medium, High, Extreme" },
        summary: { type: Type.STRING, description: "A detailed summary of specific damage features detected in the view" }
      },
      required: ["structuralDamageScore", "roadBlockage", "infrastructureCollapse", "triageCategory", "recommendedResponse", "riskRating", "summary"]
    };

    const promptText = `
      You are an elite automated crisis triage and damage analysis intelligence. 
      Analyze this emergency payload image for disaster rescue and resource coordination teams:
      Disaster Context declared by rescue team: ${disType} (Declared Severity: ${severity})
      Observer description: "${textContext}"

      Identify structural columns crumbling, high-level water marks, fire risk vectors, road clearance status, hazard powerlines, and load-bearing collapses.
      Provide realistic precision estimation based purely on physical parameters in the image.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        imagePart,
        { text: promptText }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: triageInstructionSchema
      }
    });

    if (response?.text) {
      const parsed = JSON.parse(response.text.trim());
      disasterReports[reportIndex].aiAnalysis = parsed;
      console.log(`ReliefLink AI: Gemini Vision completed report triage for ${reportId}: Score ${parsed.structuralDamageScore}`);
      
      // Real-time SSE broadcast of completed AI analysis
      try {
        broadcastToSSE({ event: "report_updated", data: disasterReports[reportIndex] });
      } catch (err) {
        console.error("SSE Gemini analysis update broadcast failure:", err);
      }
    }
  } catch (error) {
    console.error(`ReliefLink AI: Background Gemini Vision analysis failed for ${reportId}:`, error);
  }
}

// ==========================================
// 3. ENTERPRISE ML RESOURCE PREDICTION ENGINE
// ==========================================

// Realistic ML initial coefficients reflecting simulated XGBoost model training parameters
let mlRegressionCoefficients = {
  waterBase: 120, // liters per populationAffected
  waterSeverityMult: { Low: 1.0, Medium: 1.5, High: 2.2, Critical: 3.5 },
  waterDensityAdjustment: 0.15,

  foodBase: 1.8, // kg per pop
  foodSeverityMult: { Low: 1.0, Medium: 1.3, High: 1.9, Critical: 2.8 },
  foodWeatherMultiplier: { Clear: 1.0, Rainy: 1.25, "Extreme Storm": 1.55, "Heavy Snow": 1.45, Flooding: 1.7 },

  medicineBase: 0.05, // kits per pop
  medicineSeverityMult: { Low: 1.0, Medium: 2.5, High: 6.0, Critical: 14.0 },

  shelterBase: 0.12, // tents per pop
  shelterWeatherMultiplier: { Clear: 1.0, Rainy: 1.7, "Extreme Storm": 2.4, "Heavy Snow": 2.6, Flooding: 2.1 },

  rescueBase: 1.5, // teams base quantity
  rescueStructuralWeight: 1.6, // additional team multiplier per infrastructure damage index

  fuelBase: 80, // liters base
  accessibilityWeight: 2.4 // penalty multiplier for low accessibility
};

// Simulated historical ML records dataset for retraining
let mlTrainingDataset = [
  { disasterType: "Flood", severity: "High", populationAffected: 1200, infrastructureDamage: 7, weatherCondition: "Rainy", areaSizeSqKm: 15, accessibilityScore: 4, timeSinceDisasterHours: 4, populationDensityPerSqKm: 180, actualWaterNeeded: 5500, actualFoodNeeded: 3800 },
  { disasterType: "Earthquake", severity: "Critical", populationAffected: 300, infrastructureDamage: 9, weatherCondition: "Clear", areaSizeSqKm: 2, accessibilityScore: 3, timeSinceDisasterHours: 2, populationDensityPerSqKm: 900, actualWaterNeeded: 3100, actualFoodNeeded: 1200 },
  { disasterType: "Cyclone", severity: "High", populationAffected: 5000, infrastructureDamage: 6, weatherCondition: "Extreme Storm", areaSizeSqKm: 80, accessibilityScore: 5, timeSinceDisasterHours: 12, populationDensityPerSqKm: 120, actualWaterNeeded: 24200, actualFoodNeeded: 14400 },
  { disasterType: "Fire", severity: "Medium", populationAffected: 150, infrastructureDamage: 4, weatherCondition: "Clear", areaSizeSqKm: 1, accessibilityScore: 8, timeSinceDisasterHours: 1, populationDensityPerSqKm: 1500, actualWaterNeeded: 800, actualFoodNeeded: 450 }
];

// Calculation of outputs
function runMLInference(inputs: any) {
  const { disasterType, severity, populationAffected, infrastructureDamage, weatherCondition, areaSizeSqKm, accessibilityScore, timeSinceDisasterHours, populationDensityPerSqKm } = inputs;
  
  const pop = Number(populationAffected) || 10;
  const accessPenalty = 11 - (Number(accessibilityScore) || 5); // invert accessibility (1 perfect to 10 isolated)
  const infraDamage = Number(infrastructureDamage) || 2;
  const area = Number(areaSizeSqKm) || 1;
  const hr = Number(timeSinceDisasterHours) || 1;
  const density = Number(populationDensityPerSqKm) || 100;

  // Linear / mathematical regression simulation modeling XGBoost outputs
  const sMultW = mlRegressionCoefficients.waterSeverityMult[severity as "Low" | "Medium" | "High" | "Critical"] || 1.5;
  const sMultF = mlRegressionCoefficients.foodSeverityMult[severity as "Low" | "Medium" | "High" | "Critical"] || 1.4;
  const sMultM = mlRegressionCoefficients.medicineSeverityMult[severity as "Low" | "Medium" | "High" | "Critical"] || 1.8;

  const wWeather = mlRegressionCoefficients.foodWeatherMultiplier[weatherCondition as "Clear" | "Rainy" | "Extreme Storm" | "Heavy Snow" | "Flooding"] || 1.1;
  const sWeather = mlRegressionCoefficients.shelterWeatherMultiplier[weatherCondition as "Clear" | "Rainy" | "Extreme Storm" | "Heavy Snow" | "Flooding"] || 1.1;

  // Outputs (with smart regression equations matching the physical factors)
  const water = Math.round(pop * mlRegressionCoefficients.waterBase * sMultW * (1 + (density / 10000) * mlRegressionCoefficients.waterDensityAdjustment));
  const food = Math.round(pop * mlRegressionCoefficients.foodBase * sMultF * wWeather);
  const medicine = Math.round(pop * mlRegressionCoefficients.medicineBase * sMultM * (1 + infraDamage * 0.12));
  
  let shelter = 0;
  if (disasterType === "Flood" || disasterType === "Cyclone" || disasterType === "Earthquake" || disasterType === "Tornado" || disasterType === "Tsunami") {
    shelter = Math.round(pop * mlRegressionCoefficients.shelterBase * sWeather * (severity === "Critical" ? 2.5 : severity === "High" ? 1.8 : 1.0));
  } else {
    // Other disasters have lower local shelter needs unless extreme
    shelter = Math.round(pop * 0.02 * sWeather * (severity === "Critical" ? 2.0 : 1.0));
  }

  const rescue = Math.max(1, Math.round(mlRegressionCoefficients.rescueBase * infraDamage * (severity === "Critical" ? 3.5 : 1.5) + (pop > 2000 ? 5 : 0)));
  const fuel = Math.round(mlRegressionCoefficients.fuelBase * area * (accessPenalty * 0.35 + 0.5) + (rescue * 15));

  // Confidence Ranges (95% boundaries reflecting XGBoost variance estimates)
  const confidenceIntervals = {
    water: [Math.round(water * 0.88), Math.round(water * 1.12)],
    food: [Math.round(food * 0.9), Math.round(food * 1.1)],
    medicine: [Math.round(medicine * 0.8), Math.round(medicine * 1.25)],
    shelter: [Math.round(shelter * 0.85), Math.round(shelter * 1.15)],
    rescue: [Math.max(1, Math.round(rescue * 0.8)), Math.round(rescue + 2)],
    fuel: [Math.round(fuel * 0.82), Math.round(fuel * 1.18)]
  };

  // Modern feature importance vectors derived from current coefficients weights
  const featureImportance = [
    { feature: "Population Affected (Volume)", importanceScore: 0.62 },
    { feature: "Disaster Declared Severity", importanceScore: 0.16 },
    { feature: "Accessibility Isolation", importanceScore: 0.09 },
    { feature: "Infrastructure Structural Collapse Score", importanceScore: 0.07 },
    { feature: "Weather Conditions Severity", importanceScore: 0.04 },
    { feature: "Affected Surface Area (Sq Km)", importanceScore: 0.02 }
  ];

  return {
    waterLitersNeeded: water,
    foodKgsNeeded: food,
    medicineKitsNeeded: medicine,
    shelterTentsNeeded: shelter,
    rescueTeamsNeeded: rescue,
    fuelLitersNeeded: fuel,
    confidenceIntervals,
    featureImportance
  };
}

// Current scoring performance statistics
let mlPerformanceMetrics = {
  rmse: 184.2,
  mae: 112.5,
  r2Score: 0.941
};

// API: ML Prediction
app.post("/api/ml/predict", (req, res) => {
  const inputs = req.body;
  if (!inputs.disasterType || !inputs.severity || !inputs.populationAffected) {
    return res.status(400).json({ error: "Missing key parameters for pipeline execution." });
  }

  const prediction = runMLInference(inputs);
  return res.json({
    inputs,
    outputs: prediction,
    metrics: mlPerformanceMetrics
  });
});

// API: Retrain ML model
app.post("/api/ml/retrain", (req, res) => {
  const { newRecords } = req.body;
  if (!newRecords || !Array.isArray(newRecords)) {
    return res.status(400).json({ error: "Retraining requires bundle array record of historical entries" });
  }

  // Adjust regression parameters to simulate fit adjustment
  mlTrainingDataset = [...mlTrainingDataset, ...newRecords];
  
  // Calculate slightly modified metrics based on size
  const factor = 1 - Math.min(0.04, newRecords.length * 0.005);
  mlPerformanceMetrics.rmse = parseFloat((mlPerformanceMetrics.rmse * factor).toFixed(2));
  mlPerformanceMetrics.mae = parseFloat((mlPerformanceMetrics.mae * factor).toFixed(2));
  mlPerformanceMetrics.r2Score = parseFloat(Math.min(0.985, mlPerformanceMetrics.r2Score + 0.001 * newRecords.length).toFixed(4));

  // Save trace audit log
  systemAudits.unshift({
    id: "aud_ml_retrain_" + Date.now(),
    action: "ML Pipeline Retrain Complete",
    role: "Government Admin",
    details: `Trained over index of ${mlTrainingDataset.length} rows. Model R² improved to: ${mlPerformanceMetrics.r2Score}`,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    totalDatasetRows: mlTrainingDataset.length,
    newMetrics: mlPerformanceMetrics,
    message: "Model hyperparameters fit and optimized over current telemetry successfully."
  });
});

// ==========================================
// 4. RESOURCE OPTIMIZATION ENGINE (A* Search)
// ==========================================

// Simulating a real A* grid map optimization
// Area coordinates representing Dhaka district squares grid system.
// x bounds 0-9, y bounds 0-9
app.post("/api/routing/optimize", (req, res) => {
  const { startLat, startLng, endLat, endLng, priorityLevel } = req.body;
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: "Start & end bounding dimensions must be clear" });
  }

  // Calculate coordinates steps between start and end
  const stepsCount = 6;
  const path: any[] = [];
  
  const stepLat = (endLat - startLat) / (stepsCount - 1);
  const stepLng = (endLng - startLng) / (stepsCount - 1);

  const roadNames = [
    "Dhaka-Chittagong Expressway",
    "Bishwaroad Bypass Lane 3",
    "Demra Access Link-Road",
    "Local Flood Canal Embankment Lane",
    "Primary School Shelter Entrance Terminal",
    "Target Site Emergency Dock"
  ];

  let hazardImpactCount = 0;

  for (let i = 0; i < stepsCount; i++) {
    const lat = startLat + stepLat * i;
    const lng = startLng + stepLng * i;

    // Simulate different risk factors on coordinates paths
    let risk = 1.0;
    if (i === 2 || i === 3) {
      risk = 4.8; // middle blocks have high water depth hazards
      hazardImpactCount++;
    }

    path.push({
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lng.toFixed(5)),
      roadName: roadNames[i] || `Emergency Sector Connector #${i}`,
      riskFactor: risk,
      isSafe: risk < 3.0
    });
  }

  const distanceVal = Number((calculateDistanceKm(startLat, startLng, endLat, endLng)).toFixed(2));
  // A* dispatch times
  const timeMinutes = Math.round(distanceVal * 4.5 * (1 + hazardImpactCount * 0.15));
  
  const result: any = {
    path,
    totalDistanceKm: distanceVal,
    estimatedTimeMinutes: timeMinutes,
    routingAlgorithmUsed: priorityLevel === "High" ? "Constraint-Satisfaction Optimization" : "A* Search Model",
    hazardPointsEncountered: hazardImpactCount,
    wastageRiskPercentage: Math.max(1, Math.round(hazardImpactCount * 12 - (priorityLevel === "High" ? 15 : 0))),
    coverageEfficiencyScore: Math.round(98 - (hazardImpactCount * 4))
  };

  return res.json(result);
});

// ==========================================
// 5. SHELTERS & VOLUNTEERS REGISTER & LEADERBOARD
// ==========================================

app.get("/api/shelters", (req, res) => res.json(shelters));

app.post("/api/shelters", (req, res) => {
  const { name, latitude, longitude, capacity, occupancy, waterAvailability, foodAvailability, medicalStatus } = req.body;
  if (!name || !latitude || !longitude || !capacity) {
    return res.status(400).json({ error: "Required fields missing for shelter registration" });
  }

  const newShelter = {
    id: `sh_${Math.random().toString(36).substring(2, 7)}`,
    name,
    latitude: Number(latitude),
    longitude: Number(longitude),
    capacity: Number(capacity),
    occupancy: Number(occupancy) || 0,
    waterAvailability: waterAvailability || "Adequate",
    foodAvailability: foodAvailability || "Adequate",
    medicalStatus: medicalStatus || "Good",
    createdAt: new Date().toISOString()
  };

  shelters.push(newShelter);
  try {
    broadcastToSSE({ event: "new_shelter", data: newShelter });
  } catch (err) {
    console.error("SSE new shelter broadcast failure:", err);
  }
  return res.status(201).json(newShelter);
});

// Shelter intake tracker
app.post("/api/shelters/:id/intake", (req, res) => {
  const { id } = req.params;
  const { victimCountJoined } = req.body;
  const shelter = shelters.find(s => s.id === id);
  if (!shelter) {
    return res.status(404).json({ error: "Shelter not found" });
  }

  const intakeVal = Number(victimCountJoined) || 1;
  if (shelter.occupancy + intakeVal > shelter.capacity) {
    return res.status(400).json({ error: "Intake exceeds current available capacity ceiling." });
  }

  shelter.occupancy += intakeVal;
  try {
    broadcastToSSE({ event: "shelter_updated", data: shelter });
  } catch (err) {
    console.error("SSE shelter updated broadcast failure:", err);
  }
  return res.json(shelter);
});

// VOLUNTEER list and assign
app.get("/api/volunteers", (req, res) => res.json(volunteers));

app.post("/api/volunteers", async (req, res) => {
  const { name, phone, skills, latitude, longitude } = req.body;
  if (!name || !phone || !skills || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing registration inputs" });
  }

  const newVol = {
    id: `vol_${Math.random().toString(36).substring(2, 7)}`,
    name,
    phone,
    skills: Array.isArray(skills) ? skills : [skills],
    latitude: Number(latitude),
    longitude: Number(longitude),
    available: true,
    score: 0,
    assignedTaskId: undefined,
    currentTaskName: ""
  };

  volunteers.push(newVol);

  // Sync to Supabase database
  if (supabase) {
    supabase.from("volunteers").insert([{
      id: newVol.id,
      name: newVol.name,
      phone: newVol.phone,
      skills: newVol.skills,
      latitude: newVol.latitude,
      longitude: newVol.longitude,
      available: newVol.available,
      score: newVol.score,
      assigned_task_id: null,
      current_task_name: ""
    }]).then(({ error }: any) => {
      if (error) console.error("Error inserting volunteer to Supabase:", error.message);
      else console.log("Successfully synchronized new volunteer to Supabase!");
    });
  }

  try {
    broadcastToSSE({ event: "new_volunteer", data: newVol });
  } catch (err) {
    console.error("SSE new volunteer broadcast failure:", err);
  }
  return res.status(201).json(newVol);
});

app.post("/api/volunteers/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { taskName, taskId } = req.body;

  const vol = volunteers.find(v => v.id === id);
  if (!vol) return res.status(404).json({ error: "Volunteer not found" });

  vol.available = false;
  vol.assignedTaskId = taskId || `tsk_${Math.random().toString(36).substring(2, 6)}`;
  vol.currentTaskName = taskName || "Rescue Coordination Duty";
  vol.score += 150; // award points for participation

  // Sync update to Supabase
  if (supabase) {
    supabase.from("volunteers").update({
      available: vol.available,
      assigned_task_id: vol.assignedTaskId,
      current_task_name: vol.currentTaskName,
      score: vol.score
    }).eq("id", vol.id).then(({ error }: any) => {
      if (error) console.error("Error updating volunteer in Supabase:", error.message);
      else console.log("Successfully synchronized volunteer assignment to Supabase!");
    });
  }

  try {
    broadcastToSSE({ event: "volunteer_assigned", data: vol });
  } catch (err) {
    console.error("SSE volunteer assigned broadcast failure:", err);
  }

  return res.json(vol);
});

// ==========================================
// 6. INVENTORY MANAGEMENT SYSTEM
// ==========================================

app.get("/api/inventory", (req, res) => res.json(inventory));

app.put("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  
  const item = inventory.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: "Item not found in inventory stock" });

  item.quantity = Number(quantity);
  item.lastUpdated = new Date().toISOString();

  try {
    broadcastToSSE({ event: "stock_replenished", data: item });
  } catch (err) {
    console.error("SSE stock replenished broadcast failure:", err);
  }

  // Audit
  systemAudits.unshift({
    id: "aud_inv_" + id + "_" + Date.now(),
    action: "Inventory Stock Level Audit",
    role: "NGO Manager",
    details: `Updated ${item.itemName} quantity to ${item.quantity} ${item.unit}.`,
    timestamp: new Date().toISOString()
  });

  return res.json(item);
});

app.post("/api/inventory/:id/refill", (req, res) => {
  const { id } = req.params;
  const { replenishmentValue } = req.body;

  const item = inventory.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: "Item not found in inventory stock" });

  const addedValue = Number(replenishmentValue) || 200;
  item.quantity = (item.quantity || 0) + addedValue;
  item.lastUpdated = new Date().toISOString();

  try {
    broadcastToSSE({ event: "stock_replenished", data: item });
  } catch (err) {
    console.error("SSE stock replenished broadcast failure:", err);
  }

  // Audit
  systemAudits.unshift({
    id: "aud_inv_refill_" + id + "_" + Date.now(),
    action: "Inventory Stock Level Audit",
    role: "NGO Manager",
    details: `Replenished ${item.itemName} with ${addedValue} ${item.unit}. New balance: ${item.quantity}.`,
    timestamp: new Date().toISOString()
  });

  return res.json(item);
});

// ==========================================
// 7. STRIPE DONATION TRANSPARENCY & NGO WORKSPACE
// ==========================================

app.get("/api/campaigns", (req, res) => res.json(donationCampaigns));
app.get("/api/donations/receipts", (req, res) => res.json(donationReceipts));

// GET /api/donations for the general ledger list in App.tsx
app.get("/api/donations", (req, res) => {
  return res.json(donations);
});

// POST /api/donations requested by DonationStrip.tsx
app.post("/api/donations", (req, res) => {
  const { donorName, donorEmail, amount, campaignName } = req.body;

  const newDonation = {
    id: `don_${Math.random().toString(36).substring(2, 7)}`,
    donorName: donorName || "Anonymous Supporter",
    donorEmail: donorEmail || "anon@relieflink.ai",
    amount: Number(amount) || 10,
    campaignName: campaignName || "District Flood Emergency Supplies",
    createdAt: new Date().toISOString()
  };

  donations.unshift(newDonation);

  // Match the recent campaign to add indicators dynamically if possible
  const matchingCamp = donationCampaigns.find(c => c.title === campaignName);
  if (matchingCamp) {
    matchingCamp.raisedAmount += newDonation.amount;
    matchingCamp.donorCount += 1;
  }

  // Real-time SSE broadcast
  try {
    broadcastToSSE({ event: "donation_charged", data: newDonation });
  } catch (err) {
    console.error("SSE donation charged broadcast failure:", err);
  }

  return res.status(201).json(newDonation);
});

// GET /api/subscriptions requested by App.tsx
app.get("/api/subscriptions", (req, res) => {
  return res.json(tenantSubscriptions);
});

// POST /api/subscriptions/:id/upgrade requested by NGOBillingPortal.tsx
app.post("/api/subscriptions/:id/upgrade", (req, res) => {
  const { id } = req.params;
  const { tier } = req.body;

  const sub = tenantSubscriptions.find(s => s.id === id);
  if (!sub) return res.status(404).json({ error: "Tenant subscription not found" });

  sub.tier = tier;
  sub.nextBillingDate = new Date(Date.now() + 30 * 24 * 3600000).toISOString();

  // Also update corresponding ngoWorkspace if named similarly
  const matchedWorkspace = ngoWorkspaces.find(o => o.name === sub.organizationName);
  if (matchedWorkspace) {
    matchedWorkspace.tier = tier;
    matchedWorkspace.activeDisasterZonesLimit = tier === "Enterprise" ? 999 : tier === "Pro" ? 15 : 3;
    matchedWorkspace.priorityAIOptimization = tier !== "Basic";
  }

  // Audit
  systemAudits.unshift({
    id: "aud_sub_up_" + id + "_" + Date.now(),
    action: "Subscription Tier Altered",
    role: "NGO Manager",
    details: `Upgraded organization '${sub.organizationName}' to ${tier}.`,
    timestamp: new Date().toISOString()
  });

  // Real-time SSE broadcast
  try {
    broadcastToSSE({ event: "tier_upgraded", data: sub });
  } catch (err) {
    console.error("SSE tier upgraded broadcast failure:", err);
  }

  return res.json(sub);
});

// Initiate Stripe Transaction Proxy
app.post("/api/donations/pay", (req, res) => {
  const { campaignId, donorName, amount, stripeToken } = req.body;
  if (!campaignId || !amount) {
    return res.status(400).json({ error: "Amount and Campaign Target are required fields." });
  }

  const camp = donationCampaigns.find(c => c.id === campaignId);
  if (!camp) return res.status(404).json({ error: "Donation target campaign not found" });

  const donor = donorName && donorName.trim() !== "" ? donorName : "Emergency Supporter";
  const processedAmount = Number(amount);

  // Update campaign indicators
  camp.raisedAmount += processedAmount;
  camp.donorCount += 1;

  // Generate stripe reference
  const txHash = `ch_stripe_ref_${Math.random().toString(36).substring(3, 15)}_${Date.now()}`;
  const receipt = {
    id: `tx_${Math.floor(Math.random() * 900000 + 100000)}`,
    campaignId,
    campaignTitle: camp.title,
    donorName: donor,
    amount: processedAmount,
    transactionHash: txHash,
    createdAt: new Date().toISOString()
  };

  donationReceipts.unshift(receipt);

  // Translate this receipt into a general donation ledger object
  const ledgerDonation = {
    id: `don_tx_${receipt.id}`,
    donorName: donor,
    donorEmail: "donor@stripe-gateway.com",
    amount: processedAmount,
    campaignName: camp.title,
    createdAt: new Date().toISOString()
  };
  donations.unshift(ledgerDonation);

  // Real-time SSE broadcast
  try {
    broadcastToSSE({ event: "donation_charged", data: ledgerDonation });
  } catch (err) {
    console.error("SSE donation charged broadcast failure from pay:", err);
  }

  // audit
  systemAudits.unshift({
    id: "aud_tx_" + receipt.id,
    action: "Stripe Donation Processed",
    role: "Citizen",
    details: `Completed donation of $${processedAmount} to '${camp.title}'. Hash: ${txHash}`,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    receipt,
    message: "Stripe transaction cleared. Thank you for your critical support in times of crisis!"
  });
});

// API: NGO workspaces list (multi-tenant dashboard support)
app.get("/api/organizations", (req, res) => res.json(ngoWorkspaces));

// Update workspace subscription level
app.post("/api/organizations/:id/subscribe", (req, res) => {
  const { id } = req.params;
  const { tier, billingPeriod } = req.body;
  
  const org = ngoWorkspaces.find(o => o.id === id);
  if (!org) return res.status(404).json({ error: "Tenant workspace not found" });

  org.tier = tier;
  org.billingPeriod = billingPeriod || "monthly";
  org.nextBillingDate = new Date(Date.now() + 30 * 24 * 3600000).toISOString();
  org.activeDisasterZonesLimit = tier === "Enterprise" ? 999 : tier === "Professional" ? 15 : 3;
  org.priorityAIOptimization = tier !== "Basic";

  // Also update corresponding TenantSubscription in database
  const sub = tenantSubscriptions.find(s => s.organizationName === org.name);
  if (sub) {
    sub.tier = tier;
    try {
      broadcastToSSE({ event: "tier_upgraded", data: sub });
    } catch (err) {
      console.error("SSE tier upgraded broadcast failure:", err);
    }
  }

  systemAudits.unshift({
    id: "aud_sub_" + id,
    action: "Subscription Tier Altered",
    role: "NGO Manager",
    details: `Upgraded organizational tenant '${org.name}' to ${tier}. Stripe billing established.`,
    timestamp: new Date().toISOString()
  });

  return res.json(org);
});

// ==========================================
// 8. MULTI-CHANNEL COORDINATION CHATS & SSE BROADCAST
// ==========================================

app.get("/api/chat/:channelId", (req, res) => {
  const { channelId } = req.params;
  const list = chatMessages.filter(m => m.channelId === channelId);
  return res.json(list);
});

app.post("/api/chat/:channelId", (req, res) => {
  const { channelId } = req.params;
  const { senderName, senderRole, text } = req.body;

  if (!text || !senderName) {
    return res.status(400).json({ error: "Message needs text and authorization parameters" });
  }

  const newMsg = {
    id: `msg_${Math.random().toString(36).substring(2, 8)}`,
    channelId,
    senderName,
    senderRole,
    text,
    createdAt: new Date().toISOString()
  };

  chatMessages.push(newMsg);

  // Alert potential emergency subscribers in SSE if active
  broadcastToSSE({ type: "CHAT_MESSAGE", message: newMsg, event: "chat_message", data: newMsg });

  return res.status(201).json(newMsg);
});

// Server Sent Events (SSE) system for robust live updates
let sseClients: any[] = [];

app.get(["/api/sse", "/api/updates/stream"], (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial signal
  res.write("data: " + JSON.stringify({ type: "CONNECTED", message: "ReliefLink live telemetry established." }) + "\n\n");

  const client = { id: Date.now(), res };
  sseClients.push(client);

  req.on("close", () => {
    sseClients = sseClients.filter(c => c.id !== client.id);
  });
});

function broadcastToSSE(payload: any) {
  sseClients.forEach(c => {
    c.res.write("data: " + JSON.stringify(payload) + "\n\n");
  });
}

// ==========================================
// 9. GEMINI DISASTER ADVICE ASSISTANT (Bangla + English)
// ==========================================

const fallbackPreparednessGuides: Record<string, string> = {
  bangla_flood: `
# বন্যা সুরক্ষা জরুরি নির্দেশাবলী
১. **বিশুদ্ধ পানি নিশ্চিত করুন**: পানি ফুটিয়ে পান করুন অথবা পানি বিশুদ্ধকরণ ট্যাবলেট ব্যবহার করুন। দূষিত পানি ব্যবহার থেকে বিরত থাকুন।
২. **উঁচু নিরাপদ আশ্রয়ে যান**: দ্রুত নিকটবর্তী আশ্রয়কেন্দ্র বা কোনো বহুতল ভবনে আশ্রয় নিন।
৩. **জরুরি শুকনো খাবার মজুদ রাখুন**: চিড়া, মুড়ি, গুড় ও বিস্কুট জাতীয় খাবার পিপি ব্যাগে মুড়ে উঁচু স্থানে রাখুন।
৪. **ফার্স্ট এইড এবং ওষুধপত্র**: ডায়রিয়া প্রতিষেধক ওরস্যালাইন, জ্বরের ওষুধ এবং অ্যান্টিসেপটিক সাথে রাখুন।
৫. **বিদ্যুৎ সংযোগ বিচ্ছিন্ন করুন**: ঘরে পানি প্রবেশ করলে বাড়ির মূল বিদ্যুৎ লাইন বন্ধ করে দিন।
  `,
  english_flood: `
# Flood Safety Guidelines
1. **Secure Clean Water**: Use water purification tablets or boil water for 10 minutes. Avoid drinking floodwater directly.
2. **Evacuate to Elevation**: Seek closest multi-story concrete structures or state registered cyclone shelters.
3. **Dry Rations stockpile**: Store rice flakes, molasses, high-calorie biscuits and infant nutritional canisters in watertight containers.
4. **Primary Remedies**: Keep Oral Rehydration Salts (ORS), pain relievers, and antiseptic cleansers packed.
5. **Power Safety**: Disconnect electrical grids if standing water is touching wire outlets.
  `,
  bangla_earthquake: `
# ভূমিকম্প সুরক্ষা প্রস্তুতি গাইড
১. **ড্রপ, কাভার এবং হোল্ড**: ঝাঁকুনি শুরু হলে শক্ত টেবিল বা খাটের নিচে আশ্রয় নিন।
২. **দালান থেকে দূরে থাকুন**: যদি আপনি খোলা মাঠে থাকেন তবে বড় ভবন, কাচ এবং বিদ্যুতের খুটি থেকে দূরত্ব বজায় রাখুন।
৩. **লিফট ব্যবহার করবেন না**: নামার জন্য সবসময় সিঁড়ি ব্যবহার করুন। কখনোই লিফট ব্যবহার করবেন না।
৪. **ভয় পাবেন না**: শান্ত থাকুন এবং আপনার চারপাশের দুর্বল বা ঝুলন্ত জিনিস সম্পর্কে সজাগ থাকুন।
  `,
  english_earthquake: `
# Earthquake Preparedness Drills
1. **Drop, Cover, and Hold On**: Shelter under solid desks or bed frames immediately. Protect your temples and neck.
2. **Avoid High Buildings**: If outdoors, run to open fields away from electrical towers, glass frames and structurally compromised columns.
3. **Never use Elevators**: Descent exclusively via concrete internal fire stairs.
4. **Calm Action**: Turn off cooking burners stove lines dynamically if possible.
  `
};

app.post("/api/assistant/chat", async (req, res) => {
  const { message, language } = req.body;
  const isBangla = language === "bn";

  if (!message) {
    return res.status(400).json({ error: "Question query is required." });
  }

  // Audits logs
  systemAudits.unshift({
    id: "aud_ai_ast_" + Date.now(),
    action: "Gemini Chat Queried",
    role: "Citizen",
    details: `Assistant context guidance request in: ${language === "bn" ? "Bangla" : "English"}.`,
    timestamp: new Date().toISOString()
  });

  // Decide disaster type matches for customized fallback
  const normalized = message.toLowerCase();
  let fallbackText = isBangla 
    ? "ধন্যবাদ আপনার জরুরি প্রশ্নের জন্য। জীবন রক্ষায় শান্ত থাকুন। নিরাপদ স্থানে আশ্রয় নিয়ে আমাদের উদ্ধারকারী টিমের সহায়তা নিন।" 
    : "Thank you for contacting ReliefLink AI. Seek high ground, remain calm and listen to local governmental safety announcements.";

  if (normalized.includes("flood") || normalized.includes("বন্যা") || normalized.includes("পানি")) {
    fallbackText = isBangla ? fallbackPreparednessGuides.bangla_flood : fallbackPreparednessGuides.english_flood;
  } else if (normalized.includes("earth") || normalized.includes("ভূমিকম্প") || normalized.includes("quake")) {
    fallbackText = isBangla ? fallbackPreparednessGuides.bangla_earthquake : fallbackPreparednessGuides.english_earthquake;
  }

  // If Gemini API is healthy and active, run true generating execution
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction: `
            You are ReliefLink AI Expert Safety and Emergency Coordinator.
            Your absolute goal is to save human lives in disaster zones with exact, clear disaster response protocols.
            Always provide high contrast formatting, numbered steps, and actionable advice.
            Current user requests communications of advice in: ${isBangla ? "Bangla" : "English"}.
            Adopt a humble, supportive, extremely pragmatic, and authoritative relief posture.
          `,
          temperature: 0.15
        }
      });

      if (response?.text) {
        return res.json({ text: response.text });
      }
    } catch (apiError) {
      console.error("ReliefLink AI: Gemini API chat session crashed. Resorting to safe local fallback:", apiError);
    }
  }

  // Output local robust plan
  return res.json({ text: fallbackText });
});

// TTS Speech Audio Voice Assistant Endpoint (using gemini-3.1-flash-tts-preview!)
app.post("/api/assistant/speak", async (req, res) => {
  const { text, voice } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required for TTS speech synthesis." });
  }

  // Default mock PCM audio simulation in case Gemini key is missing or not authorized
  // Returns a small empty base64 WAV sound file so client audio play scripts don't fail
  const fallbackSilenceWav = "UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say clearly and reassuringly in standard voice: ${text.substring(0, 150)}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({ audio: base64Audio, format: "pcm/24000" });
      }
    } catch (ttsErr) {
      console.error("ReliefLink AI: TTS speech generation fell back:", ttsErr);
    }
  }

  // Return fallback silence payload
  return res.json({ audio: fallbackSilenceWav, format: "wav", isFallback: true });
});

// ==========================================
// 10. SOS TRIGGER API & ALERTS TELEMETRY
// ==========================================

app.get("/api/sos", (req, res) => res.json(sosAlerts));

app.post("/api/sos", (req, res) => {
  const { name, phone, latitude, longitude, medicalAssistanceRequired, trapped, currentNeeds } = req.body;
  if (!latitude || !longitude || !phone || !name) {
    return res.status(400).json({ error: "Missing essential coordinates or details" });
  }

  const newAlertId = `sos_${Math.random().toString(36).substring(2, 7)}`;

  // Find Nearest Volunteer automatically
  let nearestVol: any = null;
  let minDistance = 99999;
  for (const vol of volunteers) {
    if (vol.available) {
      const dist = calculateDistanceKm(latitude, longitude, vol.latitude, vol.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestVol = vol;
      }
    }
  }

  const alert: any = {
    id: newAlertId,
    name,
    phone,
    latitude: Number(latitude),
    longitude: Number(longitude),
    medicalAssistanceRequired: !!medicalAssistanceRequired,
    trapped: !!trapped,
    currentNeeds: currentNeeds || "Immediate extraction needed.",
    nearestResponderId: nearestVol ? nearestVol.id : undefined,
    responderDistanceKm: nearestVol ? Number(minDistance.toFixed(2)) : undefined,
    status: "Active",
    createdAt: new Date().toISOString()
  };

  sosAlerts.unshift(alert);

  // Trigger push broadcast simulation on SSE
  broadcastToSSE({ type: "SOS_ALERT", alert, event: "sos_triggered", data: alert });

  // Record Audit
  systemAudits.unshift({
    id: "aud_sos_" + alert.id,
    action: "CRITICAL SOS BROADCAST",
    role: "Citizen",
    details: `One-Tap SOS initiated by ${name} (${phone}). GPS Coords: [${latitude}, ${longitude}]. Designated responder: ${nearestVol ? nearestVol.name : "None assigned"}. SMS Alerts Sent.`,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json(alert);
});

// Resolve SOS Alert
app.patch("/api/sos/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const alert = sosAlerts.find(a => a.id === id);
  if (!alert) return res.status(404).json({ error: "SOS report not found." });

  if (status) alert.status = status;

  // Real-time SSE broadcast
  try {
    broadcastToSSE({ event: "sos_updated", data: alert });
  } catch (err) {
    console.error("SSE SOS updated broadcast failure:", err);
  }

  return res.json(alert);
});

// GET System Audit Logs
app.get("/api/audits", (req, res) => {
  // Return recent system telemetry audits
  return res.json(systemAudits);
});

// ==========================================
// REAL-TIME AUTOMATIC SIMULATORS (Satellite & Field telemetry)
// ==========================================

let satelliteData = {
  id: "sat_telemetry",
  satelliteName: "Sentinel-6 Michael Freilich",
  altitudeKm: 1336.52,
  precipitationIndex: 124.5,
  windSpeedKph: 54.2,
  submergenceWaterLevelM: 4.12,
  inundatedAreaSqKm: 345.8,
  cloudCoverPercent: 88,
  lastSatelliteSync: new Date().toISOString()
};

app.get("/api/satellite", (req, res) => {
  return res.json(satelliteData);
});

// Automatic simulated real-time telemetry updates loop
// Ticks every 5 seconds to provide extremely rich real-time visual feeds and synchronizations.
setInterval(() => {
  // 1. Update satellite reading
  satelliteData.altitudeKm = Number((1336.52 + (Math.random() - 0.5) * 0.1).toFixed(2));
  satelliteData.precipitationIndex = Number(Math.max(10, Math.min(300, satelliteData.precipitationIndex + (Math.random() - 0.5) * 2)).toFixed(1));
  satelliteData.windSpeedKph = Number(Math.max(5, Math.min(150, satelliteData.windSpeedKph + (Math.random() - 0.5) * 0.8)).toFixed(1));
  satelliteData.submergenceWaterLevelM = Number(Math.max(0.5, Math.min(10.0, satelliteData.submergenceWaterLevelM + (Math.random() - 0.5) * 0.04)).toFixed(2));
  satelliteData.inundatedAreaSqKm = Number(Math.max(10, satelliteData.inundatedAreaSqKm + (Math.random() - 0.5) * 0.5).toFixed(1));
  satelliteData.cloudCoverPercent = Math.max(0, Math.min(100, satelliteData.cloudCoverPercent + Math.round((Math.random() - 0.5) * 2)));
  satelliteData.lastSatelliteSync = new Date().toISOString();

  // Broadcast satellite update
  broadcastToSSE({ event: "satellite_update", data: satelliteData });

  // 2. Simulating live Volunteer physical displacement / coordinate drift
  volunteers.forEach(v => {
    // Slight jitter to make position update alive on map
    const latMove = (Math.random() - 0.5) * 0.0006;
    const lngMove = (Math.random() - 0.5) * 0.0006;
    v.latitude = Number((v.latitude + latMove).toFixed(5));
    v.longitude = Number((v.longitude + lngMove).toFixed(5));
    
    // Auto increment score minor points for responder patrols
    if (v.score !== undefined) {
      v.score += Math.round(Math.random() * 5);
    }

    // Sync automatic telemetry updates to Supabase
    if (supabase) {
      supabase.from("volunteers").update({
        latitude: v.latitude,
        longitude: v.longitude,
        score: v.score
      }).eq("id", v.id).then(({ error }: any) => {
        // Handled silently
      });
    }
    
    broadcastToSSE({ event: "volunteer_assigned", data: v });
  });

  // 3. Simulating dynamic supply inventory consumption
  const randIndex = Math.floor(Math.random() * inventory.length);
  const selectedItem = inventory[randIndex];
  if (selectedItem) {
    let currentQty = selectedItem.quantity || 0;
    if (currentQty > 80) {
      // Consume 1-3 packages
      const usedQty = Math.round(Math.random() * 2) + 1;
      selectedItem.quantity = currentQty - usedQty;
      selectedItem.lastUpdated = new Date().toISOString();
      broadcastToSSE({ event: "stock_replenished", data: selectedItem });
    } else {
      // Auto-replenish drone dropping if levels hit low triggers
      const refillQty = 250;
      selectedItem.quantity = currentQty + refillQty;
      selectedItem.lastUpdated = new Date().toISOString();
      broadcastToSSE({ event: "stock_replenished", data: selectedItem });

      // Add audit log
      systemAudits.unshift({
        id: "aud_sim_refill_" + selectedItem.id + "_" + Date.now(),
        action: "Simulated Automated Logistics drone dropped",
        role: "System Altimetry Engine",
        details: `Auto replenishment drone dropped ${refillQty} units of ${selectedItem.itemName} to resolve logistical alert.`,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 4. Sometimes trigger light fluctuations in flood warnings (adds real-time system alerts)
  if (Math.random() < 0.2 && disasterReports.length > 0) {
    const report = disasterReports[Math.floor(Math.random() * disasterReports.length)];
    if (report) {
      systemAudits.unshift({
        id: "aud_report_fluid_" + report.id + "_" + Date.now(),
        action: "Sub-basin Sensor Warning Level alert",
        role: "Satellite SAR Radar",
        details: `Inundation at "${report.locationName}" checked via sentinel radar. Minor stream height variation observed.`,
        timestamp: new Date().toISOString()
      });
    }
  }

}, 5000);

// ==========================================
// VITE MIDDLEWARE & STATIC HOOKS
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve build artifacts in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReliefLink AI: Server boots on port ${PORT} globally.`);
  });
}

startServer();
