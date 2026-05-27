import React, { useState } from "react";
import { StockInventory } from "../types";
import { fetchJson } from "../utils";
import { Package, RefreshCw, Layers, ShieldAlert } from "lucide-react";

interface InventoryManagerProps {
  language: "en" | "bn";
  inventory: StockInventory[];
  onRefillStock: (updatedItem: StockInventory) => void;
}

export default function InventoryManager({ language, inventory, onRefillStock }: InventoryManagerProps) {
  const [refillLoadingId, setRefillLoadingId] = useState<string | null>(null);
  const [refillAmount, setRefillAmount] = useState<number>(200);

  const handleRefill = async (id: string) => {
    setRefillLoadingId(id);
    try {
      const res = await fetchJson<StockInventory>(`/api/inventory/${id}/refill`, {
        method: "POST",
        body: JSON.stringify({ replenishmentValue: Number(refillAmount) })
      });
      onRefillStock(res);
      setRefillAmount(200);
    } catch (err) {
      console.error("Refill transaction failure:", err);
    } finally {
      setRefillLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: Registered Stocks & alerts panels */}
      <div className="lg:col-span-2 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-display font-medium text-white leading-tight">
                {language === "en" ? "Interactive Stock Logistics" : "ত্রাণ সামগ্রী লাইভ ইনভেন্টরি"}
              </h3>
              <span className="text-[10px] font-mono text-white/40">DECISION SUPPLIES LOGISTICS CHANNELS</span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-orange-600/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded font-bold uppercase">
            RFID SECURED
          </span>
        </div>

        {/* Dynamic Stock List Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inventory.map(item => {
            const currentStock = item.currentStock !== undefined ? item.currentStock : (item.quantity !== undefined ? item.quantity : 0);
            const maxCapacity = item.maxCapacity !== undefined ? item.maxCapacity : (item.minimumThreshold !== undefined ? item.minimumThreshold * 5 : 1000);
            const refillPercent = Math.round((currentStock / Math.max(1, maxCapacity)) * 100);
            const isCritical = refillPercent < 35;

            return (
              <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-white font-display block leading-normal">{item.itemName}</span>
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider block font-semibold">{item.category}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isCritical ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                    {refillPercent}% STOCK
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-white/40 font-mono font-medium">
                    <span>Remaining Units</span>
                    <span>{currentStock.toLocaleString()}/{maxCapacity.toLocaleString()} {item.unit}</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isCritical ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${refillPercent}%` }}></div>
                  </div>
                </div>

                {/* Operations refill action console embedded */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-white/40 font-mono">REPLACE:</span>
                    <input
                      type="number"
                      required
                      value={refillAmount}
                      onChange={(e) => setRefillAmount(Number(e.target.value))}
                      className="w-14 bg-white/5 border border-white/10 text-white text-center font-mono py-1 rounded text-[10px] focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={() => handleRefill(item.id)}
                    disabled={refillLoadingId !== null}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-white/10 text-white font-display text-[10px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {refillLoadingId === item.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <Package className="w-3 h-3 text-white" />
                    )}
                    <span>Refill stock</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Supply chains hazard alert indicators */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Layers className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-display font-medium text-white leading-tight">Supply Chain Deficits</h3>
            <span className="text-[10px] font-mono text-white/40">CRITICAL DISPATCH ALERTS SYSTEM</span>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          {inventory.filter(item => {
            const currentStock = item.currentStock !== undefined ? item.currentStock : (item.quantity !== undefined ? item.quantity : 0);
            const maxCapacity = item.maxCapacity !== undefined ? item.maxCapacity : (item.minimumThreshold !== undefined ? item.minimumThreshold * 5 : 1000);
            return (currentStock / Math.max(1, maxCapacity)) < 0.35;
          }).length === 0 ? (
            <div className="p-4 bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium text-center font-sans">
              ✔ SUPPLY REFILL BALANCES SOUND. All stock thresholds registered safe.
            </div>
          ) : (
            inventory.filter(item => {
              const currentStock = item.currentStock !== undefined ? item.currentStock : (item.quantity !== undefined ? item.quantity : 0);
              const maxCapacity = item.maxCapacity !== undefined ? item.maxCapacity : (item.minimumThreshold !== undefined ? item.minimumThreshold * 5 : 1000);
              return (currentStock / Math.max(1, maxCapacity)) < 0.35;
            }).map(item => {
              const currentStock = item.currentStock !== undefined ? item.currentStock : (item.quantity !== undefined ? item.quantity : 0);
              const maxCapacity = item.maxCapacity !== undefined ? item.maxCapacity : (item.minimumThreshold !== undefined ? item.minimumThreshold * 5 : 1000);
              return (
                <div key={item.id} className="p-3.5 bg-rose-500/5 text-rose-300 border border-rose-500/20 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1 bg-white/0">
                    <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
                    <span className="font-mono text-[9px] font-bold text-red-400">ALERT: LOGISTICS DEFICIT DETECTED</span>
                  </div>
                  <strong className="block text-xs font-display text-white">{item.itemName} level is critically low ({Math.round(currentStock / Math.max(1, maxCapacity) * 100)}%)</strong>
                  <p className="text-[10px] text-white/60 leading-relaxed font-sans">
                    Refill at least {Math.round(maxCapacity * 0.4)} units instantly to maintain active operations parameters during the flood peak.
                  </p>
                </div>
              );
            })
          )}

          <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl text-[11px] text-white/50 leading-relaxed font-mono">
            <strong>RFID Gateway:</strong> Broadcast telemetry tracks shipments approaching Demra transit borders. ETA: 24 mins.
          </div>
        </div>
      </div>
    </div>
  );
}
