// frontend/src/pages/SharedHealthCardPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Clock, Lock, CheckCircle, FileText, Activity } from 'lucide-react';
import api from '@/api/client';

export const SharedHealthCardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No temporary health pass token provided.');
      setLoading(false);
      return;
    }

    const fetchSharedCard = async () => {
      try {
        const res = await api.get(`/health-id/shared/${token}`);
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Access denied or pass has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedCard();
  }, [token]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-white animate-fade-in">
      <div className="bg-navy-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-500/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-bold">
              ⚕️
            </div>
            <div>
              <div className="text-xs font-mono text-primary-400 uppercase tracking-wider">
                TEMPORARY CLINICAL ACCESS PASS
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Patient Authorized Health Record
              </h1>
            </div>
          </div>

          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DPDP Verified</span>
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Verifying ephemeral access token credentials...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-red-300">Access Denied or Expired</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
            <div className="pt-4">
              <Link
                to="/"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-300 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {/* Patient & Pass Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Patient Name:</span>
                <span className="text-base font-bold text-white">{data.patientName}</span>
                <span className="text-slate-400 block mt-1 font-mono text-[11px]">
                  SHID: {data.shid}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Pass Purpose:</span>
                <span className="font-semibold text-slate-200">{data.purpose}</span>
                <span className="text-amber-400 block mt-1 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Expires: {new Date(data.passExpiresAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Vitals Section */}
            {data.vitals && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-400" />
                  <span>Authorized Vital Signs</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">BLOOD PRESSURE</span>
                    <span className="text-base font-mono font-bold text-white mt-1 block">
                      {data.vitals.bloodPressure}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">PULSE RATE</span>
                    <span className="text-base font-mono font-bold text-emerald-400 mt-1 block">
                      {data.vitals.heartRate}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">BLOOD GLUCOSE</span>
                    <span className="text-base font-mono font-bold text-amber-400 mt-1 block">
                      {data.vitals.bloodSugar}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">BODY MASS INDEX</span>
                    <span className="text-base font-mono font-bold text-cyan-400 mt-1 block">
                      {data.vitals.bmi}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Allergies Section */}
            {data.allergies && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white">Known Allergies</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {data.allergies.map((allergy: string) => (
                    <span
                      key={allergy}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-medium"
                    >
                      ⚠️ {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Reports Section */}
            {data.reports && data.reports.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Authorized Consultation Records</span>
                </h3>
                <div className="space-y-3">
                  {data.reports.map((rep: any) => (
                    <div
                      key={rep.id}
                      className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-semibold text-white">Diagnosis: {rep.diagnosis}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rep.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {rep.observations && (
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Observations: {rep.observations}
                        </p>
                      )}
                      {rep.prescription && (
                        <div className="p-2 bg-slate-900/60 rounded-lg text-emerald-300 font-mono text-[11px]">
                          Prescription: {rep.prescription}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          Access to this page has been audited and logged with IP timestamp verification under Indian Digital Personal Data Protection (DPDP) standards.
        </div>
      </div>
    </div>
  );
};

export default SharedHealthCardPage;
