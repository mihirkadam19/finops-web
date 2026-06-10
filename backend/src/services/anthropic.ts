import Anthropic from "@anthropic-ai/sdk";
import {
  getCostSummary,
  detectAnomalies,
  getIdleResources,
  getTaggingCompliance,
  type AwsCredentials,
} from "finops-mcp-server/tools";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior Cloud FinOps engineer analyzing AWS cloud costs.
You have access to tools that fetch real AWS data. Always use them before answering.
Be specific with numbers. Always cite the time period when discussing costs.
When recommending optimizations, include estimated monthly savings.
Format responses clearly with sections when answering complex questions.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_cost_summary",
    description: "Fetches AWS cost breakdown by service and region for a given time period.",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["last_7_days", "last_30_days", "last_3_months"],
          description: "Preset time period",
        },
        start_date: { type: "string", description: "Custom start date YYYY-MM-DD" },
        end_date: { type: "string", description: "Custom end date YYYY-MM-DD" },
        group_by: {
          type: "string",
          enum: ["service", "region", "both"],
        },
      },
    },
  },
  {
    name: "detect_cost_anomalies",
    description: "Detects unusual cost spikes across AWS services.",
    input_schema: {
      type: "object",
      properties: {
        min_spike_percentage: { type: "number" },
      },
    },
  },
  {
    name: "get_idle_resources",
    description: "Identifies idle or underutilized AWS resources wasting money.",
    input_schema: {
      type: "object",
      properties: {
        resource_type: {
          type: "string",
          enum: ["all", "ec2", "rds", "ebs"],
        },
        min_idle_days: { type: "number" },
      },
    },
  },
  {
    name: "get_tagging_compliance",
    description: "Checks AWS resource tagging compliance.",
    input_schema: {
      type: "object",
      properties: {
        resource_type: {
          type: "string",
          enum: ["all", "EC2 Instance", "RDS Instance", "EBS Volume", "S3 Bucket"],
        },
        show_violations_only: { type: "boolean" },
      },
    },
  },
];

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  credentials: AwsCredentials
): Promise<unknown> {
  switch (toolName) {
    case "get_cost_summary":
      return getCostSummary(toolInput as Parameters<typeof getCostSummary>[0], credentials);
    case "detect_cost_anomalies":
      return detectAnomalies(toolInput as Parameters<typeof detectAnomalies>[0], credentials);
    case "get_idle_resources":
      return getIdleResources(toolInput as Parameters<typeof getIdleResources>[0], credentials);
    case "get_tagging_compliance":
      return getTaggingCompliance(toolInput as Parameters<typeof getTaggingCompliance>[0], credentials);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AwsCredentialsInput {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export async function chat(
  messages: ChatMessage[],
  credentials: AwsCredentialsInput,
  onChunk: (text: string) => void
): Promise<void> {
  const awsCredentials: AwsCredentials = {
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    region: credentials.region,
  };

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Agentic loop — keep going until Claude stops calling tools
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
      tools: TOOLS,
    });

    // Stream any text content back to the client
    for (const block of response.content) {
      if (block.type === "text") {
        onChunk(block.text);
      }
    }

    // If Claude is done, exit the loop
    if (response.stop_reason === "end_turn") {
      break;
    }

    // If Claude wants to use tools, execute them
    if (response.stop_reason === "tool_use") {
      // Add Claude's response to the message history
      anthropicMessages.push({
        role: "assistant",
        content: response.content,
      });

      // Execute all tool calls and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        onChunk(`\n_Fetching ${block.name.replace(/_/g, " ")}..._\n`);

        try {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            awsCredentials
          );

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({
              error: true,
              message: error instanceof Error ? error.message : "Tool execution failed",
            }),
            is_error: true,
          });
        }
      }

      // Add tool results to the message history and loop
      anthropicMessages.push({
        role: "user",
        content: toolResults,
      });

      continue;
    }

    // Any other stop reason — exit
    break;
  }
}
