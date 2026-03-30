"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
  Key,
  FlaskConical,
  BarChart3,
  BookOpen,
  ExternalLink,
  Menu,
  X,
  Zap,
  Globe,
  Activity,
  ChevronRight,
  Inbox,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import ApiKeys from "./components/ApiKeys";
import Playground from "./components/Playground";
import Usage from "./components/Usage";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Section = "overview" | "api-keys" | "playground" | "usage" | "docs";

const TIER_MAP: Record<string, { name: string; credits: number }> = {
  free:       { name: "Free",       credits: 500       },
  hobby:      { name: "Hobby",      credits: 3000      },
  standard:   { name: "Standard",   credits: 100000    },
  growth:     { name: "Growth",     credits: 500000    },
  scale:      { name: "Scale",      credits: 1000000   },
  enterprise: { name: "Enterprise", credits: Infinity   },
};

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
  external?: boolean;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "playground", label: "Playground", icon: FlaskConical },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "docs", label: "Docs", icon: BookOpen, external: true },
];

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/60 p-5 transition-all hover:border-accent/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-4 w-4 text-accent" />
        </div>
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview Section                                                   */
/* ------------------------------------------------------------------ */
interface ActivityItem {
  id: string;
  type: string;
  url: string;
  status: "success" | "failed";
  time: string;
  duration: string;
}

interface OverviewStats {
  totalApiCalls: number;
  creditsUsed: number;
  creditsRemaining: number;
  activeKeys: number;
  tierName: string;
  creditsTotal: number;
}

function Overview({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats>({
    totalApiCalls: 0,
    creditsUsed: 0,
    creditsRemaining: 0,
    activeKeys: 0,
    tierName: "Free",
    creditsTotal: 500,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setLoaded(true);
      return;
    }

    async function loadData() {
      try {
        const keysRef = collection(db, "apiKeys");
        const keysQ = query(keysRef, where("userId", "==", user!.uid));
        const keysSnap = await getDocs(keysQ);

        let creditsUsed = 0;
        let activeKeys = 0;
        let tier = "free";
        const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

        keysSnap.forEach((d) => {
          const data = d.data();
          tier = data.tier || "free";
          if (data.currentMonth === month) {
            creditsUsed += data.monthlyUsage || 0;
          }
          if (data.active) activeKeys++;
        });

        const tierInfo = TIER_MAP[tier] || TIER_MAP.free;
        const creditsTotal = tierInfo.credits;
        const creditsRemaining = isFinite(creditsTotal) ? creditsTotal - creditsUsed : Infinity;

        // Count total API calls from activity collection
        let totalApiCalls = 0;
        try {
          const actRef = collection(db, "activity");
          const actCountQ = query(actRef, where("userId", "==", user!.uid));
          const actCountSnap = await getDocs(actCountQ);
          totalApiCalls = actCountSnap.size;
        } catch {
          // activity collection may not exist
          // fallback to lifetime usage from keys
          keysSnap.forEach((d) => {
            totalApiCalls += d.data().lifetimeUsage || 0;
          });
        }

        setStats({
          totalApiCalls,
          creditsUsed,
          creditsRemaining: isFinite(creditsRemaining) ? creditsRemaining : 0,
          activeKeys,
          tierName: tierInfo.name,
          creditsTotal,
        });

        // Load recent activity
        const activityRef = collection(db, "activity");
        const actQ = query(
          activityRef,
          where("userId", "==", user!.uid),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        try {
          const actSnap = await getDocs(actQ);
          const items: ActivityItem[] = [];
          actSnap.forEach((d) => {
            const data = d.data();
            items.push({
              id: d.id,
              type: data.type || "scrape",
              url: data.url || "",
              status: data.success ? "success" : "failed",
              duration: data.duration ? `${data.duration}ms` : "-",
              time: data.createdAt?.toDate
                ? formatTimeAgo(data.createdAt.toDate())
                : "-",
            });
          });
          setActivity(items);
        } catch {
          // Activity collection may not exist yet — that's fine
        }
      } catch {
        // Firestore may not be accessible yet
      }
      setLoaded(true);
    }

    loadData();
  }, [user]);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Welcome back, {displayName}
          <span className="text-accent">.</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s what&apos;s happening with your BlazeCrawl account.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Total API Calls"
          value={stats.totalApiCalls.toLocaleString()}
          sub={stats.totalApiCalls === 0 ? "Make your first API call!" : "From activity log"}
          icon={Globe}
        />
        <StatCard
          label="Credits Used"
          value={stats.creditsUsed.toLocaleString()}
          sub="This month"
          icon={Activity}
        />
        <StatCard
          label="Credits Remaining"
          value={
            isFinite(stats.creditsTotal)
              ? stats.creditsRemaining.toLocaleString()
              : "Unlimited"
          }
          sub={
            isFinite(stats.creditsTotal)
              ? `of ${stats.creditsTotal.toLocaleString()} total`
              : `${stats.tierName} plan`
          }
          icon={Zap}
        />
        <StatCard
          label="API Keys Active"
          value={String(stats.activeKeys)}
          sub={stats.activeKeys === 0 ? "Create your first key" : `${stats.activeKeys} key${stats.activeKeys > 1 ? "s" : ""} active`}
          icon={Key}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <button
          onClick={() => onNavigate("api-keys")}
          className="group flex items-center gap-3 rounded-xl border border-border/60 bg-surface/60 p-4 text-left transition-all hover:border-accent/40 hover:bg-surface"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
            <Key className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold">New API Key</span>
            <p className="text-xs text-muted">Generate a new key</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted transition-colors group-hover:text-accent" />
        </button>

        <button
          onClick={() => onNavigate("docs")}
          className="group flex items-center gap-3 rounded-xl border border-border/60 bg-surface/60 p-4 text-left transition-all hover:border-accent/40 hover:bg-surface"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
            <BookOpen className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold">View Docs</span>
            <p className="text-xs text-muted">API reference & guides</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted transition-colors group-hover:text-accent" />
        </button>

        <button
          onClick={() => onNavigate("playground")}
          className="group flex items-center gap-3 rounded-xl border border-border/60 bg-surface/60 p-4 text-left transition-all hover:border-accent/40 hover:bg-surface"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
            <FlaskConical className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold">Test API</span>
            <p className="text-xs text-muted">Open the Playground</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted transition-colors group-hover:text-accent" />
        </button>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3.5">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
          <span className="text-xs text-muted">Last 24 hours</span>
        </div>
        {!loaded ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-10 w-10 text-muted/40 mb-3" />
            <p className="text-sm font-medium text-muted">No activity yet</p>
            <p className="text-xs text-muted/60 mt-1">
              Your API calls will appear here once you start scraping.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="px-5 py-3 font-semibold text-muted">Type</th>
                <th className="px-5 py-3 font-semibold text-muted">URL</th>
                <th className="px-5 py-3 font-semibold text-muted hidden sm:table-cell">
                  Status
                </th>
                <th className="px-5 py-3 font-semibold text-muted hidden md:table-cell">
                  Duration
                </th>
                <th className="px-5 py-3 font-semibold text-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item, i) => (
                <tr
                  key={item.id}
                  className={`border-b border-border/50 ${
                    i % 2 === 0 ? "bg-surface/30" : ""
                  }`}
                >
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium capitalize text-muted">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground/80 max-w-[200px] truncate">
                    {item.url}
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    {item.status === "success" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted hidden md:table-cell">
                    {item.duration}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Docs placeholder                                                   */
/* ------------------------------------------------------------------ */
function DocsRedirect() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen className="h-12 w-12 text-accent mb-4" />
      <h2 className="text-xl font-bold mb-2">Documentation</h2>
      <p className="text-sm text-muted mb-6 max-w-md">
        Full API reference, SDK guides, and examples.
      </p>
      <a
        href="/docs"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        <ExternalLink className="h-4 w-4" />
        Open Documentation
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Page                                                     */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tierName, setTierName] = useState("Free");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load user tier for sidebar badge
  useEffect(() => {
    if (!user || !db) return;
    async function loadTier() {
      try {
        const keysRef = collection(db, "apiKeys");
        const q = query(keysRef, where("userId", "==", user!.uid));
        const snap = await getDocs(q);
        let tier = "free";
        snap.forEach((d) => {
          const data = d.data();
          if (data.tier) tier = data.tier;
        });
        const info = TIER_MAP[tier] || TIER_MAP.free;
        setTierName(info.name);
      } catch {
        // silent
      }
    }
    loadTier();
  }, [user]);

  const renderContent = () => {
    switch (section) {
      case "overview":
        return <Overview onNavigate={setSection} />;
      case "api-keys":
        return <ApiKeys />;
      case "playground":
        return <Playground />;
      case "usage":
        return <Usage />;
      case "docs":
        return <DocsRedirect />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface/80 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Flame className="h-6 w-6 text-accent" />
            <span>
              Blaze<span className="text-accent">Crawl</span>
            </span>
          </a>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-md p-1 text-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = section === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                    {item.external && (
                      <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom — user info */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold">{tierName} Plan</span>
            </div>
            <p className="text-[10px] text-muted truncate">
              {user?.email || "Not signed in"}
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-md p-1.5 text-muted hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold capitalize">
              {section === "api-keys" ? "API Keys" : section}
            </h1>
          </div>
          <a
            href="/"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Back to Home
          </a>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
}
