// frontend/src/components/common/PWAInstallBanner.tsx
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || isDismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-navy-900/95 border border-primary-500/30 backdrop-blur-xl p-4 rounded-2xl shadow-2xl shadow-primary-950/50 flex items-start space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-teal-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
            Install HealthCamp App
            <span className="text-[10px] bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded-full font-mono">
              Offline Ready
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Access live queues, draft registrations offline, and view camp schedules without internet.
          </p>

          <div className="mt-3 flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install PWA</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;

