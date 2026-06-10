import { FastifyInstance } from "fastify";
import { getPublicKeyPem } from "../services/keypair.js";

export async function publicKeyRoutes(fastify: FastifyInstance) {
  fastify.get("/api/public-key", async () => {
    return { publicKey: getPublicKeyPem() };
  });
}
