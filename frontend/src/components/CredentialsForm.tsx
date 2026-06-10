import { useState } from "react";
import { encryptCredentials } from "../lib/secureCredentials";

interface CredentialsFormProps {
  onValidated: (encryptedCredentials: string) => void;
}

const BACKEND_URL = "http://localhost:3001";

export function CredentialsForm({ onValidated }: CredentialsFormProps) {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    try {
      const encrypted = await encryptCredentials({ accessKeyId, secretAccessKey, region });

      const response = await fetch(`${BACKEND_URL}/api/validate-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedCredentials: encrypted }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error ?? "Invalid credentials");
        return;
      }

      onValidated(encrypted);
      setAccessKeyId("");
      setSecretAccessKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          Cloud FinOps Analyst
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Enter your AWS credentials to get started. Credentials are encrypted
          end-to-end with the server's public key and only decrypted server-side.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Access Key ID
            </label>
            <input
              type="text"
              required
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="AKIA..."
              autoComplete="off"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Secret Access Key
            </label>
            <input
              type="password"
              required
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••••••••••••••"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="us-east-1">us-east-1</option>
              <option value="us-east-2">us-east-2</option>
              <option value="us-west-1">us-west-1</option>
              <option value="us-west-2">us-west-2</option>
              <option value="eu-west-1">eu-west-1</option>
              <option value="eu-central-1">eu-central-1</option>
              <option value="ap-south-1">ap-south-1</option>
              <option value="ap-southeast-1">ap-southeast-1</option>
            </select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isValidating ? "Validating..." : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
