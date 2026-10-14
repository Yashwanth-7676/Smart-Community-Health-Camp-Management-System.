import React, { useState, useEffect } from 'react';
import { Download, Printer, QrCode as QrIcon, RefreshCw, AlertCircle } from 'lucide-react';
import apiClient from '@/api/client';

interface QRCodeDisplayProps {
  appointmentId: string;
  token?: string;
  campName?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  appointmentId,
  token = 'Q-01',
  campName = 'Health Camp',
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/qr/${appointmentId}`);
      if (res.data?.data?.qrCodeDataUrl) {
        setQrCodeUrl(res.data.data.qrCodeDataUrl);
      } else {
        throw new Error('No QR code data received');
      }
    } catch {
      setError('Unable to load QR check-in token.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchQRCode();
    }
  }, [appointmentId]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `HealthCamp_Token_${token}_${appointmentId.slice(-6)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Health Camp Token - ${token}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
            h2 { color: #0a2540; margin-bottom: 5px; }
            .token { font-size: 32px; font-weight: bold; color: #0284c7; margin: 15px 0; }
            img { max-width: 250px; border: 2px solid #e2e8f0; border-radius: 12px; padding: 10px; }
            p { color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>Smart Community Health Camp</h2>
          <p>${campName}</p>
          <div class="token">TOKEN: ${token}</div>
          <img src="${qrCodeUrl}" alt="Check-in QR" />
          <p>Present this QR code at camp reception for contactless check-in.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700/80 text-center max-w-sm mx-auto shadow-xl">
      <div className="flex items-center justify-center gap-2 mb-4 text-cyan-400 font-semibold text-sm">
        <QrIcon className="w-4 h-4" /> Digital Check-in Pass
      </div>

      <div className="w-56 h-56 mx-auto bg-white rounded-2xl p-3 flex items-center justify-center shadow-inner relative overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
            <span>Generating secure QR...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-red-500 text-xs p-4">
            <AlertCircle className="w-6 h-6" />
            <span>{error}</span>
            <button
              onClick={fetchQRCode}
              className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          qrCodeUrl && <img src={qrCodeUrl} alt={`Check-in QR Token ${token}`} className="w-full h-full object-contain" />
        )}
      </div>

      <div className="mt-4">
        <div className="text-xl font-bold text-white tracking-wide">{token}</div>
        <div className="text-xs text-slate-400 mt-1">{campName}</div>
      </div>

      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
        Present this token pass to camp volunteers at arrival for instant queue check-in.
      </p>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          onClick={handleDownload}
          disabled={!qrCodeUrl}
          className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" /> Save PNG
        </button>
        <button
          onClick={handlePrint}
          disabled={!qrCodeUrl}
          className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;

