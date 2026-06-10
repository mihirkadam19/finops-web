"use client";

interface ProviderTileProps {
  name: string;
  configured: boolean;
  onClick: () => void;
}

export function ProviderTile({ name, configured, onClick }: ProviderTileProps) {
  return (
    <button
      onClick={onClick}
      className={`flex h-48 w-56 flex-col items-center justify-center gap-3 rounded-xl border text-base font-medium transition-colors ${
        configured
          ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
          : "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
      }`}
    >
      <span className="text-2xl font-semibold">{name}</span>
      <span className="text-sm opacity-70">
        {configured ? "Connected" : "Not connected"}
      </span>
    </button>
  );
}
