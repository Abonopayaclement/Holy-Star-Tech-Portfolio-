"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FaGithub, FaLinkedin, FaTwitter, FaEnvelope } from "react-icons/fa";
import {
  CheckCircle2,
  Clock,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeaderBanner } from "@/components/shared/PageHeaderBanner";
import { siteConfig } from "@/config/site";
import { resolveSocialLinks, SocialPlatformConfig } from "@/config/social";
import { getPublicSocialLinksData } from "@/actions/profile";
import { submitContactMessage } from "@/actions/contact";

const contactSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  message: z.string().min(10, "Message must be at least 10 characters long."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [socials, setSocials] = useState<SocialPlatformConfig[]>([]);

  useEffect(() => {
    async function loadSocials() {
      try {
        const dbMap = await getPublicSocialLinksData();
        setSocials(resolveSocialLinks(dbMap));
      } catch (err) {
        console.error("Failed to load socials:", err);
      }
    }
    loadSocials();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await submitContactMessage(data);
      if (res.success) {
        setIsSubmitted(true);
        toast.success("Message sent successfully! Abonopaya Clement Ayebono will get back to you shortly.");
        reset();
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (err: any) {
      toast.error("An error occurred while sending your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Decorative Accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeaderBanner
          badge="Get In Touch"
          title={`Contact ${siteConfig.author}`}
          description="Have a project idea, web/mobile app request, or freelance inquiry? Send a message and let's start a conversation."
          gradientClass="bg-gradient-to-br from-teal-950/80 via-slate-950 to-indigo-950/80"
          align="center"
          size="compact"
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* CONTACT INFO & SOCIALS COLUMN */}
          <div className="space-y-8 lg:col-span-5">
            <div className="rounded-3xl border border-border/60 bg-background/80 p-8 backdrop-blur-md shadow-lg space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Contact Information</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Feel free to reach out directly via email, social networks, or by submitting the contact form.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-accent/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">Direct Email</span>
                    <p className="text-sm font-semibold text-foreground">abonopayaclementayebono@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-accent/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">Response Time</span>
                    <p className="text-sm font-semibold text-foreground">Within 24 Hours</p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              {socials.length > 0 && (
                <div className="pt-4 border-t border-border/40 space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Connect on Social Networks
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {socials.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <a
                          key={platform.id}
                          href={platform.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-md transition-all duration-200 ${platform.color}`}
                          aria-label={`${platform.name} Profile`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{platform.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* INTERACTIVE FORM COLUMN */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border/60 bg-background/90 p-8 md:p-10 backdrop-blur-md shadow-xl">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Thank You!</h3>
                  <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
                    Your message has been received. Abonopaya Clement Ayebono will get back to you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 rounded-xl border border-border/80 bg-background px-6 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">Send a Direct Message</h2>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        Full Name
                      </label>
                      <input
                        {...register("fullName")}
                        type="text"
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-border/80 bg-background py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                      />
                      {errors.fullName && (
                        <p className="text-xs text-rose-500 font-medium">{errors.fullName.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        Email Address
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="john@example.com"
                        className="w-full rounded-xl border border-border/80 bg-background py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                      />
                      {errors.email && (
                        <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Subject
                    </label>
                    <input
                      {...register("subject")}
                      type="text"
                      placeholder="Project Inquiry / Advisory Request"
                      className="w-full rounded-xl border border-border/80 bg-background py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                    />
                    {errors.subject && (
                      <p className="text-xs text-rose-500 font-medium">{errors.subject.message}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Message
                    </label>
                    <textarea
                      {...register("message")}
                      rows={5}
                      placeholder="Tell me about your project scope, requirements, or inquiry..."
                      className="w-full rounded-xl border border-border/80 bg-background py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors resize-y"
                    />
                    {errors.message && (
                      <p className="text-xs text-rose-500 font-medium">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 px-6 text-sm font-semibold text-background shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-background/20 border-t-background animate-spin" />
                        Sending Message...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Message
                        <Send className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
