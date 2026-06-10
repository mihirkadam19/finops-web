"use client";

import { useRouter } from "next/navigation";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { useFinOpsRuntime } from "@/lib/useFinOpsRuntime";
import { useConnectionsStore } from "@/lib/connectionsStore";

export default function ChatPage() {
  const router = useRouter();
  const isConfigured = useConnectionsStore((s) => s.isConfigured("aws"));
  const runtime = useFinOpsRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="relative h-screen">
        <Thread />

        {!isConfigured && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl bg-card p-8 text-center shadow-xl">
              <h2 className="mb-2 text-xl font-semibold text-card-foreground">
                AWS credentials required
              </h2>
              <p className="mb-6 text-base text-muted-foreground">
                Connect your AWS account before starting a chat.
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </AssistantRuntimeProvider>
  );
}
