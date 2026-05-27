/**
 * ReliefLink AI Shared Types
 */

export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  GOVERNMENT_ADMIN = "Government Admin",
  NGO_MANAGER = "NGO Manager",
  EMERGENCY_RESPONDER = "Emergency Responder",
  VOLUNTEER = "Volunteer",
  SHELTER_MANAGER = "Shelter Manager",
  CITIZEN = "Citizen"
}

export enum DisasterType {
  FLOOD = "Flood",
  EARTHQUAKE = "Earthquake",
  CYCLONE = "Cyclone",
  FIRE = "Fire",
  LANDSLIDE = "Landslide",
  TORNADO = "Tornado",
  TSUNAMI = "Tsunami",
  PANDEMIC = "Pandemic",
  INDUSTRIAL_ACCIDENT = "Industrial Accident"
}

export enum SeverityLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical"
}

export enum ReportStatus {
  PENDING = "Pending",
  DISPATCHED = "Dispatched",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved"
}

export interface AIDamageAnalysis {
  structuralDamageScore: number; // 0 to 100
  floodSeverityScore?: number; // 0 to 100
  fireSpreadRisk?: number; // 0 to 100
  roadBlockage: boolean;
  infrastructureCollapse: boolean;
  triageCategory: string; // immediate, delayed, minor
  recommendedResponse: string;
  riskRating: "Low" | "Medium" | "High" | "Extreme";
  summary: string;
}

export interface DisasterReport {
  id: string;
  type: DisasterType;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  locationName: string;
  description: string;
  status: ReportStatus;
  reporterName: string;
  reporterPhone?: string;
  imageUrl?: string;
  aiAnalysis?: AIDamageAnalysis;
  duplicateOf?: string; // id of another report if flagged
  createdAt: string;
  updatedAt: string;
  victimCount?: number;
}

// Subscription management
export enum SubscriptionTier {
  BASIC = "Basic",
  PROFESSIONAL = "Professional",
  ENTERPRISE = "Enterprise"
}

export interface NGOWorkspace {
  id: string;
  name: string;
  tier: SubscriptionTier;
  billingPeriod: "monthly" | "yearly";
  nextBillingDate: string;
  activeDisasterZonesLimit: number;
  priorityAIOptimization: boolean;
  isCustomBranded: boolean;
  logoUrl?: string;
  tenantKey: string; // multi-tenant workspace key
}

// Donation management
export interface DonationCampaign {
  id: string;
  title: string;
  ngoName: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  donorCount: number;
  disasterId?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface DonationReceipt {
  id: string;
  campaignId: string;
  campaignTitle: string;
  donorName: string;
  amount: number;
  transactionHash: string;
  createdAt: string;
}

// SOS system
export interface SOSAlert {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  medicalAssistanceRequired: boolean;
  trapped: boolean;
  currentNeeds: string;
  nearestResponderId?: string;
  responderDistanceKm?: number;
  status: "Active" | "Responding" | "Resolved";
  createdAt: string;
}

// Chat coordination
export interface ChatMessage {
  id: string;
  channelId: string; // "broadcast" | "ngo-coordination" | "volunteers" | "zones-{disasterId}"
  senderName: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
}

// Shelter registration
export interface Shelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number;
  waterAvailability: "None" | "Low" | "充足" | "Adequate";
  foodAvailability: "None" | "Low" | "Adequate";
  medicalStatus: "Poor" | "Moderate" | "Good";
  createdAt: string;
}

// Volunteer models
export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  skills: string[]; // "First Aid", "Driving", "Search & Rescue", "Cooking", "Coordination"
  latitude: number;
  longitude: number;
  available: boolean;
  score: number; // leaderboards points
  assignedTaskId?: string;
  currentTaskName?: string;
}

// Supply list and alerts
export interface ResourceInventory {
  id: string;
  category: "Water" | "Food" | "Medicine" | "Fuel" | "Vehicles" | "Rescue Equipment" | "Emergency Kits";
  itemName: string;
  quantity: number;
  unit: string;
  minimumThreshold: number;
  locationName: string;
  lastUpdated: string;
}

// ML inputs
export interface MLPredictionInputs {
  disasterType: DisasterType;
  severity: SeverityLevel;
  populationAffected: number;
  infrastructureDamage: number; // 0 to 10
  weatherCondition: "Clear" | "Rainy" | "Extreme Storm" | "Heavy Snow" | "Flooding";
  areaSizeSqKm: number;
  accessibilityScore: number; // 1 to 10 (1 is disconnected, 10 is perfect)
  timeSinceDisasterHours: number;
  populationDensityPerSqKm: number;
}

// ML outputs
export interface MLPredictionOutputs {
  waterLitersNeeded: number;
  foodKgsNeeded: number;
  medicineKitsNeeded: number;
  shelterTentsNeeded: number;
  rescueTeamsNeeded: number;
  fuelLitersNeeded: number;
  confidenceIntervals: {
    water: [number, number];
    food: [number, number];
    medicine: [number, number];
    shelter: [number, number];
    rescue: [number, number];
    fuel: [number, number];
  };
  evaluationMetrics: {
    rmse: number;
    mae: number;
    r2Score: number;
  };
  featureImportance: {
    feature: string;
    importanceScore: number;
  }[];
}

// A* routing
export interface GridPosition {
  x: number;
  y: number;
}

export interface RouteStep {
  latitude: number;
  longitude: number;
  roadName: string;
  riskFactor: number; // 1.0 (clear) to 10.0 (extreme blockage/danger)
  isSafe: boolean;
}

export interface DispatchRouteResult {
  path: RouteStep[];
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  routingAlgorithmUsed: "A* Search Model" | "Greedy Dispatch" | "Constraint-Satisfaction Optimization";
  hazardPointsEncountered: number;
  wastageRiskPercentage: number;
  coverageEfficiencyScore: number;
}

// Backward compatibility exports for frontend layers
export interface StockInventory {
  id: string;
  category: string;
  itemName: string;
  currentStock: number;
  maxCapacity: number;
  quantity?: number;
  minimumThreshold?: number;
  unit: string;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  campaignName: string;
  createdAt: string;
}

export interface TenantSubscription {
  id: string;
  organizationName: string;
  activeSectors: string[];
  tier: "Basic" | "Pro" | "Enterprise";
  billingPeriod: "monthly" | "yearly";
  nextBillingDate: string;
}

