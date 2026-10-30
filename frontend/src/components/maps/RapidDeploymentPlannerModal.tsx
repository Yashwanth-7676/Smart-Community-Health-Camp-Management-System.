// frontend/src/components/maps/RapidDeploymentPlannerModal.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 7: RAPID HEALTHCARE DEPLOYMENT PLANNER
 * Emergency surge response, resource requirement estimation & road routing to tertiary centers
 */

import React, { useState } from 'react';
import {
  Send,
  Building2,
  Users,
  Truck,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { KARNATAKA_DISTRICTS_DATA } from './karnatakaDistrictsData';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

interface RapidDeploymentPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateCoords: [number, number] | null;
  onPickCoordsOnMap: () => void;
  onFocusDistrict: (districtName: string) => void;
}

export const RapidDeploymentPlannerModal: React.FC<RapidDeploymentPlannerModalProps> = ({
  isOpen,
  onClose,
  candidateCoords,
  onPickCoordsOnMap,
  onFocusDistrict,
}) => {
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('yadgir');
  const [targetTaluk, setTargetTaluk] = useState<string>('Shorapur Rural Outreach Belt');
  const [plannedCapacity, setPlannedCapacity] = useState<number>(300);
  const [requestedDoctors, setRequestedDoctors] = useState<number>(4);
  const [requestedMMUs, setRequestedMMUs] = useState<number>(2);
  const [reason, setReason] = useState<string>(
    'Rapid intervention responding to elevated cardiometabolic screening positivity and acute medicine shortages'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);

  if (!isOpen) return null;

  const district = KARNATAKA_DISTRICTS_DATA.find((d) => d.districtId === selectedDistrictId) || KARNATAKA_DISTRICTS_DATA[0];

  // Coords default to picked coords or district headquarters
  const lat = candidateCoords ? candidateCoords[0] : district.latitude;
  const lng = candidateCoords ? candidateCoords[1] : district.longitude;

  const estimatedMedicineKits = Math.ceil(plannedCapacity / 50);
  const estimatedDiagnosticKits = plannedCapacity * 2;
  const estimatedNurses = requestedDoctors * 2;
  const estimatedTransitMins = Math.round(district.distanceToTertiaryKm * 1.6);

  const handleSavePlan = async () => {
    try {
      setSubmitting(true);
      const payload = {
        targetDistrictId: selectedDistrictId,
        candidateLatitude: lat,
        candidateLongitude: lng,
        targetTaluk,
        reasonForDeployment: reason,
        plannedCapacity,
        requestedDoctors,
        requestedMMUUnits: requestedMMUs,
      };

      const res = await apiClient.post('/geo-observatory/deployment/plan', payload);
      toast.success('Rapid Healthcare Deployment Plan created and staged for CMO signoff.');
      if (res.data?.data) {
        setGeneratedPlan(res.data.data);
      }
    } catch {
      toast.error('Failed to submit deployment plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-emerald-950/50 text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Rapid Healthcare Deployment Planner
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Module 7 • Surge Logistics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Staged emergency health camp and MMU dispatch planner for localized public health events
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Protection Banner */}
        <div className="px-6 py-2 bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Database Protection:</strong> Staged plans are saved separately and will NOT alter active camps or inventory until formal human sign-off by the Chief Medical Officer.
          </span>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {generatedPlan ? (
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono text-emerald-400">{generatedPlan.planId}</span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Deployment Plan Staged for CMO Approval
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                  Targeted relief scheduled for {generatedPlan.districtName} ({generatedPlan.targetTaluk}) with {generatedPlan.plannedCapacity} capacity.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs max-w-lg mx-auto space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Referral Center:</span>
                  <span className="font-bold text-white">{generatedPlan.nearestTertiaryCenter} ({generatedPlan.distanceToTertiaryKm}km)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Ambulance Transit:</span>
                  <span className="font-bold text-cyan-300">{generatedPlan.routingSummary?.estimatedTransitMinutes} mins via OSRM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Allocated Staff:</span>
                  <span className="font-bold text-white">{generatedPlan.resourceRequisitions?.doctorsAllocated} Doctors • {generatedPlan.resourceRequisitions?.nursesAllocated} Nurses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mobile Units Dispatched:</span>
                  <span className="font-bold text-emerald-400">{generatedPlan.resourceRequisitions?.mmuUnitsAssigned} MMUs</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onFocusDistrict(generatedPlan.districtName);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Compass className="w-4 h-4" /> Focus 3D on Deployment Site
                </button>
                <button
                  onClick={() => setGeneratedPlan(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Create Another Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Geographic Parameters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Karnataka District
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {KARNATAKA_DISTRICTS_DATA.map((d) => (
                      <option key={d.districtId} value={d.districtId}>
                        {d.name} ({d.division} Division)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Specific Taluk / Settlement Sector
                  </label>
                  <input
                    type="text"
                    value={targetTaluk}
                    onChange={(e) => setTargetTaluk(e.target.value)}
                    placeholder="e.g. Shorapur Rural Belt"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Geographic Coordinates [Lat, Lng]
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onPickCoordsOnMap();
                        onClose();
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" /> Pick on 3D Map
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      value={lat}
                      readOnly
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={lng}
                      readOnly
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deployment Rationale & Clinical Trigger
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Resource Requirements Calculator */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Resource Requirements Estimation
                </h4>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Planned Patient Capacity</span>
                    <strong className="text-emerald-400">{plannedCapacity} Patients</strong>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={plannedCapacity}
                    onChange={(e) => setPlannedCapacity(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Doctors Allocated</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={requestedDoctors}
                      onChange={(e) => setRequestedDoctors(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">MMU Vehicles Assigned</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={requestedMMUs}
                      onChange={(e) => setRequestedMMUs(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-200">Automatically Computed Requisitions:</div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Nursing Staff:</span>
                    <span className="font-bold text-white">{estimatedNurses} Registered Nurses</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Essential Medicine Kits:</span>
                    <span className="font-bold text-white">{estimatedMedicineKits} Multi-Box Dispensaries</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>POC Diagnostic Kits:</span>
                    <span className="font-bold text-white">{estimatedDiagnosticKits} HbA1c & Glucose Strips</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Tertiary Referral Campus:</span>
                    <span className="font-bold text-cyan-300">{district.nearestTertiaryCollege} ({district.distanceToTertiaryKm}km)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>OSRM Transit Estimation:</span>
                    <span className="font-bold text-emerald-300">~{estimatedTransitMins} mins road dispatch</span>
                  </div>
                </div>

                <button
                  onClick={handleSavePlan}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{submitting ? 'Generating Plan...' : 'Stage Deployment Plan for Sign-Off'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Routing Engine: Open Source Routing Machine (OSRM) • NHM Health Infrastructure Standards</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Planner
          </button>
        </div>
      </div>
    </div>
  );
};

export default RapidDeploymentPlannerModal;

