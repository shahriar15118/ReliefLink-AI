import React, { useState } from "react";
import { TenantSubscription } from "../types";
import { fetchJson } from "../utils";
import { Building, Check, Sparkles, CreditCard, Layers } from "lucide-react";

interface NGOBillingPortalProps {
  language: "en" | "bn";
  subscriptions: TenantSubscription[];
  onUpgradeSubscription: (updatedSub: TenantSubscription) => void;
}

export default function NGOBillingPortal({ language, subscriptions, onUpgradeSubscription }: NGOBillingPortalProps) {
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [targetTier, setTargetTier] = useState<"Basic" | "Pro" | "Enterprise">("Pro");
  
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId) return;

    setIsUpgrading(true);
    setSuccessMsg("");

    try {
      const res = await fetchJson<TenantSubscription>(`/api/subscriptions/${selectedSubId}/upgrade`, {
        method: "POST",
        body: JSON.stringify({ tier: targetTier })
      });

      onUpgradeSubscription(res);
      setSuccessMsg(`Upgraded successfully! Organization ${res.organizationName} is now on ${res.tier} tier.`);
    } catch (err) {
      console.error("Upgrade failed:", err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const currentOrg = subscriptions.find(s => s.id === selectedSubId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Registered NGO Workspaces listing */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Building className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-display font-medium text-white leading-tight">
              {language === "en" ? "NGO Tenants Workspaces" : "এনজিও এন্টারপ্রাইজ ওয়ার্কস্পেস"}
            </h3>
            <span className="text-[10px] font-mono text-white/40">ACTIVE MULTI-TENANT ENTITIES</span>
          </div>
        </div>

        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
          {subscriptions.map(sub => (
            <div
              key={sub.id}
              onClick={() => { setSelectedSubId(sub.id); setSuccessMsg(""); }}
              className={`p-4 border rounded-xl cursor-pointer hover:shadow-sm transition-all space-y-2.5 ${selectedSubId === sub.id ? "bg-orange-600/10 border-orange-500/40 border" : "bg-white/[0.02] border-white/10"}`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white mb-0.5">{sub.organizationName}</span>
                <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${sub.tier === "Enterprise" ? "bg-purple-500/15 text-purple-400 border border-purple-500/25 font-extrabold" : sub.tier === "Pro" ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" : "bg-white/10 text-white/60 border border-white/10"}`}>
                  {sub.tier}
                </span>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-white/50">
                <span>Active Duty Sectors:</span>
                <span className="text-white/80 font-semibold truncate max-w-[140px]">{sub.activeSectors.join(", ")}</span>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono pt-1.5 border-t border-white/10">
                <span>Monthly Billing:</span>
                <span className="font-bold text-white">${sub.tier === "Enterprise" ? "1,200/mo" : sub.tier === "Pro" ? "450/mo" : "0 (Free)"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER COLUMN: Subscription Upgrade console */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        <h4 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-white/40" />
          <span>Tenant Workspace Console</span>
        </h4>

        {selectedSubId ? (
          <form onSubmit={handleUpgradeSubmit} className="space-y-4 text-xs">
            <div>
              <span className="text-white/40 text-[10px] font-mono block">MANAGING ORGANIZATION:</span>
              <strong className="block text-sm text-white font-display mt-0.5">{currentOrg?.organizationName}</strong>
            </div>

            <div>
              <label className="block text-white/60 font-medium mb-1.5">Select Premium Tier Plan</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["Basic", "Pro", "Enterprise"].map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setTargetTier(tier as any)}
                    className={`py-2 rounded-lg font-medium text-[10px] border transition-all cursor-pointer ${targetTier === tier ? "bg-orange-600 border-orange-500 text-white font-bold" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-white/40 uppercase">TIER INCLUDES:</span>
              <div className="space-y-1 text-[11px] text-white/80">
                {targetTier === "Enterprise" && (
                  <>
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Dedicated server-side Gemini assessors</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Unlimited A* route plot operations</span>
                    </div>
                  </>
                )}
                {targetTier === "Pro" && (
                  <>
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Up to 15 assigned duty volunteers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Standard ML Resource inference models</span>
                    </div>
                  </>
                )}
                {targetTier === "Basic" && (
                  <div className="flex items-center gap-1 text-white/40">
                    <Check className="w-3.5 h-3.5 text-white/20 shrink-0" />
                    <span>Basic read/write disaster maps access</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpgrading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-white/10 text-white font-display font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-white" />
              <span>Transact Premium Switch</span>
            </button>

            {successMsg && (
              <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg border border-emerald-500/25 font-semibold text-center mt-2">
                {successMsg}
              </div>
            )}
          </form>
        ) : (
          <div className="p-8 text-center text-white/40 font-mono text-xs border border-dashed border-white/10 rounded-2xl italic">
            Select an NGO workspace from the left pane to modify parameters...
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Premium Sponsorship layout info banner */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h3 className="font-display font-semibold text-white leading-tight">Elite Concession Licenses</h3>
            <span className="text-[10px] font-mono text-white/40">STATE RESCUE PARTNERSHIPS</span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-white/60 text-[11px] leading-relaxed">
            ReliefLink AI supports secure tenant separation. All subscription revenue is processed instantly through Stripe connected accounts, with proceeds funneled back to active Demra crisis center rations.
          </p>

          <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-1">
            <strong className="block text-xs font-display text-purple-300">Government SLA Compliance</strong>
            <p className="text-[10px] text-purple-400/80 leading-relaxed font-sans">Enterprise tier guarantees 99.9% uptime with direct satellite fallback modes during communications collapse.</p>
          </div>

          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1">
            <strong className="block text-xs font-display text-blue-300">Stripe Invoices Automated</strong>
            <p className="text-[10px] text-blue-400/80 leading-relaxed font-sans">System compiles direct PDF usage invoice statements. Zero overhead taxes deducted for local NGOs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
