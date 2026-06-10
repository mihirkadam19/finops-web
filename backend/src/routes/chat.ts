import { FastifyInstance } from "fastify";
import { chat, type ChatMessage, type AwsCredentialsInput } from "../services/anthropic.js";

interface ChatBody {
  messages: ChatMessage[];
  credentials: AwsCredentialsInput;
}

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ChatBody }>("/api/chat", async (request, reply) => {
    const { messages, credentials } = request.body;

    if (!messages?.length) {
      return reply.status(400).send({ error: "messages are required" });
    }

    if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
      return reply.status(400).send({ error: "AWS credentials are required" });
    }

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
