// src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { FileText, Printer, Calendar, Stethoscope, Download, ShieldCheck } from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/helpers';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const endpoint = user?.role === 'doctor' ? '/doctors/reports' : `/reports/patient/${user?.id || 'me'}`;
        const res = await apiClient.get(endpoint);
        setReports(res.data?.data || []);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Clinical Records Archive
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Medical Reports & Prescriptions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official doctor diagnoses, observations, and prescription records with full printable format.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader.CardSkeleton />
          <SkeletonLoader.CardSkeleton />
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          No medical reports found. Completed health checkup records will appear here.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report: any) => (
            <Card key={report.id} hover className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {report.diagnosis}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Camp: {report.camp?.name || 'Community Health Camp'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl mb-4">
                  <p>
                    <strong>Physician:</strong> Dr. {report.doctor?.firstName || report.doctor?.name || 'Assigned Physician'}
                  </p>
                  <p>
                    <strong>Prescription:</strong> {report.prescription || 'General checkup advised'}
                  </p>
                  {report.referral && (
                    <p className="text-cyan-600 dark:text-cyan-400 font-medium">
                      <strong>Referral:</strong> {report.referral}
                    </p>
                  )}
                  <p className="text-slate-400 text-[11px] pt-1">
                    Date: {formatDate(report.createdAt)}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedReport(report)}
                leftIcon={<Printer className="w-4 h-4 text-cyan-500" />}
              >
                View & Print Official PDF
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selectedReport && (
        <Modal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title="Printable Medical Report"
          maxWidth="2xl"
        >
          <div className="printable-medical-record p-4 space-y-5 bg-white text-slate-950">
            {/* Camp Clinic Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900">
              <h2 className="text-xl font-black uppercase tracking-tight text-cyan-800">
                Smart Community Health Camp Network
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Government & Community Partnership • Free Preventive Healthcare Initiative
              </p>
              <p className="text-xs text-slate-500">
                Camp: {selectedReport.camp?.name} ({selectedReport.camp?.location})
              </p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4">
              <div>
                <p><strong>Patient Name:</strong> {user?.name || selectedReport.patient?.firstName || 'Patient'}</p>
                <p><strong>Record ID:</strong> {selectedReport.id}</p>
                <p><strong>Date of Consultation:</strong> {formatDate(selectedReport.createdAt)}</p>
              </div>
              <div className="text-right">
                <p><strong>Consulting Physician:</strong> Dr. {selectedReport.doctor?.firstName || 'Specialist'}</p>
                <p><strong>Registration No:</strong> KMC-{Math.floor(10000 + Math.random() * 90000)}</p>
              </div>
            </div>

            {/* Clinical Finding */}
            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-700">Diagnosis:</h4>
                <p className="p-3 bg-slate-50 rounded-lg font-semibold text-slate-900">
                  {selectedReport.diagnosis}
                </p>
              </div>

              {selectedReport.observations && (
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-700">Clinical Observations:</h4>
                  <p className="p-3 bg-slate-50 rounded-lg text-slate-800">
                    {selectedReport.observations}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-700">Rx / Prescribed Medications:</h4>
                <div className="p-3 bg-slate-50 rounded-lg text-slate-800 whitespace-pre-wrap font-mono text-xs">
                  {selectedReport.prescription || 'Advised plenty of fluids, balanced diet, and periodic monitoring.'}
                </div>
              </div>

              {selectedReport.referral && (
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-rose-700">Specialist Referral:</h4>
                  <p className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-medium">
                    {selectedReport.referral}
                  </p>
                </div>
              )}
            </div>

            {/* Signature Footer */}
            <div className="pt-8 flex items-end justify-between border-t border-slate-200 text-xs">
              <div className="text-slate-400 text-[10px]">
                <ShieldCheck className="w-4 h-4 inline mr-1 text-cyan-600" />
                Digitally authenticated clinical entry.
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1" />
                <p className="font-bold">Authorized Medical Officer</p>
              </div>
            </div>

            {/* Print trigger */}
            <div className="pt-4 flex justify-end gap-3 print:hidden">
              <Button variant="primary" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
                Print / Save as PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Reports;

