import { FastifyInstance } from "fastify";
import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

interface CredentialsBody {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export async function credentialsRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CredentialsBody }>("/api/validate-credentials", async (request, reply) => {
    const { accessKeyId, secretAccessKey, region } = request.body;

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
}
