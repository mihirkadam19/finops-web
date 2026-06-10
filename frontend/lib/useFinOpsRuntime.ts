"use client";

import { useState, useCallback, useRef } from "react";
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
} from "@assistant-ui/react";
import { useConnectionsStore } from "./connectionsStore";

const BACKEND_URL = "http://localhost:3001";

interface InternalMessage {
  role: "user" | "assistant";
  content: string;
}

function convertMessage(msg: InternalMessage): ThreadMessageLike {
  return {
    role: msg.role,
    content: [{ type: "text", text: msg.content }],
  };
}

export function useFinOpsRuntime() {
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const messagesRef = useRef<InternalMessage[]>([]);
  messagesRef.current = messages;

  const encryptedCredentials = useConnectionsStore((s) => s.encryptedCredentials.aws);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (!encryptedCredentials) {
        throw new Error("Connect AWS credentials first");
      }

      const textContent = message.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("");

      const userMessage: InternalMessage = { role: "user", content: textContent };
      const newMessages = [...messagesRef.current, userMessage];
      setMessages(newMessages);
      setIsRunning(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages, encryptedCredentials }),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: `Error: ${data.error}`,
                };
                return updated;
              });
              continue;
            }

            if (data.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: last.content + data.text,
                };
                return updated;
              });
            }
          }
        }
      } finally {
        setIsRunning(false);
      }
    },
    [encryptedCredentials]
  );

  return useExternalStoreRuntime({
    isRunning,
    messages,
    setMessages: () => {},
    convertMessage,
    onNew,
  });
}
