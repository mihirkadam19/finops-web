"use client";

import { useState } from "react";
import { encryptCredentials } from "@/lib/secureCredentials";
import { useConnectionsStore } from "@/lib/connectionsStore";


const REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-central-1", "ap-south-1", "ap-southeast-1",
];

interface AwsCredentialsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AwsCredentialsModal({ open, onClose }: AwsCredentialsModalProps) {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCredentials = useConnectionsStore((s) => s.setCredentials);

  if (!open) return null;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const encrypted = await encryptCredentials({ accessKeyId, secretAccessKey, region });

      const response = await fetch("/api/proxy/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedCredentials: encrypted }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error ?? "Invalid credentials");
        return;
      }

      setCredentials("aws", encrypted);
      setAccessKeyId("");
      setSecretAccessKey("");
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
        <h2 className="mb-2 text-2xl font-semibold text-card-foreground">AWS Credentials</h2>
        <p className="mb-6 text-base text-muted-foreground">
          Encrypted end-to-end before leaving your browser.
        </p>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-base font-medium text-card-foreground">
              Access Key ID
            </label>
            <input
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-base text-card-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="AKIA..."
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-card-foreground">
              Secret Access Key
            </label>
            <input
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-base text-card-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••••••••••••••"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-card-foreground">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-base text-card-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-6 py-3 text-base font-medium text-card-foreground hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !accessKeyId || !secretAccessKey}
            className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Validating..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
