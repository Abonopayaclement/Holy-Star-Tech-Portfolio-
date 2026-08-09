"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, Lock, Mail, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { prepareAdminUser, resetAdminUser } from "@/actions/admin-auth";
import { Logo } from "@/components/shared/Logo";
import { siteConfig } from "@/config/site";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid administrator email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function PrivateLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { data: session, isPending } = authClient.useSession();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  // If user is already authenticated, automatically redirect to /private dashboard
  useEffect(() => {
    if (session?.user) {
      const searchParams = new URLSearchParams(window.location.search);
      const from = searchParams.get("from") || "/private";
      window.location.href = from;
    }
  }, [session]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    const email = values.email.trim().toLowerCase();
    const password = values.password;

    try {
      // 1. Remove raw unhashed legacy database user if present
      await prepareAdminUser(email);

      // 2. Attempt sign-in via Better Auth API endpoint
      const signInRes = await authClient.signIn.email({
        email,
        password,
      });

      if (!signInRes.error) {
        toast.success("Administrator authentication successful!");
        const searchParams = new URLSearchParams(window.location.search);
        const from = searchParams.get("from") || "/private";
        setTimeout(() => {
          window.location.href = from;
        }, 200);
        return;
      }

      // 3. Fallback: Perform initial sign-up via Better Auth API endpoint
      let signUpRes = await authClient.signUp.email({
        email,
        password,
        name: siteConfig.author,
      });

      // 4. If sign-up fails because user already exists (out-of-sync password), reset account record & re-register
      if (signUpRes.error) {
        await resetAdminUser(email);
        signUpRes = await authClient.signUp.email({
          email,
          password,
          name: siteConfig.author,
        });
      }

      if (signUpRes.error) {
        const errorMsg =
          signInRes.error?.message ||
          signUpRes.error?.message ||
          "Invalid administrator email or master password.";
        setAuthError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      toast.success("Administrator account registered & authenticated!");
      const searchParams = new URLSearchParams(window.location.search);
      const from = searchParams.get("from") || "/private";
      setTimeout(() => {
        window.location.href = from;
      }, 200);
    } catch (err) {
      console.error("Authentication error:", err);
      const msg = "An unexpected error occurred during sign in. Please try again.";
      setAuthError(msg);
      toast.error(msg);
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border/60 bg-card p-8 md:p-10 backdrop-blur-md shadow-2xl">
        {/* BACK TO PREVIOUS PAGE BUTTON */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-95 min-h-[38px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Previous Page</span>
          </button>
          <span className="text-[11px] font-mono text-muted-foreground">Admin Gateway</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <Logo showText={false} />
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-indigo-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Private Admin Gateway</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-foreground">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Owner: {siteConfig.author}
          </p>
        </div>

        {authError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-center text-xs font-semibold text-rose-500">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                {...register("email")}
                type="email"
                placeholder="abonopayaclementayebono@gmail.com"
                className="w-full rounded-xl border border-border/80 bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Master Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-border/80 bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 px-6 text-sm font-semibold text-background shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-background/20 border-t-background animate-spin" />
                Authenticating...
              </span>
            ) : (
              <span>Sign In to Private Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
