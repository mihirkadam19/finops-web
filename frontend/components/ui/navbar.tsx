"use client";

import { useRouter } from "next/navigation";
import { HomeIcon, PlusIcon, LogOutIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface NavbarProps {
  onNewChat?: () => void;
}

export function Navbar({ onNewChat }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <HomeIcon className="size-4" />
          Home
        </button>
      </div>

      <div className="flex items-center gap-2">
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PlusIcon className="size-4" />
            New Chat
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOutIcon className="size-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
