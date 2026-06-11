import { FastifyInstance } from "fastify";
import { chat, type ChatMessage, type AwsCredentialsInput, type AzureCredentialsInput } from "../services/anthropic.js";
import { decryptWithPrivateKey } from "../services/keypair.js";

interface ChatBody {
  messages: ChatMessage[];
  encryptedCredentials?: string;
  encryptedAzureCredentials?: string;
}

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ChatBody }>("/api/chat", async (request, reply) => {
    const { messages, encryptedCredentials, encryptedAzureCredentials } = request.body;

    if (!messages?.length) {
      return reply.status(400).send({ error: "messages are required" });
    }

    if (!encryptedCredentials && !encryptedAzureCredentials) {
      return reply.status(400).send({ error: "AWS or Azure credentials are required" });
    }

    let awsCredentials: AwsCredentialsInput | undefined;
    if (encryptedCredentials) {
      try {
        const decrypted = decryptWithPrivateKey(encryptedCredentials);
        awsCredentials = JSON.parse(decrypted);
      } catch {
        return reply.status(400).send({ error: "Failed to decrypt AWS credentials" });
      }

      if (!awsCredentials?.accessKeyId || !awsCredentials?.secretAccessKey) {
        return reply.status(400).send({ error: "Invalid AWS credentials" });
      }
    }

    let azureCredentials: AzureCredentialsInput | undefined;
    if (encryptedAzureCredentials) {
      try {
        const decrypted = decryptWithPrivateKey(encryptedAzureCredentials);
        azureCredentials = JSON.parse(decrypted);
      } catch {
        return reply.status(400).send({ error: "Failed to decrypt Azure credentials" });
      }
    }

    reply.raw.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders();

    try {
      await chat(messages, (chunk) => {
        reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }, awsCredentials, azureCredentials);

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
