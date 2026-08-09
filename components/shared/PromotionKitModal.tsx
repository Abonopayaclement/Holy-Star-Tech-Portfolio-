"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  ExternalLink,
  Share2,
  X,
} from "lucide-react";
import {
  FaFacebook,
  FaLinkedin,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";

interface PromotionKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  url: string;
  image?: string;
}

export function PromotionKitModal({
  isOpen,
  onClose,
  title,
  excerpt,
  url,
  image,
}: PromotionKitModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  if (!isOpen) return null;

  const captionText = `🚀 New Article: "${title}"\n\n${excerpt}\n\nRead the full post here: ${url}\n\n#HolyStarTech #SoftwareArchitecture #WebDev #Engineering`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Article link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(true);
    toast.success("Promotional caption copied to clipboard!");
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  // Social Share URLs
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(captionText);

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Social Promotion Kit
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Share & promote your article across social networks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ARTICLE PREVIEW CARD */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 space-y-3">
            {image && (
              <div className="h-32 w-full overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {title}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                {excerpt}
              </p>
            </div>
          </div>

          {/* ONE-CLICK COPY BUTTONS */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all min-h-[44px]"
            >
              {copiedLink ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copiedLink ? "Link Copied!" : "Copy Article Link"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCaption}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all min-h-[44px]"
            >
              {copiedCaption ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copiedCaption ? "Caption Copied!" : "Copy Promo Caption"}</span>
            </button>
          </div>

          {/* PROMOTIONAL CAPTION BOX */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Formatted Promo Caption
            </label>
            <textarea
              rows={4}
              readOnly
              value={captionText}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3.5 text-xs font-mono leading-relaxed text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
            />
          </div>

          {/* INSTANT SHARE BUTTONS */}
          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Instant 1-Click Social Sharing
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all min-h-[40px]"
              >
                <FaWhatsapp className="h-4 w-4" /> WhatsApp
              </a>

              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all min-h-[40px]"
              >
                <FaFacebook className="h-4 w-4" /> Facebook
              </a>

              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-all min-h-[40px]"
              >
                <FaLinkedin className="h-4 w-4" /> LinkedIn
              </a>

              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-all min-h-[40px]"
              >
                <FaTwitter className="h-4 w-4" /> X (Twitter)
              </a>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-end border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Close Kit
          </button>
        </div>
      </div>
    </div>
  );
}
