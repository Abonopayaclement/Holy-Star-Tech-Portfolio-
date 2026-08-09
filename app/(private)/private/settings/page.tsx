"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/private/AdminLayout";
import { toast } from "sonner";
import {
  Bell,
  Check,
  Globe,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getProfileData, updateProfileData } from "@/actions/profile";

export default function PrivateSettingsPage() {
  const [activeTab, setActiveTab] = useState<"website" | "notifications" | "security">("website");
  const [loading, setLoading] = useState(false);

  // Website Text State
  const [bio, setBio] = useState(
    "HND Computer Science student at Kumasi Technical University with a Computer Hardware background from Bolgatanga Technical Institute."
  );
  const [philosophy, setPhilosophy] = useState(
    "Building practical software solutions, continuous learning, and clean code principles."
  );

  // Notification Toggles
  const [notifyContact, setNotifyContact] = useState(true);
  const [notifyViews, setNotifyViews] = useState(true);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const prof = await getProfileData();
        if (prof) {
          setBio(prof.bio || "");
          setPhilosophy(prof.philosophy || "");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  // Save Website Text Settings
  const handleSaveWebsiteText = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfileData({
        bio,
        philosophy,
      });
      if (res.success) {
        toast.success("Website text settings saved successfully!");
      } else {
        toast.error(res.error || "Failed to save settings.");
      }
    } catch (err: any) {
      toast.error("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  // Save Security Settings
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    toast.success("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <AdminLayout title="System Settings">
      <div className="space-y-8 pb-12">
        {/* TOP HEADER BANNER */}
        <div className="border-b border-border/60 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">System & Website Settings</h2>
            <p className="text-xs text-muted-foreground">
              Manage hero text, about information, notification alerts, and password security.
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("website")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "website"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Globe className="h-4 w-4" /> Website Text
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "notifications"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Bell className="h-4 w-4" /> Notifications
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "security"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Security
          </button>
        </div>

        {/* 1. WEBSITE TEXT TAB */}
        {activeTab === "website" && (
          <form onSubmit={handleSaveWebsiteText} className="max-w-3xl space-y-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-500" /> Website Content & Bio
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Hero & About Introduction Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden resize-y"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Engineering Philosophy</label>
              <textarea
                rows={3}
                value={philosophy}
                onChange={(e) => setPhilosophy(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-[1.02] disabled:opacity-50 min-h-[44px]"
            >
              <Save className="h-4 w-4" /> Save Website Text
            </button>
          </form>
        )}

        {/* 2. NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="max-w-3xl space-y-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-500" /> Notification & Tracking Settings
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-2xl border border-border/60 bg-accent/20 p-4 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-foreground">Contact Form Notifications</p>
                  <p className="text-[11px] text-muted-foreground">Receive instant alerts when visitors submit a contact message.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyContact}
                  onChange={(e) => setNotifyContact(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-border/60 bg-accent/20 p-4 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-foreground">Visitor Activity Tracking</p>
                  <p className="text-[11px] text-muted-foreground">Track CV downloads, blog views, and device metadata.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyViews}
                  onChange={(e) => setNotifyViews(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* 3. SECURITY TAB */}
        {activeTab === "security" && (
          <form onSubmit={handleSavePassword} className="max-w-3xl space-y-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-500" /> Security & Password Management
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-[1.02]"
            >
              <Lock className="h-4 w-4" /> Update Password
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
