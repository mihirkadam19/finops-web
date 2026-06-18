"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProviderTile } from "@/components/connections/ProviderTile";
import { AwsCredentialsModal } from "@/components/connections/AwsCredentialsModal";
import { AzureCredentialsModal } from "@/components/connections/AzureCredentialsModal";
import { useConnectionsStore } from "@/lib/connectionsStore";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const [awsModalOpen, setAwsModalOpen] = useState(false);
  const [azureModalOpen, setAzureModalOpen] = useState(false);
  const router = useRouter();
  const isConfigured = useConnectionsStore((s) => s.isConfigured);
  const encryptedCredentials = useConnectionsStore((s) => s.encryptedCredentials);
  void encryptedCredentials;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-background p-8">
      <button
        onClick={handleSignOut}
        className="absolute right-6 top-6 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        Sign out
      </button>
      <h1 className="text-4xl font-semibold text-foreground">Cloud FinOps Analyst</h1>
      <p className="text-base text-muted-foreground">Connect a cloud provider to get started</p>

      <div className="flex gap-8">
        <ProviderTile
          name="AWS"
          configured={isConfigured("aws")}
          onClick={() => setAwsModalOpen(true)}
        />
        <ProviderTile
          name="Azure"
          configured={isConfigured("azure")}
          onClick={() => setAzureModalOpen(true)}
        />
        <ProviderTile name="GCP" configured={isConfigured("gcp")} onClick={() => {}} />
      </div>

      {(isConfigured("aws") || isConfigured("azure")) && (
        <button
          onClick={() => router.push("/chat")}
          className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
        >
          Continue to Chat
        </button>
      )}

      <AwsCredentialsModal open={awsModalOpen} onClose={() => setAwsModalOpen(false)} />
      <AzureCredentialsModal open={azureModalOpen} onClose={() => setAzureModalOpen(false)} />
    </main>
  );
}
