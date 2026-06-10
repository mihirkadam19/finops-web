import { useState } from "react";
import { CredentialsForm } from "./components/CredentialsForm";
import { useFinOpsChat } from "./lib/useFinOpsChat";
import { MessageContent } from "./components/MessageContent";

function App() {
  const [encryptedCredentials, setEncryptedCredentials] = useState<string | null>(null);
  const { messages, sendMessage, isStreaming } = useFinOpsChat(encryptedCredentials);
  const [input, setInput] = useState("");

  if (!encryptedCredentials) {
    return <CredentialsForm onValidated={setEncryptedCredentials} />;
  }

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Cloud FinOps Analyst</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-gray-400">
              Ask about your AWS costs, idle resources, anomalies, or tagging compliance.
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-900"
                }`}
              >
                {msg.content ? <MessageContent content={msg.content} /> : (isStreaming && i === messages.length - 1 ? "..." : "")}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your AWS costs..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
