// frontend/src/components/maps/DataSourcesRegistryModal.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 12: DATA SOURCES & DATA QUALITY REGISTRY
 * Centralized catalog of data providers, sync frequency, reliability limitations & classifications
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  ExternalLink,
  RefreshCw,
  Info,
  Server,
  Layers,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export interface DataSourceItem {
  id: string;
  name: string;
  provider: string;
  coverage: string;
  updateFrequency: string;
  lastSync: string;
  dataPeriod: string;
  reliabilityRating: string;
  classification: 'Live Database Records' | 'Imported Benchmark' | 'Analytical Computation' | 'Synthetic Demo';
  description: string;
}

interface DataSourcesRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSourcesRegistryModal: React.FC<DataSourcesRegistryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/geo-observatory/data-sources');
      if (res.data?.data) {
        setSources(res.data.data);
      }
    } catch {
      toast.error('Failed to load data quality registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSources();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Centralized Data Sources & Quality Registry
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Module 12 • Data Governance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited catalog of health datasets, provider authorities, refresh frequencies, and reliability ratings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSources}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh catalog"
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

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {sources.map((item) => {
            const isLive = item.classification === 'Live Database Records';
            const isAnalysis = item.classification === 'Analytical Computation';
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 font-bold">{item.id}</span>
                      <h4 className="font-bold text-white text-sm">{item.name}</h4>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Provider Authority: <strong className="text-slate-200">{item.provider}</strong>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isLive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : isAnalysis
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    {item.classification}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Coverage</span>
                    <span className="font-semibold text-slate-300">{item.coverage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Update Cadence</span>
                    <span className="font-semibold text-slate-300">{item.updateFrequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Data Period</span>
                    <span className="font-semibold text-slate-300">{item.dataPeriod}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reliability</span>
                    <span className="font-semibold text-emerald-400">{item.reliabilityRating}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Standards Compliance: Ministry of Health & Family Welfare Data Management Guidelines</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesRegistryModal;

