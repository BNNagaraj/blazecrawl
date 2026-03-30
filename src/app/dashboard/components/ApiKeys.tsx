"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Copy,
  Check,
  Plus,
  ShieldOff,
  Clock,
  AlertCircle,
  Inbox,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  createdAt: string;
  lastUsed: string | null;
  status: "active" | "revoked";
}

function maskKey(key: string): string {
  if (key.length < 12) return key;
  const prefix = key.slice(0, 8);
  const suffix = key.slice(-4);
  return `${prefix}****${suffix}`;
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

export default function ApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // Load keys from Firestore
  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    async function loadKeys() {
      try {
        const keysRef = collection(db, "apiKeys");
        const q = query(keysRef, where("userId", "==", user!.uid));
        const snap = await getDocs(q);
        const items: ApiKeyItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            name: data.name || "Unnamed Key",
            key: d.id,
            maskedKey: maskKey(d.id),
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString().split("T")[0]
              : "-",
            lastUsed: data.lastUsed?.toDate
              ? data.lastUsed.toDate().toISOString().split("T")[0]
              : null,
            status: data.active ? "active" : "revoked",
          });
        });
        setKeys(items);
      } catch {
        // Firestore not available
      }
      setLoading(false);
    }

    loadKeys();
  }, [user]);

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revokeKey = async (id: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k))
    );
    if (db) {
      try {
        await updateDoc(doc(db, "apiKeys", id), { active: false });
      } catch {
        // silent fail
      }
    }
  };

  const generateKey = async () => {
    if (!newKeyName.trim() || !user) return;
    const fullKey = `bc_live_${randomHex(32)}`;

    // Save to Firestore
    if (db) {
      try {
        await setDoc(doc(db, "apiKeys", fullKey), {
          key: fullKey,
          name: newKeyName.trim(),
          userId: user.uid,
          tier: "free",
          active: true,
          createdAt: Timestamp.now(),
          monthlyUsage: 0,
          lifetimeUsage: 0,
          currentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
        });
      } catch {
        // silent fail
      }
    }

    const newKey: ApiKeyItem = {
      id: fullKey,
      name: newKeyName.trim(),
      key: fullKey,
      maskedKey: maskKey(fullKey),
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: null,
      status: "active",
    };
    setKeys((prev) => [newKey, ...prev]);
    setNewlyCreatedKey(fullKey);
    setNewKeyName("");
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="mt-1 text-sm text-muted">
            Manage your API keys for authentication.
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewKeyModal(true);
            setNewlyCreatedKey(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Generate New Key
        </button>
      </div>

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-5">
          {newlyCreatedKey ? (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent">
                <AlertCircle className="h-4 w-4" />
                Save this key now — you won&apos;t see it again.
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-border bg-[#0d1117] px-4 py-2.5 font-mono text-sm text-foreground break-all">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => copyKey("new", newlyCreatedKey)}
                  className="rounded-lg border border-border bg-surface-2 p-2.5 transition-colors hover:bg-surface"
                >
                  {copiedId === "new" ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="mt-3 text-sm text-muted transition-colors hover:text-foreground"
              >
                Done
              </button>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium">Key Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateKey()}
                  placeholder="e.g. Production, Staging..."
                  className="flex-1 rounded-lg border border-border bg-[#0d1117] px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-accent/50"
                />
                <button
                  onClick={generateKey}
                  disabled={!newKeyName.trim()}
                  className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                >
                  Generate
                </button>
                <button
                  onClick={() => {
                    setShowNewKeyModal(false);
                    setNewKeyName("");
                  }}
                  className="rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : keys.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-border p-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-muted/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Generate your first API key to start using the BlazeCrawl API.
            Keys are used to authenticate your requests.
          </p>
          <button
            onClick={() => {
              setShowNewKeyModal(true);
              setNewlyCreatedKey(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Generate Your First Key
          </button>
        </div>
      ) : (
        /* Keys Table */
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-5 py-3.5 font-semibold text-muted">Name</th>
                  <th className="px-5 py-3.5 font-semibold text-muted">Key</th>
                  <th className="px-5 py-3.5 font-semibold text-muted hidden sm:table-cell">
                    Created
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-muted hidden md:table-cell">
                    Last Used
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-muted">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k, i) => (
                  <tr
                    key={k.id}
                    className={`border-b border-border/50 ${
                      i % 2 === 0 ? "bg-surface/30" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-accent/60" />
                        {k.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="rounded bg-surface-2 px-2 py-1 font-mono text-xs text-muted">
                        {k.maskedKey}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-muted hidden sm:table-cell">
                      {k.createdAt}
                    </td>
                    <td className="px-5 py-3.5 text-muted hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {k.lastUsed ?? "Never"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {k.status === "active" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyKey(k.id, k.key)}
                          className="rounded-md border border-border bg-surface-2 p-1.5 transition-colors hover:bg-surface"
                          title="Copy full key"
                        >
                          {copiedId === k.id ? (
                            <Check className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted" />
                          )}
                        </button>
                        {k.status === "active" && (
                          <button
                            onClick={() => revokeKey(k.id)}
                            className="rounded-md border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20"
                            title="Revoke key"
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-muted/60">
            Keys prefixed with <code>bc_live_</code> are production keys.{" "}
            <code>bc_test_</code> keys work in sandbox mode with no usage charges.
          </p>
        </>
      )}
    </div>
  );
}
