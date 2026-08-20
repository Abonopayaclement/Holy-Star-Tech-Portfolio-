"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Ignore private admin dashboard routes and API calls
    if (!pathname || pathname.startsWith("/private") || pathname.startsWith("/api")) {
      return;
    }

    // Only record ONE visit per site session (when user first lands on the website)
    try {
      if (sessionStorage.getItem("ht_tracked_session")) {
        return;
      }
      sessionStorage.setItem("ht_tracked_session", "true");
    } catch {
      // Ignore storage errors
    }

    const timer = setTimeout(() => {
      try {
        // Anonymized Visitor ID
        let vid = localStorage.getItem("ht_vid");
        if (!vid) {
          vid = "v_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
          localStorage.setItem("ht_vid", vid);
        }

        const userAgent = navigator.userAgent || "";
        const width = window.innerWidth;

        // Device Category
        let device = "Desktop";
        if (width < 640 || /Mobi|Android|iPhone|iPod/i.test(userAgent)) {
          device = "Mobile";
        } else if ((width >= 640 && width < 1024) || /Tablet|iPad/i.test(userAgent)) {
          device = "Tablet";
        }

        // Browser Detection
        let browser = "Chrome";
        if (/Edg/i.test(userAgent)) browser = "Edge";
        else if (/Chrome/i.test(userAgent)) browser = "Chrome";
        else if (/Safari/i.test(userAgent)) browser = "Safari";
        else if (/Firefox/i.test(userAgent)) browser = "Firefox";
        else if (/Opera|OPR/i.test(userAgent)) browser = "Opera";

        // OS Detection
        let os = "Windows";
        if (/Win/i.test(userAgent)) os = "Windows";
        else if (/Mac/i.test(userAgent)) os = "macOS";
        else if (/Android/i.test(userAgent)) os = "Android";
        else if (/iPhone|iPad|iPod/i.test(userAgent)) os = "iOS";
        else if (/Linux/i.test(userAgent)) os = "Linux";

        const referrer = document.referrer ? new URL(document.referrer).hostname : "Direct";

        const payload = JSON.stringify({
          visitorId: vid,
          path: pathname,
          device,
          browser,
          os,
          referrer,
        });

        // Non-blocking Beacon API with fetch fallback
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/analytics/track", blob);
        } else {
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Silent failure so user navigation is never affected
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
