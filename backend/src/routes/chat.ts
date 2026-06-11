import { FastifyInstance } from "fastify";
import { chat, type ChatMessage } from "../services/anthropic.js";
import { decryptWithPrivateKey } from "../services/keypair.js";

interface ChatBody {
  messages: ChatMessage[];
  encryptedCredentials: string;
}

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ChatBody }>("/api/chat", async (request, reply) => {
    const { messages, encryptedCredentials } = request.body;

    if (!messages?.length) {
      return reply.status(400).send({ error: "messages are required" });
    }

    if (!encryptedCredentials) {
      return reply.status(400).send({ error: "encryptedCredentials are required" });
    }

    let credentials: { accessKeyId: string; secretAccessKey: string; region: string };
    try {
      const decrypted = decryptWithPrivateKey(encryptedCredentials);
      credentials = JSON.parse(decrypted);
    } catch {
      return reply.status(400).send({ error: "Failed to decrypt credentials" });
    }

    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      return reply.status(400).send({ error: "Invalid AWS credentials" });
    }

    reply.raw.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders();

    try {
      await chat(messages, credentials, (chunk) => {
        reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      });

      reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
      reply.raw.write(
        `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`
      );
    } finally {
      reply.raw.end();
    }
  });
}
