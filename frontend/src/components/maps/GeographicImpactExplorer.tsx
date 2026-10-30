// frontend/src/components/maps/GeographicImpactExplorer.tsx
import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  Users,
  Activity,
  Award,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { KARNATAKA_DISTRICTS_DATA, DistrictDemographics } from './karnatakaDistrictsData';
import toast from 'react-hot-toast';

interface GeographicImpactExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  camps?: Array<{
    id: string;
    name: string;
    locationName?: string;
    latitude: number;
    longitude: number;
    status: string;
    registeredPatients?: number;
    maxCapacity?: number;
  }>;
  onFocusDistrict?: (district: DistrictDemographics) => void;
}

export const GeographicImpactExplorer: React.FC<GeographicImpactExplorerProps> = ({
  isOpen,
  onClose,
  camps = [],
  onFocusDistrict,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'attendance' | 'camps' | 'accessIndex' | 'doctorRatio'>('attendance');

  // Compute aggregate totals
  const aggregateMetrics = useMemo(() => {
    const totalHistoricalAttendance = KARNATAKA_DISTRICTS_DATA.reduce(
      (sum, d) => sum + d.historicalAttendance,
      0
    );
    const totalRecordedCamps = KARNATAKA_DISTRICTS_DATA.reduce(
      (sum, d) => sum + d.totalRecordedCamps,
      0
    );
    const liveCampRegistrations = camps.reduce(
      (sum, c) => sum + (c.registeredPatients || 0),
      0
    );
    const totalActiveCamps = camps.filter((c) => c.status === 'ACTIVE' || c.status === 'UPCOMING').length;

    // Estimated vulnerable populations reached (screened high-risk)
    const estimatedHighRiskReferrals = Math.round((totalHistoricalAttendance + liveCampRegistrations) * 0.142);
    const avgAccessibilityIndex = Math.round(
      KARNATAKA_DISTRICTS_DATA.reduce((sum, d) => sum + d.healthcareAccessibilityIndex, 0) /
        KARNATAKA_DISTRICTS_DATA.length
    );

    return {
      totalPatientsScreened: totalHistoricalAttendance + liveCampRegistrations,
      totalCampsConducted: totalRecordedCamps + totalActiveCamps,
      estimatedHighRiskReferrals,
      avgAccessibilityIndex,
    };
  }, [camps]);

  // Filtered and sorted districts
  const filteredDistricts = useMemo(() => {
    return KARNATAKA_DISTRICTS_DATA.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.headquarters.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = selectedDivision === 'ALL' || d.division === selectedDivision;
      return matchesSearch && matchesDivision;
    }).sort((a, b) => {
      if (sortBy === 'attendance') return b.historicalAttendance - a.historicalAttendance;
      if (sortBy === 'camps') return b.totalRecordedCamps - a.totalRecordedCamps;
      if (sortBy === 'accessIndex') return b.healthcareAccessibilityIndex - a.healthcareAccessibilityIndex;
      if (sortBy === 'doctorRatio') return b.doctorRatioPer1000 - a.doctorRatioPer1000;
      return 0;
    });
  }, [searchTerm, selectedDivision, sortBy]);

  if (!isOpen) return null;

  // Export functions
  const handleExportCSV = () => {
    const headers = [
      'District',
      'Division',
      'Headquarters',
      'Population (2024)',
      'Total Recorded Camps',
      'Historical Attendance',
      'Doctor Ratio per 1000',
      'Accessibility Index (0-100)',
      'Underserved Status',
      'Nearest Tertiary Center',
    ];

    const rows = filteredDistricts.map((d) => [
      `"${d.name}"`,
      `"${d.division}"`,
      `"${d.headquarters}"`,
      d.population2024,
      d.totalRecordedCamps,
      d.historicalAttendance,
      d.doctorRatioPer1000,
      d.healthcareAccessibilityIndex,
      d.underservedStatus ? 'YES' : 'NO',
      `"${d.nearestTertiaryCollege}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `karnataka_healthcare_impact_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Healthcare Impact CSV Exported successfully');
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            state: 'Karnataka',
            aggregates: aggregateMetrics,
            districts: filteredDistricts,
          },
          null,
          2
        )
      );
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `karnataka_healthcare_impact_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    toast.success('Intelligence JSON Metrics Exported');
  };

  const handlePrintBrief = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/50 text-white overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Geographic Impact & District Intelligence Explorer
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Module 7 • State Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited clinical attendance, public health reach, and tertiary accessibility across Karnataka
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              title="Download CSV Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              CSV Export
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              title="Export Raw JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              JSON
            </button>
            <button
              onClick={handlePrintBrief}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition hidden sm:flex"
              title="Print Executive Summary"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4 bg-slate-950/50 border-b border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Patients Screened</div>
              <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                {aggregateMetrics.totalPatientsScreened.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Camps Deployed</div>
              <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                {aggregateMetrics.totalCampsConducted}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">High-Risk Referrals</div>
              <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                {aggregateMetrics.estimatedHighRiskReferrals.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">State Access Index</div>
              <div className="text-base sm:text-lg font-bold text-emerald-400 tracking-tight">
                {aggregateMetrics.avgAccessibilityIndex} / 100
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search district or headquarters..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Divisions</option>
              <option value="Bengaluru">Bengaluru Division</option>
              <option value="Mysuru">Mysuru Division</option>
              <option value="Belagavi">Belagavi Division</option>
              <option value="Kalaburagi">Kalaburagi Division</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sort:
            </span>
            <button
              onClick={() => setSortBy('attendance')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                sortBy === 'attendance'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setSortBy('camps')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                sortBy === 'camps'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Camps
            </button>
            <button
              onClick={() => setSortBy('accessIndex')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                sortBy === 'accessIndex'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Accessibility
            </button>
            <button
              onClick={() => setSortBy('doctorRatio')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                sortBy === 'doctorRatio'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Doctor Ratio
            </button>
          </div>
        </div>

        {/* District Intelligence Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredDistricts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No Karnataka districts matching the filter criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredDistricts.map((district, idx) => {
                const isUnderServed = district.underservedStatus;
                return (
                  <div
                    key={district.districtId}
                    className="py-3 px-3 rounded-xl hover:bg-slate-800/50 transition flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition truncate">
                            {district.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {district.division}
                          </span>
                          {isUnderServed ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-semibold">
                              Underserved
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Adequate
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span>
                            HQ: <span className="text-slate-300">{district.headquarters}</span>
                          </span>
                          <span>
                            Population: <span className="text-slate-300">{(district.population2024 / 100000).toFixed(1)}L</span>
                          </span>
                          <span>
                            Tertiary: <span className="text-slate-300">{district.nearestTertiaryCollege} ({district.distanceToTertiaryKm}km)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/60">
                      <div className="text-left md:text-right">
                        <div className="text-xs font-bold text-white">
                          {district.historicalAttendance.toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-slate-400">screened</span>
                        </div>
                        <div className="text-[11px] text-cyan-400 font-medium">
                          {district.totalRecordedCamps} camps conducted
                        </div>
                      </div>

                      <div className="text-left md:text-right min-w-[90px]">
                        <div className="text-xs font-bold text-slate-200">
                          {district.doctorRatioPer1000} / 1k doc
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                district.healthcareAccessibilityIndex >= 80
                                  ? 'bg-emerald-400'
                                  : district.healthcareAccessibilityIndex >= 60
                                  ? 'bg-cyan-400'
                                  : 'bg-rose-400'
                              }`}
                              style={{ width: `${district.healthcareAccessibilityIndex}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">
                            {district.healthcareAccessibilityIndex}
                          </span>
                        </div>
                      </div>

                      {onFocusDistrict && (
                        <button
                          onClick={() => {
                            onFocusDistrict(district);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-medium flex items-center gap-1 transition"
                        >
                          Focus 3D <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Source: Karnataka Health System Demographics Dataset & National Health Mission registry</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeographicImpactExplorer;

