// frontend/src/components/analytics/PredictiveOperationsCard.tsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Package,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '@/api/client';

interface PredictiveData {
  campId: string;
  campName: string;
  hasSufficientData: boolean;
  historicalCompletedCampsCount: number;
  thresholdRequired?: number;
  message?: string;
  baselineGuidelines?: {
    doctorToPatientRatio: string;
    volunteerToPatientRatio: string;
    recommendedEmergencyBuffer: string;
    peakQueueWindowRecommendation: string;
  };
  sourceData?: {
    historicalCompletedCampsCount: number;
    totalScreeningsAnalyzed: number;
    historicalSamplePeriod: string;
  };
  estimationMetadata?: {
    model: string;
    confidenceInterval: string;
    marginOfErrorPct: number;
    assumptions: string[];
  };
  attendanceForecast?: {
    projectedAttendance: number;
    confidenceRange: { lowerBound: number; upperBound: number };
    turnoutRateEstimatePct: number;
  };
  staffingRecommendations?: {
    recommendedDoctors: number;
    recommendedVolunteers: number;
    consultationRoomsRequired: number;
    queueStationsRecommended: number;
  };
  hourlyQueuePressure?: Array<{
    timeWindow: string;
    expectedArrivalsPct: number;
    estimatedTokens: number;
    pressureLevel: string;
  }>;
  estimatedSupplyRequirements?: Array<{
    item: string;
    consumptionPer100: number;
    estimatedRequirement: number;
    unit: string;
    recommendedSafetyStock: number;
  }>;
  boundaryClassification: {
    type: string;
    clinicalDisclaimer: string;
  };
}

export const PredictiveOperationsCard: React.FC<{ campId?: string }> = ({ campId = 'camp-1' }) => {
  const [data, setData] = useState<PredictiveData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);
  const [simulateSufficient, setSimulateSufficient] = useState<boolean>(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const url = `/analytics/predictive-operations/${campId}${simulateSufficient ? '?simulateSufficient=true' : ''}`;
      const res = await api.get(url);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load predictive operations data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [campId, simulateSufficient]);

  if (loading) {
    return (
      <div className="p-8 bg-navy-900 border border-slate-800 rounded-3xl animate-pulse text-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-400">Evaluating historical camp logs and arrival Poisson distributions...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-navy-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20 text-xs font-mono font-medium">
              OPERATIONAL FORECASTING
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
                data.hasSufficientData
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {data.hasSufficientData ? '✓ EMPIRICAL MODEL ACTIVE' : '⚠ INSUFFICIENT DATA GUARD'}
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight mt-1.5">
            Predictive Camp Operations & Logistics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Target Camp: <span className="text-slate-200 font-semibold">{data.campName}</span>
          </p>
        </div>

        {/* Simulation Toggle for Demo Testing */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 text-[11px]">Demo Historical Mode:</span>
          <button
            onClick={() => setSimulateSufficient(!simulateSufficient)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              simulateSufficient
                ? 'bg-teal-600 border-teal-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {simulateSufficient ? 'Simulating ≥3 Camps (Sufficient)' : 'Show Baseline Guard (<3 Camps)'}
          </button>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Clinical Boundary Banner */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong className="text-white">Strict Logistical Isolation: </strong>
          {data.boundaryClassification.clinicalDisclaimer}
        </p>
      </div>

      {/* Case A: Insufficient Historical Data */}
      {!data.hasSufficientData ? (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 text-xs space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Data Sufficiency Threshold Not Met
              </h4>
              <p className="text-slate-300 mt-1 leading-relaxed">
                {data.message}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-0.5">Recommended Staffing Ratio:</span>
              <p className="text-amber-200">{data.baselineGuidelines?.doctorToPatientRatio}</p>
              <p className="text-amber-200 mt-0.5">{data.baselineGuidelines?.volunteerToPatientRatio}</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-0.5">Supply Safety Buffer:</span>
              <p className="text-slate-200">{data.baselineGuidelines?.recommendedEmergencyBuffer}</p>
              <p className="text-slate-400 mt-0.5">{data.baselineGuidelines?.peakQueueWindowRecommendation}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Case B: Sufficient Empirical Data */
        <div className="space-y-6">
          {/* Top Forecast KPI Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                <span>PROJECTED ATTENDANCE</span>
                <Users className="w-4 h-4 text-primary-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                ~{data.attendanceForecast?.projectedAttendance} patients
              </div>
              <div className="text-[11px] text-primary-300 mt-1">
                90% Confidence: {data.attendanceForecast?.confidenceRange.lowerBound} - {data.attendanceForecast?.confidenceRange.upperBound}
              </div>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                <span>RECOMMENDED STAFF</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black font-mono text-teal-300 mt-2">
                {data.staffingRecommendations?.recommendedDoctors} Doctors • {data.staffingRecommendations?.recommendedVolunteers} Volunteers
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Based on 14-min average consultation
              </div>
            </div>

            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                <span>PEAK QUEUE PRESSURE</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black font-mono text-amber-300 mt-2">
                09:30 - 11:30 AM
              </div>
              <div className="text-[11px] text-amber-400/80 mt-1">
                Expect 60% of daily arrivals in morning surge
              </div>
            </div>
          </div>

          {/* Hourly Queue Pressure Curve */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Arrival Pressure Curve by Time Window (Poisson Modeling)</span>
              <span className="text-[11px] font-mono text-slate-400">Total Analyzed: {data.sourceData?.totalScreeningsAnalyzed} Screenings</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
              {data.hourlyQueuePressure?.map((h) => (
                <div
                  key={h.timeWindow}
                  className={`p-3 rounded-xl border text-center flex flex-col justify-between ${
                    h.pressureLevel === 'PEAK'
                      ? 'bg-red-500/10 border-red-500/40 text-red-200'
                      : h.pressureLevel === 'HIGH'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-mono">{h.timeWindow}</div>
                  <div className="text-lg font-bold font-mono my-1">{h.estimatedTokens} tokens</div>
                  <div className="text-[10px] font-semibold">{h.pressureLevel}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Projected Medicine & Supply Requirements */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-400" />
              <span>Forecasted Essential Medicine & Consumable Requirements</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2 px-3">SUPPLY ITEM</th>
                    <th className="py-2 px-3">RATE / 100 PATIENTS</th>
                    <th className="py-2 px-3">ESTIMATED REQ.</th>
                    <th className="py-2 px-3 text-right">SAFETY STOCK BUFFER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.estimatedSupplyRequirements?.map((item) => (
                    <tr key={item.item} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-slate-100">{item.item}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        {item.consumptionPer100} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-300">
                        {item.estimatedRequirement} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                        +{item.recommendedSafetyStock} {item.unit} (buffer)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistical Assumptions Accordion */}
          <div className="pt-2">
            <button
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{showAssumptions ? 'Hide Model Assumptions & Error Margins' : 'Inspect Statistical Model Assumptions (±12% Margin)'}</span>
              {showAssumptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAssumptions && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-2 animate-fade-in">
                <div className="text-slate-300 font-semibold">
                  Model: {data.estimationMetadata?.model}
                </div>
                <div className="text-slate-400">
                  Confidence Interval: {data.estimationMetadata?.confidenceInterval} • Margin of Error: ±{data.estimationMetadata?.marginOfErrorPct}%
                </div>
                <ul className="list-disc pl-5 text-slate-400 space-y-1 text-[11px] pt-1">
                  {data.estimationMetadata?.assumptions.map((asm, idx) => (
                    <li key={idx}>{asm}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveOperationsCard;
