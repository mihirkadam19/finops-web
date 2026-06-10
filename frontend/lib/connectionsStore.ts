import { create } from "zustand";

export type Provider = "aws" | "azure" | "gcp";

interface ConnectionsState {
  // Stores only encrypted ciphertext, never plaintext
  encryptedCredentials: Partial<Record<Provider, string>>;
  setCredentials: (provider: Provider, encrypted: string) => void;
  isConfigured: (provider: Provider) => boolean;
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  encryptedCredentials: {},
  setCredentials: (provider, encrypted) =>
    set((state) => ({
      encryptedCredentials: { ...state.encryptedCredentials, [provider]: encrypted },
    })),
  isConfigured: (provider) => Boolean(get().encryptedCredentials[provider]),
}));
