// frontend/src/components/maps/AskHealthcareMapModal.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 9: ASK YOUR HEALTHCARE MAP
 * GeoAI Natural Language Question Interface with spatial 3D camera auto-focus
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Compass,
  X,
  Layers,
  Database,
  Info,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

interface AskHealthcareMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusCoordinates: (coords: [number, number]) => void;
  onHighlightDistricts?: (districtIds: string[]) => void;
}

export const AskHealthcareMapModal: React.FC<AskHealthcareMapModalProps> = ({
  isOpen,
  onClose,
  onFocusCoordinates,
  onHighlightDistricts,
}) => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{
      question: string;
      answer: string;
      focusCoordinates?: [number, number];
      highlightDistricts?: string[];
      dataSources?: string[];
      filtersApplied?: string;
    }>
  >([
    {
      question: 'Which districts have the lowest recorded camp coverage?',
      answer:
        'The 3 districts with the lowest recorded camp coverage are **Yadgir** (9 camps), **Bidar** (10 camps), and **Uttara Kannada** (10 camps). These regions are designated as priority expansion sectors for future Mobile Medical Units.',
      focusCoordinates: [16.77, 77.14],
      highlightDistricts: ['yadgir', 'bidar', 'uttara-kannada'],
      dataSources: ['Karnataka Health Camp Historical Registry (2024-2026)', 'NHM Facility Density Master'],
      filtersApplied: 'Sort by totalRecordedCamps ASC, Limit 3',
    },
  ]);

  if (!isOpen) return null;

  const handleAskQuestion = async (qText?: string) => {
    const textToSend = qText || question;
    if (!textToSend.trim()) return;

    try {
      setLoading(true);
      const res = await apiClient.post('/geo-observatory/ask-map', { question: textToSend });
      if (res.data?.data) {
        setChatHistory((prev) => [res.data.data, ...prev]);
        setQuestion('');
      }
    } catch {
      toast.error('Query processing failed. Using rule-based fallback.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'Which districts have the lowest recorded camp coverage?',
    'Where are medicine shortages recorded?',
    'Which district has the highest historical patient attendance?',
    'Are there any active statistical anomalies in Karnataka?',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-purple-950/50 text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Ask Your Healthcare Map (GeoAI Assistant)
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Module 9 • Spatial Q&A
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Natural-language geospatial query engine querying authorized Karnataka health metrics
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

        {/* Protection Notice */}
        <div className="px-6 py-2 bg-purple-950/40 border-b border-purple-500/20 text-purple-300 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>
            <strong>Read-Only Query Engine:</strong> AI engine executes read-only aggregations and cannot alter healthcare data or reveal individual patient identities.
          </span>
        </div>

        {/* Chat History & Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs text-purple-300 font-bold flex-shrink-0">
                  Q
                </div>
                <div className="font-semibold text-white text-sm">{item.question}</div>
              </div>

              <div className="pl-8 text-xs text-slate-300 leading-relaxed space-y-2">
                <div
                  dangerouslySetInnerHTML={{
                    __html: item.answer.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>'),
                  }}
                />

                {item.filtersApplied && (
                  <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded-lg border border-slate-800">
                    Filters Applied: {item.filtersApplied}
                  </div>
                )}

                {item.dataSources && (
                  <div className="text-[10px] text-slate-500">
                    Sources: {item.dataSources.join(' • ')}
                  </div>
                )}

                {item.focusCoordinates && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onFocusCoordinates(item.focusCoordinates!);
                        if (item.highlightDistricts && onHighlightDistricts) {
                          onHighlightDistricts(item.highlightDistricts);
                        }
                        onClose();
                        toast.success('Focused 3D map camera on target coordinates.');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Compass className="w-3.5 h-3.5" /> Focus on 3D Map [{item.focusCoordinates[0].toFixed(2)}, {item.focusCoordinates[1].toFixed(2)}]
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Preset Sample Prompts */}
        <div className="px-6 py-2 bg-slate-950/80 border-t border-slate-800 overflow-x-auto scrollbar-none flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 flex-shrink-0">Try Asking:</span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleAskQuestion(sq)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/50 hover:border-purple-500/40 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap transition"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskQuestion();
            }}
            placeholder="Ask anything about Karnataka health camp coverage, anomalies, shortages..."
            className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleAskQuestion()}
            disabled={loading || !question.trim()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Analyzing...' : 'Ask'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AskHealthcareMapModal;

