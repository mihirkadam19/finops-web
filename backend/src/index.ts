import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { chatRoutes } from "./routes/chat.js";
import { credentialsRoutes } from "./routes/credentials.js";
import { publicKeyRoutes } from "./routes/publicKey.js";

async function main() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, { origin: "http://localhost:3000" });
  await fastify.register(helmet, { contentSecurityPolicy: false });

  await fastify.register(chatRoutes);
  await fastify.register(credentialsRoutes);
  await fastify.register(publicKeyRoutes);

  fastify.get("/health", async () => ({ status: "ok" }));

  try {
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Backend running on http://localhost:3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
