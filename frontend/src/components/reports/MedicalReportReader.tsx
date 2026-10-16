// frontend/src/components/reports/MedicalReportReader.tsx
import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Save,
  RefreshCw,
  FileCheck,
  ChevronRight,
  Info,
  Lock,
} from 'lucide-react';

interface ExtractedFindings {
  bloodPressure?: { systolic?: number; diastolic?: number; rawMatch?: string; confidence?: number };
  heartRate?: { value?: number; rawMatch?: string; confidence?: number };
  fastingGlucose?: { value?: number; rawMatch?: string; confidence?: number };
  hba1c?: { value?: number; rawMatch?: string; confidence?: number };
  hemoglobin?: { value?: number; rawMatch?: string; confidence?: number };
  cholesterolTotal?: { value?: number; rawMatch?: string; confidence?: number };
  serumCreatinine?: { value?: number; rawMatch?: string; confidence?: number };
  [key: string]: any;
}

interface MedicalGlossaryEntry {
  plainExplanation: string;
  typicalReferenceRange: string;
  safetyNote: string;
}

export const MedicalReportReader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Extracted response
  const [extractedData, setExtractedData] = useState<{
    fileName: string;
    extractedRawText: string;
    structuredFindings: ExtractedFindings;
    uncertainFields: string[];
    plainLanguageExplanations: Record<string, MedicalGlossaryEntry>;
  } | null>(null);

  // User confirmed / edited findings
  const [confirmedFindings, setConfirmedFindings] = useState<ExtractedFindings>({});

  // Clinician verification and consent state
  const [clinicianReviewed, setClinicianReviewed] = useState<boolean>(false);
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [linkSuccess, setLinkSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndProcessFile = async (file: File) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid format. Please upload a PDF document or PNG/JPEG image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds 5MB size limit. Please upload a smaller scan or document.');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setIsUploading(true);
    setLinkSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/reports/reader/upload', {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || 'Failed to extract text from document');
      }

      setExtractedData(resJson.data);
      setConfirmedFindings(resJson.data.structuredFindings || {});
    } catch (err: any) {
      setUploadError(err.message || 'Network error while analyzing report file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmAndLink = async () => {
    if (!consentGranted) {
      setUploadError('Explicit patient consent is required by law before saving clinical records.');
      return;
    }
    if (!clinicianReviewed) {
      setUploadError('Clinician review and verification is mandatory before saving medical findings.');
      return;
    }

    setIsLinking(true);
    setUploadError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/reports/reader/confirm-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          patientId: 'user-patient-1',
          campId: 'camp-1',
          consentGranted: true,
          clinicianReviewed: true,
          findings: confirmedFindings,
          notes: doctorNotes || 'Clinician-verified lab findings via automated document intake',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to link findings');
      }

      setLinkSuccess(true);
    } catch (err: any) {
      setUploadError(err.message || 'Error saving confirmed findings');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Strict Medical Safety Disclaimer Banner ───────────────────── */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3.5 shadow-lg">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-300">
            Clinical Safety & Regulatory Notice: Non-Diagnostic Informational Extraction
          </span>
          <p className="text-slate-300 leading-relaxed">
            This document processing pipeline provides preliminary text parsing only. It{' '}
            <strong className="text-amber-300">does not diagnose illnesses, prescribe medication, or replace medical professionals</strong>.
            Existing medical records remain unaltered until a licensed clinician conducts formal review and verifies explicit patient consent.
          </p>
        </div>
      </div>

      {/* ── Upload Area ───────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          selectedFile
            ? 'border-cyan-500/50 bg-slate-900/60'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              {selectedFile ? selectedFile.name : 'Upload Medical Report or Lab Scan'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports official PDF lab sheets, discharge summaries, or photo scans (PNG, JPG up to 5MB)
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold pt-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning document structure & extracting health tokens...</span>
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ── Extracted Findings & Split Screen Review ──────────────────── */}
      {extractedData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Structured Findings & Raw Text (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Structured Medical Findings Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Extracted Clinical Values</h3>
                </div>
                <span className="text-xs px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg">
                  User Confirmation Needed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {/* Blood Pressure */}
                <div
                  className={`p-4 rounded-xl border ${
                    extractedData.uncertainFields.includes('bloodPressure')
                      ? 'border-amber-600/60 bg-amber-950/20'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Blood Pressure (Systolic / Diastolic)</span>
                    {extractedData.uncertainFields.includes('bloodPressure') ? (
                      <span className="text-amber-400 font-bold text-[10px]">Uncertain Match</span>
                    ) : (
                      <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={confirmedFindings.bloodPressure?.systolic || ''}
                      onChange={(e) =>
                        setConfirmedFindings({
                          ...confirmedFindings,
                          bloodPressure: {
                            ...confirmedFindings.bloodPressure,
                            systolic: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm"
                      placeholder="Systolic"
                    />
                    <span className="text-slate-500 font-bold">/</span>
                    <input
                      type="number"
                      value={confirmedFindings.bloodPressure?.diastolic || ''}
                      onChange={(e) =>
                        setConfirmedFindings({
                          ...confirmedFindings,
                          bloodPressure: {
                            ...confirmedFindings.bloodPressure,
                            diastolic: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm"
                      placeholder="Diastolic"
                    />
                    <span className="text-xs text-slate-400">mmHg</span>
                  </div>
                </div>

                {/* Heart Rate / Pulse */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Heart Rate (Pulse)</span>
                    <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> High Confidence
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={confirmedFindings.heartRate?.value || ''}
                      onChange={(e) =>
                        setConfirmedFindings({
                          ...confirmedFindings,
                          heartRate: { ...confirmedFindings.heartRate, value: parseInt(e.target.value, 10) },
                        })
                      }
                      className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm"
                    />
                    <span className="text-xs text-slate-400">bpm</span>
                  </div>
                </div>

                {/* Fasting Glucose */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Fasting Blood Glucose</span>
                    <span className="text-cyan-400 text-[10px]">Glycemic Metric</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={confirmedFindings.fastingGlucose?.value || ''}
                      onChange={(e) =>
                        setConfirmedFindings({
                          ...confirmedFindings,
                          fastingGlucose: { ...confirmedFindings.fastingGlucose, value: parseFloat(e.target.value) },
                        })
                      }
                      className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm"
                    />
                    <span className="text-xs text-slate-400">mg/dL</span>
                  </div>
                </div>

                {/* HbA1c */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>HbA1c (Glycated Hb)</span>
                    <span className="text-cyan-400 text-[10px]">3-Month Average</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      step="0.1"
                      value={confirmedFindings.hba1c?.value || ''}
                      onChange={(e) =>
                        setConfirmedFindings({
                          ...confirmedFindings,
                          hba1c: { ...confirmedFindings.hba1c, value: parseFloat(e.target.value) },
                        })
                      }
                      className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>

                {/* Hemoglobin */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Hemoglobin</span>
                    <span className="text-cyan-400 text-[10px]">CBC Index</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      step="0.1"
                      value={confirmedFindings.hemoglobin?.value || ''}
                      onChange={(e) =>
                        setConfirmedFindings({
                          ...confirmedFindings,
                          hemoglobin: { ...confirmedFindings.hemoglobin, value: parseFloat(e.target.value) },
                        })
                      }
                      className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm"
                    />
                    <span className="text-xs text-slate-400">g/dL</span>
                  </div>
                </div>

                {/* Serum Creatinine */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Serum Creatinine</span>
                    <span className="text-cyan-400 text-[10px]">Renal Parameter</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      step="0.1"
                      value={confirmedFindings.serumCreatinine?.value || ''}
                      onChange={(e) =>
                        setConfirmedFindings({
                          ...confirmedFindings,
                          serumCreatinine: { ...confirmedFindings.serumCreatinine, value: parseFloat(e.target.value) },
                        })
                      }
                      className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm"
                    />
                    <span className="text-xs text-slate-400">mg/dL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Extracted Text Viewer */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Raw Document Text Stream (Verified Source)
              </h4>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-800/80 leading-relaxed">
                {extractedData.extractedRawText}
              </pre>
            </div>
          </div>

          {/* Column 3: Plain Language Explanations & Clinician Review (1 Col) */}
          <div className="space-y-6">
            {/* Plain-Language Medical Terminology Explainer */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Info className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Plain-Language Context</h4>
              </div>

              <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                {Object.entries(extractedData.plainLanguageExplanations).map(([metricKey, entry]) => (
                  <div key={metricKey} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      {metricKey.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{entry.plainExplanation}</p>
                    <div className="text-[11px] text-slate-400">
                      <strong>Standard Range:</strong> {entry.typicalReferenceRange}
                    </div>
                    <div className="text-[10px] text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-900/40">
                      ⚠️ {entry.safetyNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinician Review & Explicit Patient Consent Box */}
            <div className="bg-slate-900/90 border border-cyan-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Clinician Review & Consent Verification</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGranted}
                    onChange={(e) => setConsentGranted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-700 focus:ring-cyan-400"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    Patient has granted explicit informed consent to associate these extracted clinical findings with their digital health passport.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clinicianReviewed}
                    onChange={(e) => setClinicianReviewed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-700 focus:ring-cyan-400"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I, as authorized clinician, have inspected and verified the extracted lab values against the original report.
                  </span>
                </label>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Clinician Summary / Notes</label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Mildly elevated fasting glucose. Recommend follow-up in 14 days."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
                />
              </div>

              <button
                onClick={handleConfirmAndLink}
                disabled={!consentGranted || !clinicianReviewed || isLinking}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLinking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Confirm & Link to Health Passport</span>
              </button>

              {linkSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Findings verified and linked to patient health profile.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportReader;
