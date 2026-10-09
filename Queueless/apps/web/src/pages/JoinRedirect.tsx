import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Smartphone, 
  MapPin, 
  ArrowRight, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const JoinRedirect: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/organizations/resolve-qr/${token}`);
        setData(res.data);

        // Attempt deep link if on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = `queueless://join/${token}`;
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired QR code.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTarget();
    }
  }, [token]);

  const deepLink = `queueless://join/${token}`;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="px-6 py-6 border-b border-slate-800 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
            Q
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">QueueLess</span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
              Customer Portal
            </span>
          </div>
        </div>
        <Link
          to="/login"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Staff Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-400 font-medium">Resolving QueueLess QR Destination...</p>
            </div>
          ) : error ? (
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-center backdrop-blur-md shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold mb-2">QR Code Expired or Not Found</h3>
              <p className="text-sm text-slate-400 mb-6">{error}</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Go to Home
              </Link>
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Glow Accent */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Queue Destination
              </div>

              {data.type === 'BRANCH' ? (
                <>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                    {data.branch.name}
                  </h2>
                  <p className="text-sm text-slate-400 flex items-center justify-center gap-1.5 mb-6">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    {data.branch.location}
                  </p>

                  <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 text-left mb-6 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Organization:</span>
                      <span className="font-semibold text-slate-200">{data.organization.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Operating Hours:</span>
                      <span className="font-semibold text-slate-200">{data.branch.operatingHours || '08:00 - 17:00'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Available Services:</span>
                      <span className="font-semibold text-blue-400">{data.branch.services?.length || 0} active</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                    {data.service.name}
                  </h2>
                  <p className="text-sm text-slate-400 mb-6">
                    {data.branch.name} • {data.organization.name}
                  </p>

                  <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 text-left mb-6 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Estimated Duration:</span>
                      <span className="font-semibold text-slate-200">{data.service.duration} minutes</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Queue Status:</span>
                      <span className={`font-semibold ${data.service.isQueueOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {data.service.isQueueOpen ? 'Open for Entry' : 'Currently Closed'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <a
                  href={deepLink}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                >
                  <Smartphone className="w-4 h-4" />
                  Open in QueueLess App
                </a>

                <button
                  type="button"
                  onClick={() => alert('The dedicated QueueLess Customer App is built in apps/mobile using Expo. Run "npx expo start" in apps/mobile or install the APK/iOS build!')}
                  className="w-full py-3.5 px-6 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border border-slate-600/50 transition-all"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  Install Customer App
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <Link
                  to="/"
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  Continue on Web Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800 max-w-5xl mx-auto w-full">
        QueueLess Platform • Smart Unified Queue & Appointment System
      </footer>
    </div>
  );
};

export default JoinRedirect;
