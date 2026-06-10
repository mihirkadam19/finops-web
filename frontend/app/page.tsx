"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProviderTile } from "@/components/connections/ProviderTile";
import { AwsCredentialsModal } from "@/components/connections/AwsCredentialsModal";
import { useConnectionsStore } from "@/lib/connectionsStore";

export default function Home() {
  const [awsModalOpen, setAwsModalOpen] = useState(false);
  const router = useRouter();
  const isConfigured = useConnectionsStore((s) => s.isConfigured);
  const encryptedCredentials = useConnectionsStore((s) => s.encryptedCredentials);
  void encryptedCredentials;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-background p-8">
      <h1 className="text-4xl font-semibold text-foreground">Cloud FinOps Analyst</h1>
      <p className="text-base text-muted-foreground">Connect a cloud provider to get started</p>

      <div className="flex gap-8">
        <ProviderTile
          name="AWS"
          configured={isConfigured("aws")}
          onClick={() => setAwsModalOpen(true)}
        />
        <ProviderTile name="Azure" configured={isConfigured("azure")} onClick={() => {}} />
        <ProviderTile name="GCP" configured={isConfigured("gcp")} onClick={() => {}} />
      </div>

      {isConfigured("aws") && (
        <button
          onClick={() => router.push("/chat")}
          className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
        >
          Continue to Chat
        </button>
      )}

      <AwsCredentialsModal open={awsModalOpen} onClose={() => setAwsModalOpen(false)} />
    </main>
  );
}
