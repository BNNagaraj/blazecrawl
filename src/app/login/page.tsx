"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/* ------------------------------------------------------------------ */
/*  TOAST                                                              */
/* ------------------------------------------------------------------ */
type ToastType = "error" | "success";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm animate-fade-up ${
            t.type === "error"
              ? "border-red-500/30 bg-red-950/80 text-red-200"
              : "border-green-500/30 bg-green-950/80 text-green-200"
          }`}
        >
          {t.type === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
          )}
          <p className="text-sm leading-relaxed">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 shrink-0 text-current opacity-60 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GOOGLE ICON SVG                                                    */
/* ------------------------------------------------------------------ */
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  GITHUB ICON SVG                                                    */
/* ------------------------------------------------------------------ */
function GithubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  LOGIN PAGE                                                         */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* Form fields */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ---- Toast helpers ---- */
  function addToast(type: ToastType, message: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismissToast(id), 5000);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function firebaseErrorMessage(code: string): string {
    const map: Record<string, string> = {
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/popup-closed-by-user": "Sign-in popup was closed.",
      "auth/invalid-credential": "Invalid email or password.",
    };
    return map[code] || "Something went wrong. Please try again.";
  }

  /* ---- Auth helpers ---- */
  function requireAuth(): boolean {
    if (!auth) {
      addToast("error", "Firebase is not configured. Please set up environment variables.");
      return false;
    }
    return true;
  }

  async function withAuthLoading(fn: () => Promise<void>) {
    setLoading(true);
    try {
      await fn();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      addToast("error", firebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  /* ---- Auth handlers ---- */
  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth()) return;
    await withAuthLoading(async () => {
      if (tab === "signup") {
        const cred = await createUserWithEmailAndPassword(auth!, email, password);
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
        addToast("success", "Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth!, email, password);
        addToast("success", "Welcome back!");
      }
      router.push("/dashboard");
    });
  }

  async function handleForgotPassword() {
    if (!requireAuth()) return;
    if (!email.trim()) {
      addToast("error", "Please enter your email address first.");
      return;
    }
    await withAuthLoading(async () => {
      await sendPasswordResetEmail(auth!, email);
      addToast("success", "Password reset email sent! Check your inbox.");
    });
  }

  async function handleSocialSignIn(provider: GoogleAuthProvider | GithubAuthProvider, label: string) {
    if (!requireAuth()) return;
    await withAuthLoading(async () => {
      await signInWithPopup(auth!, provider);
      addToast("success", `Signed in with ${label}!`);
      router.push("/dashboard");
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[160px]" />

      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 grid-bg" />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Flame className="h-8 w-8 text-accent" />
            <span>
              Blaze<span className="text-accent">Crawl</span>
            </span>
          </a>
          <p className="text-sm text-muted">
            {tab === "signin"
              ? "Welcome back. Sign in to continue."
              : "Create your free account."}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface/80 p-8 backdrop-blur-sm">
          {/* Tab toggle */}
          <div className="mb-6 flex rounded-xl bg-background/60 p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-surface-2 text-foreground shadow-sm"
                    : "text-muted hover:text-foreground/80"
                }`}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Name field (sign up only) */}
            {tab === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Full Name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-border/60 bg-background/60 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-border/60 bg-background/60 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border/60 bg-background/60 py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            {tab === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tab === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs text-muted">or continue with</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Social buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSocialSignIn(new GoogleAuthProvider(), "Google")}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-background/60 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              onClick={() => handleSocialSignIn(new GithubAuthProvider(), "GitHub")}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-background/60 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GithubIcon />
              GitHub
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted/70 leading-relaxed">
          By signing up, you agree to our{" "}
          <a href="/docs" className="text-muted hover:text-foreground underline underline-offset-2 transition-colors">
            Terms
          </a>{" "}
          and{" "}
          <a href="/docs" className="text-muted hover:text-foreground underline underline-offset-2 transition-colors">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
