// frontend/src/components/maps/MultiRegionComparisonModal.tsx
import React, { useState } from 'react';
import {
  X,
  Scale,
  Building2,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';
import { KARNATAKA_DISTRICTS_DATA, DistrictDemographics } from './karnatakaDistrictsData';

interface MultiRegionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusDistrict?: (district: DistrictDemographics) => void;
}

export const MultiRegionComparisonModal: React.FC<MultiRegionComparisonModalProps> = ({
  isOpen,
  onClose,
  onFocusDistrict,
}) => {
  // Default with two contrasting districts: Bengaluru Urban (metro core) and Yadgir or Raichur (aspirational rural)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'bengaluru-urban',
    'yadgir',
    'kalaburagi',
  ]);

  if (!isOpen) return null;

  const selectedDistricts = selectedIds
    .map((id) => KARNATAKA_DISTRICTS_DATA.find((d) => d.districtId === id))
    .filter((d): d is DistrictDemographics => !!d);

  const availableDistricts = KARNATAKA_DISTRICTS_DATA.filter(
    (d) => !selectedIds.includes(d.districtId)
  );

  const handleAddDistrict = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRemoveDistrict = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-teal-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-teal-950/50 text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Multi-Region Healthcare Comparison Matrix
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  Module 8 • Geospatial Disparity
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comparative analysis of clinical accessibility, doctor coverage, and tertiary referral distance across Karnataka districts
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

        {/* Selection Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-teal-400">Comparing ({selectedDistricts.length}/4 Districts):</span>
            <span className="text-slate-400">Select regions to examine disparity indices.</span>
          </div>
          {selectedIds.length < 4 && (
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-400" />
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddDistrict(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="" disabled>
                  + Add District to Matrix...
                </option>
                {availableDistricts.map((d) => (
                  <option key={d.districtId} value={d.districtId}>
                    {d.name} ({d.division} Div)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Matrix Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <div className="min-w-[700px] grid grid-cols-1 divide-y divide-slate-800">
            {/* Column Headers for each selected district */}
            <div
              className="grid gap-4 pb-4 items-end"
              style={{
                gridTemplateColumns: `220px repeat(${selectedDistricts.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Metric / Indicator
              </div>
              {selectedDistricts.map((district) => (
                <div
                  key={district.districtId}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {district.division}
                    </span>
                    {selectedDistricts.length > 1 && (
                      <button
                        onClick={() => handleRemoveDistrict(district.districtId)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="Remove from matrix"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">{district.name}</h3>
                  <div className="text-xs text-slate-400">HQ: {district.headquarters}</div>

                  {onFocusDistrict && (
                    <button
                      onClick={() => {
                        onFocusDistrict(district);
                        onClose();
                      }}
                      className="mt-3 w-full py-1 px-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Compass className="w-3.5 h-3.5" /> Fly to District 3D
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Row 1: Population & Density */}
            <div
              className="grid gap-4 py-3 items-center text-xs"
              style={{
                gridTemplateColumns: `220px repeat(${selectedDistricts.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Population & Density</span>
              </div>
              {selectedDistricts.map((d) => (
                <div key={d.districtId} className="space-y-0.5">
                  <div className="font-bold text-white text-sm">
                    {(d.population2024 / 100000).toFixed(1)} Lakhs
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {d.populationDensityPerSqKm} persons/km²
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: Healthcare Accessibility Index */}
            <div
              className="grid gap-4 py-3 items-center text-xs"
              style={{
                gridTemplateColumns: `220px repeat(${selectedDistricts.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Accessibility Index (0-100)</span>
              </div>
              {selectedDistricts.map((d) => {
                const score = d.healthcareAccessibilityIndex;
                const color =
                  score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';
                return (
                  <div key={d.districtId} className="space-y-1">
                    <div className={`font-bold text-base ${color}`}>{score} / 100</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          score >= 80
                            ? 'bg-emerald-400'
                            : score >= 60
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row 3: Doctor Ratio */}
            <div
              className="grid gap-4 py-3 items-center text-xs"
              style={{
                gridTemplateColumns: `220px repeat(${selectedDistricts.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <Users className="w-4 h-4 text-purple-400" />
                <div>
                  <div>Doctor Ratio per 1,000</div>
                  <div className="text-[10px] text-slate-500 font-normal">State avg: 1.05</div>
                </div>
              </div>
              {selectedDistricts.map((d) => {
                const ratio = d.doctorRatioPer1000;
                const isUnderStateAvg = ratio < 1.05;
                return (
                  <div key={d.districtId} className="space-y-0.5">
                    <div className="font-bold text-white text-sm">{ratio} doctors</div>
                    <div
                      className={`text-[10px] font-semibold ${
                        isUnderStateAvg ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isUnderStateAvg ? 'Below State Benchmark' : 'Above Benchmark'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row 4: Outreach & Camps Conducted */}
            <div
              className="grid gap-4 py-3 items-center text-xs"
              style={{
                gridTemplateColumns: `220px repeat(${selectedDistricts.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Historical Camp Outreach</span>
              </div>
              {selectedDistricts.map((d) => (
                <div key={d.districtId} className="space-y-0.5">
                  <div className="font-bold text-teal-400 text-sm">
                    {d.totalRecordedCamps} Camps Conducted
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {d.historicalAttendance.toLocaleString()} screenings
                  </div>
                </div>
              ))}
            </div>

            {/* Row 5: Nearest Tertiary Center */}
            <div
              className="grid gap-4 py-3 items-center text-xs"
              style={{
                gridTemplateColumns: `220px repeat(${selectedDistricts.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <div>
                  <div>Nearest Tertiary Referral</div>
                  <div className="text-[10px] text-slate-500 font-normal">Medical College / Super-Specialty</div>
                </div>
              </div>
              {selectedDistricts.map((d) => (
                <div key={d.districtId} className="space-y-0.5">
                  <div className="font-bold text-white text-xs">{d.nearestTertiaryCollege}</div>
                  <div className="text-[11px] text-amber-300 font-semibold">
                    {d.distanceToTertiaryKm} km away
                  </div>
                </div>
              ))}
            </div>

            {/* Row 6: Primary Health Infrastructure */}
            <div
              className="grid gap-4 py-3 items-center text-xs"
              style={{
                gridTemplateColumns: `220px repeat(${selectedDistricts.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Public Facilities (PHC / CHC)</span>
              </div>
              {selectedDistricts.map((d) => (
                <div key={d.districtId} className="text-slate-300 text-xs space-y-0.5">
                  <div>
                    <span className="font-bold text-white">{d.primaryHealthPillars.primaryHealthCentres}</span> PHCs
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {d.primaryHealthPillars.communityHealthCentres} CHCs • {d.primaryHealthPillars.subCentres} Sub-Centres
                  </div>
                </div>
              ))}
            </div>

            {/* Row 7: Vulnerability & Status */}
            <div
              className="grid gap-4 py-3 items-center text-xs"
              style={{
                gridTemplateColumns: `220px repeat(${selectedDistricts.length}, minmax(180px, 1fr))`,
              }}
            >
              <div className="flex items-center gap-2 font-medium text-slate-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Underserved Classification</span>
              </div>
              {selectedDistricts.map((d) => (
                <div key={d.districtId}>
                  {d.underservedStatus ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                      <AlertTriangle className="w-3 h-3 text-rose-400" /> High Deficit Area
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Adequate Core Services
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Comparative benchmark based on NHM Karnataka District Profiles</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiRegionComparisonModal;

