// src/pages/doctor/DoctorReports.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { FileText, Printer, Calendar, User, Stethoscope } from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/helpers';

export const DoctorReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/doctors/reports');
      setReports(res.data?.data || []);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          Medical Documentation
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Authored Medical Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review, verify, and print clinical diagnosis and prescriptions issued to camp patients.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader.CardSkeleton />
          <SkeletonLoader.CardSkeleton />
        </div>
      ) : reports.length === 0 ? (
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
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {report.diagnosis}
                        </h4>
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
                      Issued on: {formatDate(report.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedReport(report)}
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
          title="Official Medical Report"
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
                <p><strong>Diagnosis:</strong> {selectedReport.diagnosis}</p>
              </div>
              <div>
                <p><strong>Date:</strong> {formatDate(selectedReport.createdAt)}</p>
                <p><strong>Referral:</strong> {selectedReport.referral || 'None'}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Prescription:</h4>
              <p className="whitespace-pre-wrap p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedReport.prescription || 'General health advice provided.'}
              </p>
            </div>

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

