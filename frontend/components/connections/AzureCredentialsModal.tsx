"use client";

import { useState } from "react";
import { encryptCredentials } from "@/lib/secureCredentials";
import { useConnectionsStore } from "@/lib/connectionsStore";

interface AzureCredentialsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AzureCredentialsModal({ open, onClose }: AzureCredentialsModalProps) {
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCredentials = useConnectionsStore((s) => s.setCredentials);

  if (!open) return null;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const encrypted = await encryptCredentials({
        tenantId,
        clientId,
        clientSecret,
        subscriptionId,
      });

      const response = await fetch("/api/proxy/validate-azure-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedCredentials: encrypted }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error ?? "Invalid credentials");
        return;
      }

      setCredentials("azure", encrypted);
      setTenantId("");
      setClientId("");
      setClientSecret("");
      setSubscriptionId("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save credentials");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-card p-8 shadow-xl">
        <h2 className="mb-2 text-2xl font-semibold text-card-foreground">Azure Credentials</h2>
        <p className="mb-6 text-base text-muted-foreground">
          Encrypted end-to-end before leaving your browser.
        </p>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-base font-medium text-card-foreground">
              Tenant ID
            </label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-base text-card-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-card-foreground">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-base text-card-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-card-foreground">
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-base text-card-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••••••••••••••"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-card-foreground">
              Subscription ID
            </label>
            <input
              type="text"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-base text-card-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-6 py-3 text-base font-medium text-card-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !tenantId || !clientId || !clientSecret || !subscriptionId}
            className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
