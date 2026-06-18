"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { Navbar } from "@/components/ui/navbar";
import { useFinOpsRuntime } from "@/lib/useFinOpsRuntime";
import { useConnectionsStore } from "@/lib/connectionsStore";

function ChatContent() {
  const runtime = useFinOpsRuntime();
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [chatKey, setChatKey] = useState(0);
  const isConfigured = useConnectionsStore((s) => s.isConfigured("aws") || s.isConfigured("azure"));

  return (
    <div className="flex h-screen flex-col">
      <Navbar onNewChat={() => setChatKey((k) => k + 1)} />

      <div className="relative flex-1 overflow-hidden">
        <ChatContent key={chatKey} />

        {!isConfigured && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl bg-card p-8 text-center shadow-xl">
              <h2 className="mb-2 text-xl font-semibold text-card-foreground">
                Cloud credentials required
              </h2>
              <p className="mb-6 text-base text-muted-foreground">
                Connect an AWS or Azure account before starting a chat.
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
    </div>
  );
}
