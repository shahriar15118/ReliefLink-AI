import React, { useState, useEffect } from "react";
import { MLPredictionInputs, MLPredictionOutputs } from "../types";
import { fetchJson } from "../utils";
import { Brain, Sliders, Play, RefreshCw, BarChart3, Info, Check } from "lucide-react";

interface PredictiveEngineProps {
  language: "en" | "bn";
}

export default function PredictiveEngine({ language }: PredictiveEngineProps) {
  // Model input states
  const [disasterType, setDisasterType] = useState("Flood");
  const [severity, setSeverity] = useState("High");
  const [populationAffected, setPopulationAffected] = useState(2500);
  const [infrastructureDamage, setInfrastructureDamage] = useState(6);
  const [weatherCondition, setWeatherCondition] = useState("Rainy");
  const [areaSizeSqKm, setAreaSizeSqKm] = useState(25);
  const [accessibilityScore, setAccessibilityScore] = useState(4);
  const [timeSinceDisasterHours, setTimeSinceDisasterHours] = useState(6);
  const [populationDensity, setPopulationDensity] = useState(450);

  // Model training queue states
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<MLPredictionOutputs | null>(null);
  const [mseMetrics, setMseMetrics] = useState({ rmse: 184.2, mae: 112.5, r2Score: 0.941 });

  // Custom Retraining custom records and states
  const [retrainType, setRetrainType] = useState("Cyclone");
  const [retrainSeverity, setRetrainSeverity] = useState("High");
  const [retrainPop, setRetrainPop] = useState(1500);
  const [retrainWater, setRetrainWater] = useState(18000);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainCompleted, setRetrainCompleted] = useState(false);
  const [totalDatasetCount, setTotalDatasetCount] = useState(4);

  // Load initial prediction automatically
  const triggerPrediction = async () => {
    setIsPredicting(true);
    try {
      const payload: MLPredictionInputs = {
        disasterType: disasterType as any,
        severity: severity as any,
        populationAffected: Number(populationAffected),
        infrastructureDamage: Number(infrastructureDamage),
        weatherCondition: weatherCondition as any,
        areaSizeSqKm: Number(areaSizeSqKm),
        accessibilityScore: Number(accessibilityScore),
        timeSinceDisasterHours: Number(timeSinceDisasterHours),
        populationDensityPerSqKm: Number(populationDensity)
      };

      const res = await fetchJson<{ inputs: any; outputs: MLPredictionOutputs; metrics: any }>("/api/ml/predict", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      setPredictionResult(res.outputs);
      setMseMetrics(res.metrics);
    } catch (err) {
      console.error("ML model execution failure:", err);
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    triggerPrediction();
  }, [disasterType, severity]); // auto trigger prediction under type/severity alterations for snappy responsive feels

  // Fit weights action
  const handleRetraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRetraining(true);
    setRetrainCompleted(false);

    try {
      const dummyRecord = {
        disasterType: retrainType,
        severity: retrainSeverity,
        populationAffected: Number(retrainPop),
        actualWaterNeeded: Number(retrainWater)
      };

      const res = await fetchJson<{ success: boolean; totalDatasetRows: number; newMetrics: any }>("/api/ml/retrain", {
        method: "POST",
        body: JSON.stringify({ newRecords: [dummyRecord] })
      });

      if (res.success) {
        setTotalDatasetCount(res.totalDatasetRows);
        setMseMetrics(res.newMetrics);
        setRetrainCompleted(true);
        triggerPrediction(); // update outputs to match new coefficients
      }
    } catch (err) {
      console.error("Model fit update crashed:", err);
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Parameters configuration sidebar */}
      <div className="lg:col-span-1 bg-[#121214] border border-white/10 p-6 rounded-2xl space-y-6 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Sliders className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-display font-medium text-white leading-tight">
              {language === "en" ? "Model Feature Matrix" : "ইনপুট ফ্যাক্টর ম্যাট্রিক্স"}
            </h3>
            <span className="text-[10px] font-mono text-white/40">9 CONTINUOUS TARGET CHANNELS</span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Disaster Type */}
          <div>
            <label className="block text-white/60 font-medium mb-1.5">Disaster Incident Classification</label>
            <select
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-lg focus:outline-hidden"
            >
              {["Flood", "Earthquake", "Cyclone", "Fire", "Landslide", "Tornado", "Tsunami", "Pandemic", "Industrial Accident"].map((val) => (
                <option key={val} value={val} className="bg-[#121214] text-white">{val}</option>
              ))}
            </select>
          </div>

          {/* Declared Severity */}
          <div>
            <label className="block text-white/60 font-medium mb-1.5">Emergency Declared Severity</label>
            <div className="grid grid-cols-4 gap-1.5">
              {["Low", "Medium", "High", "Critical"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSeverity(val)}
                  className={`py-2 rounded-md font-medium text-[10px] border transition-all cursor-pointer ${severity === val ? "bg-orange-600 border-orange-500 text-white font-bold" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Affected Population Slider with readout */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-white/60 font-medium">Population Affected Volume</label>
              <span className="font-mono text-white font-bold">{populationAffected.toLocaleString()} pax</span>
            </div>
            <input
              type="range"
              min="100"
              max="20000"
              step="100"
              value={populationAffected}
              onChange={(e) => setPopulationAffected(Number(e.target.value))}
              className="w-full accent-orange-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Infrastructure damage index */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-white/60 font-medium">Core Infrastructure Collapse Index</label>
              <span className="font-mono text-white font-semibold">Level {infrastructureDamage}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={infrastructureDamage}
              onChange={(e) => setInfrastructureDamage(Number(e.target.value))}
              className="w-full accent-orange-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Weather Conditions selection */}
          <div>
            <label className="block text-white/60 font-medium mb-1.5">Active Weather Multiplier</label>
            <select
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-lg focus:outline-hidden"
            >
              {["Clear", "Rainy", "Extreme Storm", "Heavy Snow", "Flooding"].map((val) => (
                <option key={val} value={val} className="bg-[#121214] text-white">{val}</option>
              ))}
            </select>
          </div>

          {/* Area affected size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/60 font-medium mb-1">Area Surface (Sq Km)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={areaSizeSqKm}
                onChange={(e) => setAreaSizeSqKm(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-white/60 font-medium mb-1">Accessibility (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={accessibilityScore}
                onChange={(e) => setAccessibilityScore(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Run Inference Explicit Trigger button */}
          <button
            onClick={triggerPrediction}
            disabled={isPredicting}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-white/10 text-white py-3 rounded-xl font-display font-semibold transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            {isPredicting ? <RefreshCw className="w-4 h-4 animate-spin text-white/40" /> : <Play className="w-4 h-4 text-white fill-white" />}
            <span>Execute Logistic Regression Pipeline</span>
          </button>
        </div>
      </div>

      {/* Inference prognostic output dashboard */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl space-y-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <Brain className="w-5 h-5 text-orange-500" />
              <div>
                <h3 className="font-display font-medium text-white leading-tight">
                  {language === "en" ? "Cognitive Resource Forecast" : "সম্পদ চাহিদার পূর্বাভাস আউটপুট"}
                </h3>
                <span className="text-[10px] font-mono text-white/40">95% ACCURACY CONFIDENCE INTERVALS BOUNDS</span>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-mono bg-orange-600/10 text-orange-400 border border-orange-500/20 font-bold px-2.5 py-1 rounded">XGBOOST DEPLOYED</span>
            </div>
          </div>

          {isPredicting && !predictionResult ? (
            <div className="py-24 text-center font-mono text-sm text-white/40 animate-pulse">
              Computing multivariate logistic regressions...
            </div>
          ) : predictionResult ? (
            <div className="space-y-6">
              {/* Output parameters widgets bento layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Clean Water */}
                <div className="bg-sky-500/5 border border-sky-500/25 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-sky-400 block font-bold">DRINKING WATER</span>
                  <span className="block text-xl font-black text-white font-display">
                    {predictionResult.waterLitersNeeded.toLocaleString()} <span className="text-xs font-normal text-white/60">Liters</span>
                  </span>
                  <span className="text-[9px] font-mono text-sky-400/70 block">
                    Range: [{predictionResult.confidenceIntervals.water[0].toLocaleString()} - {predictionResult.confidenceIntervals.water[1].toLocaleString()}]
                  </span>
                </div>

                {/* Dry Foods */}
                <div className="bg-yellow-500/5 border border-yellow-500/25 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-yellow-400 block font-bold">FORTIFIED FOOD</span>
                  <span className="block text-xl font-black text-white font-display">
                    {predictionResult.foodKgsNeeded.toLocaleString()} <span className="text-xs font-normal text-white/60">Kgs</span>
                  </span>
                  <span className="text-[9px] font-mono text-yellow-400/70 block">
                    Range: [{predictionResult.confidenceIntervals.food[0].toLocaleString()} - {predictionResult.confidenceIntervals.food[1].toLocaleString()}]
                  </span>
                </div>

                {/* Medicine Kits */}
                <div className="bg-rose-500/5 border border-rose-500/25 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-rose-400 block font-bold">MEDICAL KITS</span>
                  <span className="block text-xl font-black text-white font-display">
                    {predictionResult.medicineKitsNeeded.toLocaleString()} <span className="text-xs font-normal text-white/60">Units</span>
                  </span>
                  <span className="text-[9px] font-mono text-rose-400/70 block">
                    Range: [{predictionResult.confidenceIntervals.medicine[0].toLocaleString()} - {predictionResult.confidenceIntervals.medicine[1].toLocaleString()}]
                  </span>
                </div>

                {/* Shelter Tents */}
                <div className="bg-indigo-500/5 border border-indigo-500/25 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 block font-bold">SHELTER TENTS</span>
                  <span className="block text-xl font-black text-white font-display">
                    {predictionResult.shelterTentsNeeded.toLocaleString()} <span className="text-xs font-normal text-white/60">Tents</span>
                  </span>
                  <span className="text-[9px] font-mono text-indigo-400/70 block">
                    Range: [{predictionResult.confidenceIntervals.shelter[0].toLocaleString()} - {predictionResult.confidenceIntervals.shelter[1].toLocaleString()}]
                  </span>
                </div>

                {/* Rescue Team */}
                <div className="bg-red-500/5 border border-red-500/25 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-red-400 block font-bold">RESCUE UNIONS</span>
                  <span className="block text-xl font-black text-white font-display">
                    {predictionResult.rescueTeamsNeeded.toLocaleString()} <span className="text-xs font-normal text-white/60">Squads</span>
                  </span>
                  <span className="text-[9px] font-mono text-red-400/70 block">
                    Range: [{predictionResult.confidenceIntervals.rescue[0].toLocaleString()} - {predictionResult.confidenceIntervals.rescue[1].toLocaleString()}]
                  </span>
                </div>

                {/* Diesel Fuel */}
                <div className="bg-amber-500/5 border border-amber-500/25 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 block font-bold">COMB_DIESEL FUEL</span>
                  <span className="block text-xl font-black text-white font-display">
                    {predictionResult.fuelLitersNeeded.toLocaleString()} <span className="text-xs font-normal text-white/60">Liters</span>
                  </span>
                  <span className="text-[9px] font-mono text-amber-400/70 block">
                    Range: [{predictionResult.confidenceIntervals.fuel[0].toLocaleString()} - {predictionResult.confidenceIntervals.fuel[1].toLocaleString()}]
                  </span>
                </div>
              </div>

              {/* Training Evaluation Performance Card */}
              <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-white/40" />
                  <span>Interactive Pipeline General Error Bounds:</span>
                </span>
                <div className="flex gap-4 font-bold text-white">
                  <span>RMSE: <span className="text-orange-500">{mseMetrics.rmse}</span></span>
                  <span>MAE: <span className="text-orange-400">{mseMetrics.mae}</span></span>
                  <span>R² Score: <span className="text-emerald-400">{mseMetrics.r2Score}</span></span>
                </div>
              </div>

              {/* Feature Importance vector levels */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-white/40" />
                  <span>XGBoost Vector Feature Weights Relevance</span>
                </h4>
                <div className="space-y-2">
                  {predictionResult.featureImportance.map((f, i) => (
                    <div key={i} className="text-[11px] space-y-1">
                      <div className="flex justify-between items-center text-white/70">
                        <span>{f.feature}</span>
                        <span className="font-mono font-bold">{(f.importanceScore * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${f.importanceScore * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Model Continuous Retraining Panel */}
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
            <RefreshCw className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-display font-medium text-white leading-tight">
                {language === "en" ? "Dynamic Model Retraining Queue" : "টেলিমিত্রি মডেল পুনঃপ্রশিক্ষণ"}
              </h3>
              <span className="text-[10px] font-mono text-white/40">FIT LOGISTIC COEFFICIENTS OVER LIVE COORDINATE FEEDBACK</span>
            </div>
          </div>

          <form onSubmit={handleRetraining} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
            <div>
              <label className="block text-white/60 mb-1">Disaster Type</label>
              <select
                value={retrainType}
                onChange={(e) => setRetrainType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-lg"
              >
                {["Flood", "Cyclone", "Earthquake", "Fire"].map(v => <option key={v} value={v} className="bg-[#121214]">{v}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-white/60 mb-1">Severity</label>
              <select
                value={retrainSeverity}
                onChange={(e) => setRetrainSeverity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-lg"
              >
                {["Low", "Medium", "High", "Critical"].map(v => <option key={v} value={v} className="bg-[#121214]">{v}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-white/60 mb-1">Volume (Pax)</label>
              <input
                type="number"
                value={retrainPop}
                onChange={(e) => setRetrainPop(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={isRetraining}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-white/10 text-white font-display font-semibold p-2.5 rounded-lg text-xs tracking-tight shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              {isRetraining ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white font-bold" />
              )}
              <span>Train over record</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] font-mono text-white/40 bg-white/5 p-2.5 rounded border border-white/10">
            <span>TRAINING INDEX RECORD COUNT: <span className="font-bold text-white">{totalDatasetCount} records</span></span>
            {retrainCompleted && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                ✔ COEFFICIENTS ALIGNED SUCCESSFULLY
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
