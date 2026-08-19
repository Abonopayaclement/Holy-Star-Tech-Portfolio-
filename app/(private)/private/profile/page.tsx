"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  CheckCircle2,
  Code2,
  FileText,
  Globe,
  GraduationCap,
  Plus,
  Save,
  Share2,
  Trash2,
  Upload,
  UserCheck,
  Wrench,
  X,
  Loader2,
  Download,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import {
  getProfileData,
  updateProfileData,
  getResumeData,
  updateResumeData,
  getSkillsData,
  addSkill,
  deleteSkill,
  getSocialLinksData,
  updateSocialLinksData,
} from "@/actions/profile";

export default function PrivateProfilePage() {
  const [activeTab, setActiveTab] = useState<
    "about" | "resume" | "skills" | "contact"
  >("about");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // About Me Form State
  const [authorName, setAuthorName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");

  // Resume Form State
  const [cvFileUrl, setCvFileUrl] = useState("");
  const [resumeSummary, setResumeSummary] = useState("");
  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);

  // Skills Form State
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Frontend");
  const [newSkillProficiency, setNewSkillProficiency] = useState(90);

  // Social Links Form State
  const [socialMap, setSocialMap] = useState<Record<string, string>>({
    github: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    twitter: "",
  });

  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        const [profile, resume, skillsList, socials] = await Promise.all([
          getProfileData(),
          getResumeData(),
          getSkillsData(),
          getSocialLinksData(),
        ]);

        if (profile) {
          setAuthorName(profile.authorName || "");
          setHeadline(profile.headline || "");
          setBio(profile.bio || "");
          setPhilosophy(profile.philosophy || "");
          setLocation(profile.location || "");
          setEmail(profile.email || "");
        }

        if (resume) {
          setCvFileUrl(resume.cvFileUrl || "");
          setResumeSummary(resume.summary || "");
          setExperiences(
            Array.isArray(resume.experienceJson) ? resume.experienceJson : []
          );
          setEducations(
            Array.isArray(resume.educationJson) ? resume.educationJson : []
          );
          setCertifications(
            Array.isArray(resume.certsJson) ? resume.certsJson : []
          );
        }

        if (skillsList) {
          setSkills(skillsList);
        }

        if (socials && Array.isArray(socials)) {
          const map: Record<string, string> = {};
          socials.forEach((s: any) => {
            map[s.platform.toLowerCase()] = s.url;
          });
          setSocialMap((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
        toast.error("Failed to load profile information.");
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, []);

  // Save Profile Handler
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await updateProfileData({
        authorName,
        headline,
        bio,
        philosophy,
        location,
        email,
      });

      if (res.success) {
        toast.success("About Me & Profile details saved successfully!");
      } else {
        toast.error(res.error || "Failed to update profile.");
      }
    } catch (err) {
      toast.error("Error saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save Resume Handler
  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      const res = await updateResumeData({
        cvFileUrl,
        summary: resumeSummary,
        experienceJson: experiences,
        educationJson: educations,
        certsJson: certifications,
      });

      if (res.success) {
        toast.success("Resume & Experience details updated successfully!");
      } else {
        toast.error(res.error || "Failed to update resume.");
      }
    } catch (err) {
      toast.error("Error saving resume.");
    } finally {
      setIsSaving(false);
    }
  };

  // Resume File Upload Handler
  const handleResumeFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.loading("Uploading CV file...", { id: "cv-upload" });
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        setCvFileUrl(data.url);
        toast.success("CV uploaded successfully! Saving database record...", {
          id: "cv-upload",
        });
        await updateResumeData({ cvFileUrl: data.url });
      } else {
        toast.error("Failed to upload CV file.", { id: "cv-upload" });
      }
    } catch (err) {
      toast.error("CV upload failed.", { id: "cv-upload" });
    }
  };

  // Add Skill Handler
  const handleAddSkill = async () => {
    if (!newSkillName.trim()) {
      toast.error("Please enter a skill name.");
      return;
    }

    try {
      const res = await addSkill({
        name: newSkillName.trim(),
        category: newSkillCategory,
        proficiency: newSkillProficiency,
        order: skills.length + 1,
      });

      if (res.success && res.skill) {
        setSkills((prev) => [...prev, res.skill]);
        setNewSkillName("");
        toast.success(`Skill "${newSkillName}" added!`);
      } else {
        toast.error(res.error || "Failed to add skill.");
      }
    } catch (err) {
      toast.error("Error adding skill.");
    }
  };

  // Delete Skill Handler
  const handleDeleteSkill = async (id: string, name: string) => {
    try {
      const res = await deleteSkill(id);
      if (res.success) {
        setSkills((prev) => prev.filter((s) => s.id !== id));
        toast.success(`Skill "${name}" deleted.`);
      } else {
        toast.error(res.error || "Failed to delete skill.");
      }
    } catch (err) {
      toast.error("Error deleting skill.");
    }
  };

  // Save Social Links Handler
  const handleSaveSocials = async () => {
    setIsSaving(true);
    try {
      const res = await updateSocialLinksData(socialMap);
      if (res.success) {
        toast.success("Social Media links updated successfully!");
      } else {
        toast.error(res.error || "Failed to update social links.");
      }
    } catch (err) {
      toast.error("Error saving social links.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="Content Management">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Portfolio Content & Profile Management
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage your About Me bio, CV resume, skills breakdown, and site-wide social channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ● Active & Synchronized
            </span>
          </div>
        </div>

        {/* TAB CONTROL BAR */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all min-h-[40px] ${
              activeTab === "about"
                ? "bg-foreground text-background shadow-xs"
                : "border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <UserCheck className="h-4 w-4" /> About Me & Bio
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resume")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all min-h-[40px] ${
              activeTab === "resume"
                ? "bg-foreground text-background shadow-xs"
                : "border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" /> Resume & CV
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all min-h-[40px] ${
              activeTab === "skills"
                ? "bg-foreground text-background shadow-xs"
                : "border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Code2 className="h-4 w-4" /> Skills & Expertise
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all min-h-[40px] ${
              activeTab === "contact"
                ? "bg-foreground text-background shadow-xs"
                : "border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Share2 className="h-4 w-4" /> Social Links
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">
              Loading content manager...
            </p>
          </div>
        ) : (
          <div>
            {/* TAB 1: ABOUT ME */}
            {activeTab === "about" && (
              <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-indigo-500" /> About Me & Personal Biography
                  </h3>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background shadow-md hover:scale-105 transition-transform min-h-[40px]"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Abonopaya Clement Ayebono"
                      className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Professional Title / Headline *
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Software Engineer • Full-Stack & Mobile Developer"
                      className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Primary Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. abonopayaclementayebono@gmail.com"
                      className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Location / Region
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bolgatanga, Upper East Region, Ghana"
                      className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Biography / About Me Overview
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Comprehensive biography displayed on the About Me page..."
                    className="w-full rounded-xl border border-border/80 bg-background p-4 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden resize-y transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Engineering Philosophy & Career Objective
                  </label>
                  <textarea
                    rows={3}
                    value={philosophy}
                    onChange={(e) => setPhilosophy(e.target.value)}
                    placeholder="Core engineering values, goals, and architectural standards..."
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-hidden resize-y"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: RESUME & CV */}
            {activeTab === "resume" && (
              <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" /> Resume / CV Management
                  </h3>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveResume}
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background shadow-md hover:scale-105 transition-transform min-h-[40px]"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Resume
                  </button>
                </div>

                {/* CV FILE UPLOADER & DOWNLOAD */}
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Curriculum Vitae (PDF Document File)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      ref={resumeFileInputRef}
                      onChange={handleResumeFileUpload}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => resumeFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all min-h-[44px]"
                    >
                      <Upload className="h-4 w-4" /> Upload New CV File
                    </button>

                    {cvFileUrl && (
                      <div className="flex items-center gap-2">
                        <a
                          href={cvFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 min-h-[44px]"
                        >
                          <Download className="h-4 w-4" /> Active CV: {cvFileUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Executive Summary
                  </label>
                  <textarea
                    rows={3}
                    value={resumeSummary}
                    onChange={(e) => setResumeSummary(e.target.value)}
                    placeholder="Short summary displayed at the top of your resume page..."
                    className="w-full rounded-xl border border-border/80 bg-background p-4 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden resize-y transition-colors"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: SKILLS MANAGEMENT */}
            {activeTab === "skills" && (
              <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-indigo-500" /> Skills & Technical Expertise
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add, edit, delete, and group your skills by tech stack categories.
                  </p>
                </div>

                {/* ADD NEW SKILL FORM */}
                <div className="rounded-2xl border border-border/60 bg-accent/40 p-5 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Add New Technical Skill
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <input
                        type="text"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="Skill Name (e.g. Next.js 15)"
                        className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                      />
                    </div>
                    <div>
                      <select
                        value={newSkillCategory}
                        onChange={(e) => setNewSkillCategory(e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                      >
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                        <option value="Mobile Development">Mobile Development</option>
                        <option value="Database">Database</option>
                        <option value="Cloud & Deployment">Cloud & Deployment</option>
                        <option value="Tools">Tools</option>
                        <option value="Programming Languages">
                          Programming Languages
                        </option>
                      </select>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-md hover:scale-105 transition-transform min-h-[44px]"
                      >
                        <Plus className="h-4 w-4" /> Add Skill
                      </button>
                    </div>
                  </div>
                </div>

                {/* ACTIVE SKILLS LIST BY CATEGORIES */}
                <div className="space-y-6 pt-4">
                  {[
                    "Frontend",
                    "Backend",
                    "Mobile Development",
                    "Database",
                    "Cloud & Deployment",
                    "Tools",
                    "Programming Languages",
                  ].map((cat) => {
                    const catSkills = skills.filter((s) => s.category === cat);
                    if (catSkills.length === 0) return null;

                    return (
                      <div key={cat} className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 border-b border-border/60 pb-1">
                          {cat} ({catSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {catSkills.map((sk) => (
                            <span
                              key={sk.id}
                              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs"
                            >
                              <span>{sk.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSkill(sk.id, sk.name)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: SOCIAL LINKS & CONTACT */}
            {activeTab === "contact" && (
              <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-indigo-500" /> Central Social Media & Contact Links
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Manage your public social channels. Changes automatically update the Footer and Contact Page.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveSocials}
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background shadow-md hover:scale-105 transition-transform min-h-[40px]"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Links
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {[
                    { key: "github", label: "GitHub Profile URL", placeholder: "https://github.com/username" },
                    { key: "linkedin", label: "LinkedIn Profile URL", placeholder: "https://linkedin.com/in/username" },
                    { key: "facebook", label: "Facebook Profile URL", placeholder: "https://facebook.com/username" },
                    { key: "instagram", label: "Instagram Profile URL", placeholder: "https://instagram.com/username" },
                    { key: "tiktok", label: "TikTok Profile URL", placeholder: "https://tiktok.com/@username" },
                    { key: "twitter", label: "X / Twitter Profile URL", placeholder: "https://x.com/username" },
                    { key: "whatsapp", label: "WhatsApp Direct URL", placeholder: "https://wa.me/233000000000" },
                    { key: "youtube", label: "YouTube Channel URL", placeholder: "https://youtube.com/@channel" },
                  ].map((soc) => (
                    <div key={soc.key} className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {soc.label}
                      </label>
                      <input
                        type="url"
                        value={socialMap[soc.key] || ""}
                        onChange={(e) =>
                          setSocialMap({ ...socialMap, [soc.key]: e.target.value })
                        }
                        placeholder={soc.placeholder}
                        className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
