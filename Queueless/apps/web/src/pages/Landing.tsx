import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  QrCode, 
  Tv, 
  Calendar, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Download, 
  Sparkles, 
  Activity, 
  Layers, 
  Check, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  UserPlus,
  LogIn,
  Share2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'banking' | 'healthcare' | 'civic'>('banking');
  const [showIosModal, setShowIosModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white">QueueLess</span>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Orchestrating Seamless Customer Journeys</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <a href="#overview" className="hover:text-white transition-colors">Overview</a>
            <a href="#customers" className="hover:text-white transition-colors">For Customers</a>
            <a href="#organizations" className="hover:text-white transition-colors">For Organizations</a>
            <a href="#mobile" className="hover:text-white transition-colors">Mobile App & APK</a>
            <a href="#demos" className="hover:text-white transition-colors">Live Demos</a>
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                to="/"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md transition-all hover:scale-105"
              >
                <span>Console ({user.role})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/login?mode=customer"
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-600/15 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-indigo-300 mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>Production-Ready Multi-Tenant Queue Orchestration</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Eliminate Waiting Lines. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Empower Every Visitor.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            QueueLess is a cloud-native, enterprise multi-tenant platform engineered for commercial banks, 
            specialist healthcare clinics, and civic authorities. Experience virtual queuing, 1:1 desk-bound QR standees, 
            airport-style TV departure screens, and conflict-free appointment booking.
          </p>

          {/* Primary Action Group */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/25 transition-all hover:scale-105"
            >
              <LogIn className="w-5 h-5" />
              <span>Launch Web Portal</span>
            </Link>

            <a
              href="/downloads/queueless.apk"
              download="queueless.apk"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-bold text-sm sm:text-base px-5 py-3.5 rounded-2xl shadow-md transition-all hover:scale-105"
            >
              <Download className="w-5 h-5 text-emerald-400" />
              <span>Download Android APK</span>
            </a>

            <button
              onClick={() => setShowIosModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-4 py-3.5 rounded-2xl border border-slate-800 hover:bg-slate-900 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>iOS / iPhone Guide</span>
            </button>
          </div>

          {/* Key Platform Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-black text-white">0s</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Real-Time Sync Delay</div>
              <p className="text-[11px] text-slate-500 mt-0.5">WebSocket live ticket dispatching</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-black text-cyan-400">1:1 Desk QR</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Direct Service Binding</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Zero ambiguous menu selections</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-black text-indigo-400">100% PWA</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">iOS & Android Ready</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Add to Home Screen in 1 tap</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400">Audio Chimes</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Web Audio Synthesis</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Harmonic lobby departure bells</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sector Demonstrations */}
      <section id="overview" className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Multi-Tenant Scalability</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Tailored for Commercial & Civic High-Traffic Environments
            </h3>
            <p className="text-sm sm:text-base text-slate-400 mt-3">
              QueueLess isolates organizations into independent data partitions while offering unified queue algorithms.
            </p>
          </div>

          {/* Sector Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-bold">
              <button
                onClick={() => setActiveTab('banking')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'banking' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Apex Bank Ghana (Banking)
              </button>
              <button
                onClick={() => setActiveTab('healthcare')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'healthcare' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                St. Jude Hospital (Healthcare)
              </button>
              <button
                onClick={() => setActiveTab('civic')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'civic' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                DVLA Ghana (Civic / Gov)
              </button>
            </div>
          </div>

          {/* Active Sector Content */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto">
            {activeTab === 'banking' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Commercial Banking</span>
                    <h4 className="text-2xl font-black text-white mt-1">Apex Bank Ghana</h4>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold">
                    Airport City & Osu Branches
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Engineered to eliminate long queues at retail teller windows and personal banking suites. 
                  Customers scan physical QR stands at entrance stanchions to receive VIP or Standard queue tokens, 
                  tracked in real time on waiting hall TV screens.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">Cash & Teller Desk</span>
                    <span className="text-slate-400">High-speed deposit and withdrawal queue</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">Customer Service & Cards</span>
                    <span className="text-slate-400">Account opening, debit cards, loans</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">Foreign Exchange (FX)</span>
                    <span className="text-slate-400">Dedicated teller counter routing</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'healthcare' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Outpatient Healthcare</span>
                    <h4 className="text-2xl font-black text-white mt-1">St. Jude Specialist Hospital</h4>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                    Ridge & East Legon Polyclinics
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Streamlining patient flow across outpatient triage, specialist doctor consultations, and dispensary intake. 
                  Avoids crowded waiting rooms through remote mobile check-in and automated priority routing for emergency patients.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">Triage & Vitals Check</span>
                    <span className="text-slate-400">Temperature, blood pressure, BMI screening</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">OPD & Specialist Doctor</span>
                    <span className="text-slate-400">Doctor consultation scheduling</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">Pharmacy & Lab</span>
                    <span className="text-slate-400">Prescription pickup and diagnostic blood draw</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'civic' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Civic & Public Regulation</span>
                    <h4 className="text-2xl font-black text-white mt-1">Driver & Vehicle Licensing Authority (DVLA)</h4>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                    37 Liberation Rd & Tema Centers
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Managing public foot-traffic for driver licensing examinations, biometric capture, and vehicle roadworthiness inspection. 
                  Eliminates middleman chaos with transparent sequential digital ticket dispatching.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">Driver License Renewal</span>
                    <span className="text-slate-400">Biometric photo, eye test, card issuance</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">Vehicle Inspection</span>
                    <span className="text-slate-400">Automated computerized lane dispatch</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-white block">Haulage & Fleet Permits</span>
                    <span className="text-slate-400">Commercial cargo validation</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What Customers Can Do */}
      <section id="customers" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Customer & Visitor Experience</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              What Customers Can Do with QueueLess
            </h3>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Visitors enjoy complete control over their time. No more standing in physical lines or being tethered to a crowded lobby.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-5">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Remote Queue Entry</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Join live queues from home or office before you arrive. Receive an authentic sequential digital ticket directly on your mobile device.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">1:1 Desk QR Check-In</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Scan physical desk standees on-site to be routed instantly to the exact service counter. Zero ambiguous menus or wrong queue selections.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Live Wait-Time Tracker</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Track your real-time queue position, estimated remaining wait minutes, and exactly how many customers are ahead of you.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Conflict-Free Appointments</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Schedule guaranteed 30-minute booking slots with automatic conflict detection, operating hours validation, and 1-click self-rescheduling.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mb-5">
                <Tv className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Audio & Screen Chimes</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Hear harmonic Web Audio chimes and see your ticket displayed in high contrast on lobby TV monitors when called to counter desks.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Digital Ticket Wallet</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                View your complete visit history, tickets served, and upcoming appointment confirmations anytime across all registered organizations.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/login?mode=customer"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Customer Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* What Organizations Can Do */}
      <section id="organizations" className="py-20 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Institutional Platform</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              What Organizations & Businesses Can Do
            </h3>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Comprehensive operational command for branch directors, floor supervisors, and teller counter staff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Multi-Branch Architecture</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Manage headquarters, regional branches, and sub-stations from one central cockpit with strict data tenancy and zero data leakage.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Teller Counter Workspace</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Counter operators call, put on hold, recall, transfer, or complete tickets with 1 click. Features synthesized chime broadcasting.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Tv className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">High-Contrast TV Display</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Dedicated departure-style screen for lobby monitors (`/display`) with real-time counter routing, high visibility, and audio alerts.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Dynamic QR Management</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Generate high-resolution printable desk standees with custom validity periods, token expiration, and instant security revocation.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Real-Time Operational Analytics</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Analyze hourly peak traffic, median wait times, service durations, completion rates, and staff productivity across all counters.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Role-Based Governance</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Strict permissions separating Super Admins, Organization Admins, Branch Managers, Counter Staff, and Customers.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/login?mode=org"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
            >
              <Building2 className="w-4 h-4" />
              <span>Register Your Organization / Business</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile App & APK Download Section + iOS Guide */}
      <section id="mobile" className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Native & Mobile Experience</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              QueueLess on Your Smartphone
            </h3>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Get the official mobile client on Android or install instantly on iOS through Apple Safari.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Android APK Box */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-4">
                  <span>Android Package Kit (.APK)</span>
                </div>
                <h4 className="text-2xl font-black text-white">Direct Android Download</h4>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Download the official QueueLess `.apk` package for Android phones and tablets. 
                  Enjoy native camera QR code scanning, instant virtual queue tokens, and background vibration chimes.
                </p>

                <div className="my-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">File Name:</span>
                    <span className="text-white font-bold">queueless.apk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Package:</span>
                    <span className="text-emerald-400">com.queueless.customer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Version:</span>
                    <span className="text-white">v1.0.0 (Release)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Compatibility:</span>
                    <span className="text-white">Android 8.0 & Above</span>
                  </div>
                </div>
              </div>

              <div>
                <a
                  href="/downloads/queueless.apk"
                  download="queueless.apk"
                  className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-5 h-5" />
                  <span>Download queueless.apk</span>
                </a>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  1-Click download. Tap file after download to install on your phone.
                </p>
              </div>
            </div>

            {/* iOS Compatibility & Installation Guide */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold mb-4">
                  <span>Apple iOS & iPadOS</span>
                </div>
                <h4 className="text-2xl font-black text-white">Can iOS Users Download It?</h4>
                
                <div className="mt-3 p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                  <strong className="block text-white mb-1">Why APKs don't install on iPhone:</strong>
                  Apple's iOS operating system is a closed sandbox and strictly cannot open or install Android `.apk` packages. 
                  Native iOS apps require `.ipa` files distributed via the App Store or TestFlight.
                </div>

                <div className="mt-4 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    How iPhone Users Install in 30 Seconds (PWA):
                  </h5>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <span>Open <strong>Safari</strong> on your iPhone or iPad.</span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <span>Visit <strong>https://holystartech.me/queueless</strong>.</span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <span>Tap the <strong>Share</strong> button (box with upward arrow at bottom).</span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                      <span>Tap <strong>"Add to Home Screen"</strong>.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowIosModal(true)}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm py-3.5 rounded-2xl border border-slate-700 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>View Step-by-Step iPhone Guide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demonstrations Section */}
      <section id="demos" className="py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Interactive Walkthrough</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Test QueueLess Live Right Now
            </h3>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Explore the dedicated screens and user journeys with full real-time database connectivity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/display"
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Tv className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">Lobby TV Display</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Dedicated waiting hall monitor screen with audio chime callouts.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-indigo-400">
                <span>Open Screen</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/kiosk"
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Self-Service Kiosk</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Touchscreen lobby stanchion for walk-in visitor ticket dispensing.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-cyan-400">
                <span>Try Kiosk</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/customer-portal"
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Customer Portal</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Virtual queue tickets, appointment booking, and live tracker.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-emerald-400">
                <span>View Portal</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            <Link
              to="/login"
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LogIn className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">Management Portal</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Staff calling desks, QR management, and platform analytics.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-purple-400">
                <span>Log In</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Conversion Section */}
      <section className="py-20 border-t border-slate-800 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] pointer-events-none" />

            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Upgrade Your Waiting Experience?
            </h3>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
              Join thousands of customers and leading institutions who have eliminated physical waiting lines forever.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/login?mode=customer"
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register as Customer</span>
              </Link>
              <Link
                to="/login?mode=org"
                className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all hover:scale-105"
              >
                <Building2 className="w-4 h-4" />
                <span>Register as Organization</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">QueueLess Enterprise Platform</span>
            <span>• Built by Holy Star Tech</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Holy Star Tech. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* iOS Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Apple iOS / iPhone Guide</h4>
                <p className="text-xs text-slate-400">Installing QueueLess on iPhone & iPad</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Because Apple enforces a closed security sandbox, <strong>iOS cannot install `.apk` files</strong> (which are exclusively compiled for Android).
              </p>
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">30-Second Safari Installation:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Open <strong>Safari</strong> on your iPhone or iPad.</li>
                  <li>Navigate to <strong>https://holystartech.me/queueless</strong>.</li>
                  <li>Tap the <strong>Share button</strong> (square with an upward arrow at the bottom).</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top right corner.</li>
                </ol>
              </div>
              <p className="text-emerald-400 font-semibold">
                ✓ Launches full-screen without browser URL bars, supports camera QR code scanning, and provides instant ticket updates!
              </p>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Got It, Thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
