// src/pages/doctor/DoctorReports.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { FileText, Printer, ShieldCheck } from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

export const DoctorReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/doctors/reports');
      setReports(res.data?.data || []);
      setLoadError('');
    } catch {
      setLoadError('Clinical reports could not be loaded. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePublish = async () => {
    if (!selectedReport || !isReviewed || isPublishing) return;

    try {
      setIsPublishing(true);
      const response = await apiClient.patch(`/reports/${selectedReport.id}/publish`);
      toast.success(response.data?.message || 'Clinical record finalized');
      setSelectedReport(null);
      setIsReviewed(false);
      await fetchReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not finalize this clinical record');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          Medical Documentation
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Clinical Reports & Draft Review
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your saved drafts before finalizing records. Non-confidential finalized reports are shared with the patient.
        </p>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {loadError}
          <button type="button" className="ml-2 font-bold underline" onClick={() => void fetchReports()}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader.CardSkeleton />
          <SkeletonLoader.CardSkeleton />
        </div>
      ) : reports.length === 0 && !loadError ? (
        <Card className="p-8 text-center text-slate-500">
          You haven't authored any clinical reports yet. Checkups conducted will appear here.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report: any) => {
            const patientName = `${report.patient?.firstName || ''} ${report.patient?.lastName || ''}`.trim() || 'Patient';
            return (
              <Card key={report.id} hover className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {report.diagnosis}
                          </h4>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            report.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {report.status || 'DRAFT'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Patient: {patientName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl mb-4">
                    <p>
                      <strong>Prescription:</strong> {report.prescription || 'None prescribed'}
                    </p>
                    {report.referral && (
                      <p className="text-cyan-600 dark:text-cyan-400">
                        <strong>Referral:</strong> {report.referral}
                      </p>
                    )}
                    <p className="text-slate-400 text-[11px] pt-1">
                      Saved on: {formatDate(report.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedReport(report);
                      setIsReviewed(false);
                    }}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                  >
                    View & Print Report
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedReport && (
        <Modal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.status === 'PUBLISHED' ? 'Finalized Medical Report' : 'Review Clinical Draft'}
          description="Review the patient, camp, clinical findings, and prescription before finalizing."
          maxWidth="lg"
        >
          <div className="space-y-4 print-report p-2">
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Smart Community Health Camp
              </h2>
              <p className="text-xs text-slate-500">
                Department of Preventive Medicine • Clinical Summary
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
              <div>
                <p><strong>Patient:</strong> {selectedReport.patient?.firstName} {selectedReport.patient?.lastName}</p>
                <p><strong>Camp:</strong> {selectedReport.camp?.name || 'Health camp'}</p>
                <p><strong>Diagnosis:</strong> {selectedReport.diagnosis}</p>
              </div>
              <div>
                <p><strong>Date:</strong> {formatDate(selectedReport.createdAt)}</p>
                <p><strong>Referral:</strong> {selectedReport.referral || 'None'}</p>
                <p><strong>Visibility:</strong> {selectedReport.isConfidential ? 'Confidential' : 'Patient can view after finalization'}</p>
              </div>
            </div>

            {selectedReport.observations && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">Clinical observations:</h4>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {selectedReport.observations}
                </p>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Prescription:</h4>
              <p className="whitespace-pre-wrap p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedReport.prescription || 'General health advice provided.'}
              </p>
            </div>

            {selectedReport.status !== 'PUBLISHED' && (
              <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
                  <input
                    type="checkbox"
                    checked={isReviewed}
                    onChange={(event) => setIsReviewed(event.target.checked)}
                    className="mt-0.5 rounded border-amber-400 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>I reviewed this clinical record and confirm it is ready to be finalized.</span>
                </label>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isPublishing}
                  disabled={!isReviewed || isPublishing}
                  onClick={() => void handlePublish()}
                  leftIcon={<ShieldCheck className="h-4 w-4" />}
                >
                  {selectedReport.isConfidential ? 'Finalize confidential record' : 'Finalize and share with patient'}
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 print:hidden">
              <Button size="sm" variant="outline" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                Print Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorReports;
