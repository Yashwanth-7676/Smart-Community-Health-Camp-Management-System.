// frontend/src/components/maps/EnvironmentalIntelligenceOverlay.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 3: ENVIRONMENTAL INTELLIGENCE
 * Multi-layer weather, air quality, rainfall & vector-borne disease risk monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  X,
  Compass,
  RefreshCw,
  Info,
  ShieldCheck,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export interface EnvironmentalDistrictItem {
  districtId: string;
  districtName: string;
  temperatureCelsius: number;
  rainfallMm: number;
  relativeHumidityPercent: number;
  airQualityIndex: number;
  aqiCategory: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Poor' | 'Hazardous';
  floodRiskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  vectorBorneRisk: 'LOW' | 'ELEVATED' | 'HIGH';
  weatherAlert?: string;
  dataSource: string;
  lastUpdated: string;
}

interface EnvironmentalIntelligenceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusDistrict: (districtName: string) => void;
}

export const EnvironmentalIntelligenceOverlay: React.FC<EnvironmentalIntelligenceOverlayProps> = ({
  isOpen,
  onClose,
  onFocusDistrict,
}) => {
  const [envData, setEnvData] = useState<EnvironmentalDistrictItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeParameter, setActiveParameter] = useState<'RAINFALL' | 'TEMP' | 'AQI' | 'VECTOR_RISK'>('RAINFALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchEnvironmental = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/geo-observatory/environmental');
      if (res.data?.data) {
        setEnvData(res.data.data);
      }
    } catch {
      toast.error('Failed to retrieve environmental parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEnvironmental();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = envData.filter((d) =>
    d.districtName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-sky-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-sky-950/50 text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <CloudRain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Environmental Intelligence & Meteorological Surveillance
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Module 3 • Eco-Surveillance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Correlating precipitation, air quality, humidity, and vector-borne risk with healthcare camp planning
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEnvironmental}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh environmental layers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Environmental Parameter Selector Tabs */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-2">Layer View:</span>
            <button
              onClick={() => setActiveParameter('RAINFALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
                activeParameter === 'RAINFALL'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" /> 24h Rainfall (mm)
            </button>

            <button
              onClick={() => setActiveParameter('AQI')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
                activeParameter === 'AQI'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Wind className="w-3.5 h-3.5" /> Air Quality (AQI)
            </button>

            <button
              onClick={() => setActiveParameter('VECTOR_RISK')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
                activeParameter === 'VECTOR_RISK'
                  ? 'bg-rose-500 text-slate-950 shadow-md'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Vector Outbreak Risk
            </button>

            <button
              onClick={() => setActiveParameter('TEMP')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
                activeParameter === 'TEMP'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" /> Temperature (°C)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search district..."
              className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* District Environmental Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No district environmental parameters available for this query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filtered.map((item) => {
                const isHighVector = item.vectorBorneRisk === 'HIGH';
                const isModerateAQI = item.airQualityIndex > 100;
                return (
                  <div
                    key={item.districtId}
                    className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-sky-500/40 transition flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-sm group-hover:text-sky-300 transition">
                            {item.districtName}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Updated: {new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {item.weatherAlert && (
                          <span
                            className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            title={item.weatherAlert}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Primary Displayed Metric based on active tab */}
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        {activeParameter === 'RAINFALL' && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                              <CloudRain className="w-3.5 h-3.5 text-sky-400" /> 24h Precipitation:
                            </span>
                            <span className="text-base font-bold text-sky-300">
                              {item.rainfallMm} mm
                            </span>
                          </div>
                        )}

                        {activeParameter === 'AQI' && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                              <Wind className="w-3.5 h-3.5 text-amber-400" /> Air Quality Index:
                            </span>
                            <span className={`text-base font-bold ${isModerateAQI ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {item.airQualityIndex} ({item.aqiCategory})
                            </span>
                          </div>
                        )}

                        {activeParameter === 'VECTOR_RISK' && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Dengue/Malaria Risk:
                            </span>
                            <span
                              className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${
                                isHighVector
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {item.vectorBorneRisk}
                            </span>
                          </div>
                        )}

                        {activeParameter === 'TEMP' && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                              <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Surface Temp:
                            </span>
                            <span className="text-base font-bold text-cyan-300">
                              {item.temperatureCelsius}°C ({item.relativeHumidityPercent}% RH)
                            </span>
                          </div>
                        )}
                      </div>

                      {item.weatherAlert && (
                        <div className="text-[11px] text-amber-300/90 mt-2 bg-amber-950/30 p-2 rounded-lg border border-amber-500/30">
                          {item.weatherAlert}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 truncate max-w-[170px]" title={item.dataSource}>
                        Source: CPCB / IMD Karnataka
                      </span>

                      <button
                        onClick={() => {
                          onFocusDistrict(item.districtName);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-medium flex items-center gap-1 transition"
                      >
                        <Compass className="w-3 h-3" /> Focus 3D
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Official Gateways: Central Pollution Control Board (CPCB) & IMD Meteorological Regional Nodes</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Environmental View
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalIntelligenceOverlay;
