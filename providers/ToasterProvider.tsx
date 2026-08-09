"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function ToasterProvider() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={(theme as "light" | "dark" | "system") || "system"}
      position="bottom-right"
      richColors
      closeButton
    />
  );
}
