"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Users,
  Tv,
  QrCode,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Database,
  Radio,
  Clock,
  Sparkles,
  Ticket,
  Volume2,
  ChevronRight,
  Monitor,
  KeyRound,
  FileCode,
} from "lucide-react";

interface TenantInfo {
  id: string;
  name: string;
  type: string;
  tagline: string;
  branches: string[];
  services: string[];
  adminEmail: string;
  staffEmail: string;
  counters: string;
}

const TENANTS: TenantInfo[] = [
  {
    id: "apex-bank",
    name: "Apex Bank Ghana",
    type: "Commercial Banking",
    tagline: "Retail teller operations, cash deposits, loan inquiries & FX exchange",
    branches: ["Main Airport Branch (Accra)", "Adum Commercial Branch (Kumasi)"],
    services: ["Cash Deposit / Withdrawal", "Account Opening", "Foreign Exchange (FX)", "Customer Care"],
    adminEmail: "owner@queueless.com",
    staffEmail: "staff@queueless.com",
    counters: "Counters 1 - 6 (Dedicated Teller Bays)",
  },
  {
    id: "st-jude",
    name: "St. Jude Specialist Hospital",
    type: "Healthcare & Clinics",
    tagline: "Outpatient department (OPD), triage, specialized clinics & pharmacy",
    branches: ["Ridge Medical Center (Accra)"],
    services: ["Triage & Vitals", "General Consultation", "Pharmacy Dispensing", "Diagnostic Laboratory"],
    adminEmail: "clinic.admin@queueless.com",
    staffEmail: "staff@queueless.com",
    counters: "Consulting Rooms 1 - 4 & Pharmacy Bay",
  },
  {
    id: "dvla",
    name: "Driver & Vehicle Licensing Authority",
    type: "Civic & Government",
    tagline: "Driver license renewals, roadworthiness testing & vehicle registration",
    branches: ["37 Military Road Licensing Center"],
    services: ["Driver License Renewal", "Roadworthiness Inspection", "Vehicle Registration", "Biometrics Capturing"],
    adminEmail: "gov.admin@queueless.com",
    staffEmail: "staff@queueless.com",
    counters: "Verification Desks A - E",
  },
];

const TEST_ACCOUNTS = [
  {
    role: "Super Admin",
    badge: "Platform Oversight",
    email: "admin@queueless.com",
    scope: "Global multi-tenant system oversight, organizations, analytics & staff",
    color: "from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-400",
  },
  {
    role: "Apex Bank Owner",
    badge: "Commercial Banking",
    email: "owner@queueless.com",
    scope: "Bank branch manager, teller counters, queue priority rules & SLA reporting",
    color: "from-blue-500/10 to-cyan-500/10 border-blue-500/30 text-blue-400",
  },
  {
    role: "Clinic Admin",
    badge: "Healthcare OPD",
    email: "clinic.admin@queueless.com",
    scope: "Doctor room allocation, triage prioritization & pharmacy queue dispatch",
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400",
  },
  {
    role: "DVLA Civic Admin",
    badge: "Civic Authority",
    email: "gov.admin@queueless.com",
    scope: "License desk balancing, vehicle inspection lines & biometric station metrics",
    color: "from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-400",
  },
  {
    role: "Branch Teller / Staff",
    badge: "Counter Workspace",
    email: "staff@queueless.com",
    scope: "Live ticket calling (WAITING -> CALLING -> SERVING), audio chimes & transfer",
    color: "from-cyan-500/10 to-blue-500/10 border-cyan-500/30 text-cyan-400",
  },
  {
    role: "Customer (Abena)",
    badge: "Mobile Pass",
    email: "customer@queueless.com",
    scope: "Clean state: 0 active tickets, ready for instant QR scan & slot booking",
    color: "from-pink-500/10 to-rose-500/10 border-pink-500/30 text-pink-400",
  },
];

export default function QueueLessPortalPage() {
  const [selectedTenant, setSelectedTenant] = useState<string>("apex-bank");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Mini Interactive Ticket Simulator
  const [simulatedTicket, setSimulatedTicket] = useState<{
    number: string;
    service: string;
    pos: number;
    wait: number;
    status: string;
  } | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  const activeTenant = TENANTS.find((t) => t.id === selectedTenant) || TENANTS[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleGenerateTicket = (serviceName: string) => {
    const letters = ["A", "B", "C", "D"];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomNum = Math.floor(Math.random() * 80) + 101;
    setSimulatedTicket({
      number: `${randomLetter}-${randomNum}`,
      service: serviceName,
      pos: 3,
      wait: 8,
      status: "WAITING",
    });
  };

  const playChimeAndCall = () => {
    if (!simulatedTicket) return;
    setIsCalling(true);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Two-tone chime (523Hz C5 -> 659Hz E5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.frequency.setValueAtTime(659.25, now + 0.3);
      gain2.gain.setValueAtTime(0.3, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 1.0);
    } catch {
      // AudioContext fallback
    }

    setSimulatedTicket((prev) =>
      prev ? { ...prev, status: "CALLING (COUNTER 3)", pos: 0, wait: 0 } : null
    );

    setTimeout(() => {
      setIsCalling(false);
    }, 2500);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-24 selection:bg-cyan-500/20 selection:text-cyan-400">
      {/* Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-cyan-500/10 via-blue-600/15 to-indigo-600/10 blur-3xl opacity-80" />

      {/* Top Breadcrumb & Status Ribbon */}
      <div className="border-b border-border/50 bg-background/60 backdrop-blur-md sticky top-16 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <Link
              href="/projects/queueless-system"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              QueueLess System
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-cyan-500 font-semibold">Live Platform Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-mono font-medium text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aiven Cloud DB Synced
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* HERO SECTION */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono font-bold text-cyan-400">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            ENTERPRISE MULTI-TENANT QUEUE ORCHESTRATION PLATFORM
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              QueueLess{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Platform Portal
              </span>
            </h1>
            <p className="max-w-4xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Real-time digital ticket dispatching, 1:1 service-bound QR standees, sub-50ms WebSocket queue progression, and airport-style high-contrast lobby TV screens with synthesized harmonic audio chimes.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/projects/queueless-system"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-xs font-semibold text-background transition-transform hover:scale-105 shadow-lg"
            >
              <FileCode className="h-4 w-4" />
              Read Deep-Dive Enterprise Case Study
            </Link>
            <a
              href="http://localhost:3001/queueless"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-all shadow-md"
            >
              <ExternalLink className="h-4 w-4" />
              Open Local Workspace (Port 3001)
            </a>
            <a
              href="https://github.com/ayebonoclement"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>

        {/* SECTION 1: LIVE INTERACTIVE TICKET SIMULATOR */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-card/90 to-card/40 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                Browser Interactive Simulator
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Live 1:1 Service Standee & Chime Test
              </h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Click a service to simulate scanning a physical desk QR standee, then test the teller call chime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Step 1: Select Service Desk */}
            <div className="space-y-3 md:col-span-1">
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase">
                1. Select Service Standee:
              </span>
              <div className="space-y-2">
                {activeTenant.services.map((srv, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleGenerateTicket(srv)}
                    className="w-full text-left rounded-xl border border-border/60 bg-accent/30 p-3 text-xs font-medium text-foreground hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all flex items-center justify-between group"
                  >
                    <span>{srv}</span>
                    <QrCode className="h-4 w-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Digital Ticket Card */}
            <div className="md:col-span-1">
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase block mb-3">
                2. Generated Mobile Pass:
              </span>
              {simulatedTicket ? (
                <div className="rounded-2xl border border-cyan-500/40 bg-zinc-950 p-5 shadow-2xl space-y-4 text-center">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground border-b border-zinc-800 pb-2">
                    <span>{activeTenant.name}</span>
                    <span className="text-cyan-400 font-semibold">{simulatedTicket.status}</span>
                  </div>

                  <div className="py-2">
                    <span className="text-xs font-mono text-muted-foreground uppercase">Ticket Number</span>
                    <div className="text-4xl font-extrabold font-mono text-white tracking-widest mt-1">
                      {simulatedTicket.number}
                    </div>
                    <span className="text-xs text-cyan-400 font-medium mt-1 block">
                      {simulatedTicket.service}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3 text-xs font-mono">
                    <div className="rounded-lg bg-zinc-900 p-2">
                      <span className="text-zinc-500 block text-[10px]">AHEAD OF YOU</span>
                      <span className="text-base font-bold text-white">{simulatedTicket.pos}</span>
                    </div>
                    <div className="rounded-lg bg-zinc-900 p-2">
                      <span className="text-zinc-500 block text-[10px]">EST. WAIT</span>
                      <span className="text-base font-bold text-emerald-400">{simulatedTicket.wait} min</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 min-h-[190px]">
                  <Ticket className="h-8 w-8 text-muted-foreground/40" />
                  <span>Click any service desk on the left to dispense a ticket</span>
                </div>
              )}
            </div>

            {/* Step 3: Teller Call Screen & Chime */}
            <div className="md:col-span-1 space-y-3">
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase">
                3. Teller Audio-Visual Callout:
              </span>
              <div className="rounded-2xl border border-border/60 bg-accent/20 p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground block">
                    Staff Calling Workspace Action
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Broadcasts a WebSocket event to TV lobby screens and triggers synthesized Web Audio chimes.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!simulatedTicket || isCalling}
                  onClick={playChimeAndCall}
                  className={`w-full rounded-xl px-4 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                    !simulatedTicket
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : isCalling
                      ? "bg-amber-500 text-black font-bold animate-pulse"
                      : "bg-cyan-500 text-black font-bold hover:bg-cyan-400"
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                  {isCalling
                    ? "Chime Playing & Broadcasting..."
                    : "Call Ticket (Play Harmonic Chime)"}
                </button>

                <div className="text-[11px] font-mono text-muted-foreground text-center">
                  Frequency: 523Hz (C5) ➔ 659Hz (E5) Synthesized Chime
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: MULTI-TENANT PRODUCTION ENVIRONMENTS */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                Multi-Tenant Architecture
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Active Tenant Environments
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TENANTS.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => setSelectedTenant(tenant.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    selectedTenant === tenant.id
                      ? "bg-cyan-500 text-black font-bold shadow-md"
                      : "border border-border/70 bg-card hover:bg-accent text-muted-foreground"
                  }`}
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4 border-b lg:border-b-0 lg:border-r border-border/60 pb-6 lg:pb-0 lg:pr-6">
              <div className="space-y-1">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                  {activeTenant.type}
                </span>
                <h3 className="text-xl font-bold text-foreground">{activeTenant.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeTenant.tagline}
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs font-mono">
                <div className="rounded-xl bg-accent/40 p-3 space-y-1">
                  <span className="text-muted-foreground block text-[11px]">ACTIVE BRANCHES</span>
                  {activeTenant.branches.map((b, i) => (
                    <div key={i} className="text-foreground font-medium flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      {b}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-accent/40 p-3 space-y-1">
                  <span className="text-muted-foreground block text-[11px]">COUNTER ALLOCATION</span>
                  <div className="text-foreground font-medium">{activeTenant.counters}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">
                  Configured Service Desks (1:1 QR Bound)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeTenant.services.map((srv, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/60 bg-accent/20 p-3.5 flex items-start gap-3"
                    >
                      <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                        <QrCode className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{srv}</div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          Standee Token: DESK-{idx + 1}-TOKEN
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-foreground block">
                    Direct Administrative Contact for {activeTenant.name}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    Admin Login: {activeTenant.adminEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeTenant.adminEmail)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent flex items-center gap-1.5 transition-colors"
                >
                  {copiedEmail === activeTenant.adminEmail ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TEST ACCOUNTS MATRIX */}
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Verification & Testing Credentials
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Pre-Configured One-Click Test Accounts
            </h2>
            <p className="text-xs text-muted-foreground">
              All accounts are provisioned with password:{" "}
              <code className="rounded bg-accent/60 px-1.5 py-0.5 font-mono text-foreground font-bold">
                admin123
              </code>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEST_ACCOUNTS.map((acc, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">{acc.role}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${acc.color}`}>
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {acc.scope}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-foreground font-semibold truncate max-w-[170px]">
                    {acc.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(acc.email)}
                    className="rounded-lg border border-border bg-accent/30 p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Copy Email"
                  >
                    {copiedEmail === acc.email ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: PLATFORM INTERFACES SCREENSHOT GALLERY */}
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
              Visual System Tour
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Production Operational Interfaces
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-border/80 bg-zinc-950 p-3 shadow-xl space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
                <Image
                  src="/uploads/images/queueless_hero_dashboard.jpg"
                  alt="Staff Counter Workspace"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-2 space-y-1">
                <div className="text-sm font-bold text-white">Staff Counter Dispatcher</div>
                <div className="text-xs text-zinc-400">
                  Sub-millisecond ticket calling, customer details, and harmonic audio alerts.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-zinc-950 p-3 shadow-xl space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
                <Image
                  src="/uploads/images/queueless_tv_display.jpg"
                  alt="Airport TV Lobby Board"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-2 space-y-1">
                <div className="text-sm font-bold text-white">High-Contrast TV Waiting Hall Display</div>
                <div className="text-xs text-zinc-400">
                  Fullscreen airport-style board (/display) with live counter routing and chime broadcasts.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-zinc-950 p-3 shadow-xl space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
                <Image
                  src="/uploads/images/queueless_customer_portal.jpg"
                  alt="Customer Mobile Queue Pass"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-2 space-y-1">
                <div className="text-sm font-bold text-white">Customer Mobile & Web Pass</div>
                <div className="text-xs text-zinc-400">
                  Live ticket place countdown, estimated wait timer, and self-service appointment rescheduling.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-zinc-950 p-3 shadow-xl space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
                <Image
                  src="/uploads/images/queueless_qr_management.jpg"
                  alt="QR Standee Management"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-2 space-y-1">
                <div className="text-sm font-bold text-white">Service Standee Management Hub</div>
                <div className="text-xs text-zinc-400">
                  Generate, print, and audit high-contrast 1:1 service bound desk tokens with scan telemetry.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: CLOUD DATABASE & INFRASTRUCTURE TELEMETRY */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-1 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
              <Database className="h-4 w-4" />
              Production Infrastructure Telemetry
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Aiven Cloud Database & Schema Isolation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
            <div className="rounded-2xl border border-border/60 bg-accent/20 p-4 space-y-2">
              <span className="text-muted-foreground block text-[11px]">SHARED CLOUD DATABASE</span>
              <div className="text-foreground font-bold text-sm">Aiven MySQL (holystartech_db)</div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Co-located with Holy Star Tech portfolio database with zero collisions via strict Prisma table mappings.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-accent/20 p-4 space-y-2">
              <span className="text-muted-foreground block text-[11px]">SAFE TABLE PREFIXES</span>
              <div className="text-foreground font-bold text-sm">queueless_user, queueless_skill</div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Guarantees independent migrations without touching the main portfolio user or skill tables.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-accent/20 p-4 space-y-2">
              <span className="text-muted-foreground block text-[11px]">INDEPENDENT DECOUPLING</span>
              <div className="text-foreground font-bold text-sm">QUEUELLESS_DATABASE_URL</div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Supports 1-variable point-and-switch if QueueLess is detached to its own dedicated database later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
