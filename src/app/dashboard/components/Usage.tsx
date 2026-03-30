"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Zap,
  Inbox,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

interface PlanInfo {
  name: string;
  price: string;
  creditsTotal: number;
  creditsUsed: number;
  concurrent: number;
  tierKey: string;
}

const TIER_INFO: Record<string, { name: string; price: string; credits: number; concurrent: number }> = {
  free:       { name: "Free",       price: "$0",      credits: 500,       concurrent: 2   },
  hobby:      { name: "Hobby",      price: "$16/mo",  credits: 3000,      concurrent: 5   },
  standard:   { name: "Standard",   price: "$83/mo",  credits: 100000,    concurrent: 50  },
  growth:     { name: "Growth",     price: "$333/mo", credits: 500000,    concurrent: 100 },
  scale:      { name: "Scale",      price: "$599/mo", credits: 1000000,   concurrent: 150 },
  enterprise: { name: "Enterprise", price: "Custom",  credits: Infinity,  concurrent: 500 },
};

const UPGRADE_PATH: Record<string, string> = {
  free: "hobby",
  hobby: "standard",
  standard: "growth",
  growth: "scale",
  scale: "enterprise",
};

export default function Usage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanInfo>({
    name: "Free",
    price: "$0",
    creditsTotal: 500,
    creditsUsed: 0,
    concurrent: 2,
    tierKey: "free",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    async function loadUsage() {
      try {
        const keysRef = collection(db, "apiKeys");
        const q = query(keysRef, where("userId", "==", user!.uid));
        const snap = await getDocs(q);

        let creditsUsed = 0;
        let tier = "free";
        const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

        snap.forEach((d) => {
          const data = d.data();
          tier = data.tier || "free";
          if (data.currentMonth === month) {
            creditsUsed += data.monthlyUsage || 0;
          }
        });

        const tierInfo = TIER_INFO[tier] || TIER_INFO.free;
        setPlan({
          name: tierInfo.name,
          price: tierInfo.price,
          creditsTotal: tierInfo.credits,
          creditsUsed,
          concurrent: tierInfo.concurrent,
          tierKey: tier,
        });
      } catch {
        // Firestore not available
      }
      setLoading(false);
    }

    loadUsage();
  }, [user]);

  const isUnlimited = !isFinite(plan.creditsTotal);
  const usedPct = isUnlimited
    ? 0
    : plan.creditsTotal > 0
      ? Math.round((plan.creditsUsed / plan.creditsTotal) * 100)
      : 0;
  const remaining = isUnlimited ? Infinity : plan.creditsTotal - plan.creditsUsed;
  const nextTier = UPGRADE_PATH[plan.tierKey];
  const nextTierInfo = nextTier ? TIER_INFO[nextTier] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Usage</h2>
        <p className="mt-1 text-sm text-muted">
          Monitor your API usage and credit consumption.
        </p>
      </div>

      {/* Top Row: Plan + Credits */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Plan Card */}
        <div className="rounded-xl border border-border bg-surface/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <CreditCard className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Current Plan</h3>
                <p className="text-xs text-muted">Resets monthly</p>
              </div>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
              {plan.name}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold">{plan.price}</span>
            <span className="text-sm text-muted">
              {isUnlimited ? "Unlimited pages/mo" : `${plan.creditsTotal.toLocaleString()} pages/mo`}
            </span>
          </div>
          <p className="text-xs text-muted mb-4">
            {plan.concurrent} concurrent requests
          </p>
          <button className="w-full rounded-lg border border-border bg-surface-2 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface">
            Manage Subscription
          </button>
        </div>

        {/* Credits Card */}
        <div className="rounded-xl border border-border bg-surface/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Credits This Month</h3>
              <p className="text-xs text-muted">
                {isUnlimited ? "Unlimited remaining" : `${remaining.toLocaleString()} remaining`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted">
                {plan.creditsUsed.toLocaleString()} used
              </span>
              <span className="font-semibold text-accent">
                {isUnlimited ? "Unlimited" : `${usedPct}%`}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-amber-400 transition-all duration-500"
                style={{ width: isUnlimited ? "100%" : `${usedPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted mt-3">
            <span>
              {isUnlimited ? "Unlimited" : `${plan.creditsTotal.toLocaleString()}`} total credits
            </span>
            <span>Overage: $0.001/page</span>
          </div>

          {nextTierInfo && (
            <button className="mt-4 w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover">
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpRight className="h-4 w-4" />
                Upgrade to {nextTierInfo.name} ({nextTierInfo.price})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Usage Summary */}
      {plan.creditsUsed === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-muted/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No usage yet</h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Start making API calls to see your usage stats here.
            Try the Playground to make your first scrape!
          </p>
        </div>
      ) : (
        <>
          {/* Usage Chart placeholder */}
          <div className="rounded-xl border border-border bg-surface/60 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-semibold">Usage Summary</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-surface-2 p-4">
                <p className="text-xs text-muted mb-1">Pages Used This Month</p>
                <p className="text-2xl font-extrabold">{plan.creditsUsed.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-4">
                <p className="text-xs text-muted mb-1">Remaining Credits</p>
                <p className="text-2xl font-extrabold">{remaining.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* API Breakdown */}
          <div className="rounded-xl border border-border bg-surface/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-semibold">Plan Details</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Plan</span>
                <span className="font-medium">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Monthly Limit</span>
                <span className="font-medium">
                  {isUnlimited ? "Unlimited" : `${plan.creditsTotal.toLocaleString()} pages`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Used</span>
                <span className="font-medium">{plan.creditsUsed.toLocaleString()} pages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Concurrent Requests</span>
                <span className="font-medium">{plan.concurrent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Credits Rollover</span>
                <span className="font-medium text-green-400">Yes — never expire</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
