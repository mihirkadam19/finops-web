import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyRequest, FastifyReply } from "fastify";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.FRONTEND_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
  },
});

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

declare module "fastify" {
  interface FastifyRequest {
    session: Session;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const internalSecret = request.headers["x-internal-secret"];
  if (internalSecret && internalSecret === process.env.INTERNAL_SECRET) {
    return;
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    await reply.status(401).send({ error: "Unauthorized" });
    return;
  }

  request.session = session;
}
