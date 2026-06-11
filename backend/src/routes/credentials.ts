import { FastifyInstance } from "fastify";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { ClientSecretCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";
import { decryptWithPrivateKey } from "../services/keypair.js";

interface CredentialsBody {
  encryptedCredentials: string;
}

export async function credentialsRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CredentialsBody }>("/api/validate-credentials", async (request, reply) => {
    const { encryptedCredentials } = request.body;

    if (!encryptedCredentials) {
      return reply.status(400).send({ error: "encryptedCredentials is required" });
    }

    let accessKeyId: string, secretAccessKey: string, region: string;
    try {
      const decrypted = decryptWithPrivateKey(encryptedCredentials);
      ({ accessKeyId, secretAccessKey, region } = JSON.parse(decrypted));
    } catch {
      return reply.status(400).send({ error: "Failed to decrypt credentials" });
    }

    if (!accessKeyId || !secretAccessKey) {
      return reply.status(400).send({ error: "Access key and secret are required" });
    }

    try {
      const client = new CostExplorerClient({
        region: region ?? "us-east-1",
        credentials: { accessKeyId, secretAccessKey },
      });

      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 1);

      await client.send(
        new GetCostAndUsageCommand({
          TimePeriod: {
            Start: start.toISOString().split("T")[0]!,
            End: end.toISOString().split("T")[0]!,
          },
          Granularity: "DAILY",
          Metrics: ["BlendedCost"],
        })
      );

      return reply.send({ valid: true });
    } catch (error) {
      return reply.status(401).send({
        valid: false,
        error: error instanceof Error ? error.message : "Invalid credentials",
      });
    }
  });

  fastify.post<{ Body: CredentialsBody }>("/api/validate-azure-credentials", async (request, reply) => {
    const { encryptedCredentials } = request.body;

    if (!encryptedCredentials) {
      return reply.status(400).send({ error: "encryptedCredentials is required" });
    }

    let tenantId: string, clientId: string, clientSecret: string, subscriptionId: string;
    try {
      const decrypted = decryptWithPrivateKey(encryptedCredentials);
      ({ tenantId, clientId, clientSecret, subscriptionId } = JSON.parse(decrypted));
    } catch {
      return reply.status(400).send({ error: "Failed to decrypt credentials" });
    }

    if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
      return reply.status(400).send({ error: "All Azure credential fields are required" });
    }

    try {
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const client = new ResourceManagementClient(credential, subscriptionId);

      // Lightweight check: list resource groups (requires only Reader role,
      // works regardless of Cost Management API availability)
      const iterator = client.resourceGroups.list();
      await iterator.next();

      return reply.send({ valid: true });
    } catch (error) {
      return reply.status(401).send({
        valid: false,
        error: error instanceof Error ? error.message : "Invalid Azure credentials",
      });
    }
  });
}
