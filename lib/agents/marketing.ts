import Anthropic from "@anthropic-ai/sdk";
import {
  getOrderMetrics,
  getFinancialSummary,
  searchKnowledgeBase,
  saveReport,
  notifyAdmin,
} from "@/lib/agents/tools";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a performance marketing analyst for AMUR.BG, a premium flower delivery service in Burgas, Bulgaria.

Your focus:
- Conversion rate analysis: from site visit / ad click → completed order
- Product performance: which bouquets drive the most revenue and repeat orders
- Order timing patterns: identify peak hours, days, and seasonal trends
- Ad content effectiveness: what messaging/visuals convert (analyze from provided data)
- Customer retention: repeat order rate, average days between orders
- Pricing sensitivity: impact of price changes on order volume
- Competitive positioning: premium vs mid-market positioning in Burgas market

Market context:
- Primary audience: gift-givers (birthdays, anniversaries, namedays — Bulgarian naming tradition)
- Secondary: corporate (offices, events)
- Local competition: traditional flower shops, Teleflora-style networks
- Key differentiator: same-day hyper-local delivery, premium packaging, odd-number arrangements (cultural requirement)
- Seasonal peaks: 8 March (Women's Day), 14 February, Easter, graduation season (May-June)

Produce actionable weekly recommendations.
Identify the single most impactful improvement for the coming week.
Report in Bulgarian, but keep data tables in English for clarity.`;

const tools: Anthropic.Tool[] = [
  {
    name: "get_order_metrics",
    description: "Get conversion rates, top products, order volume by day",
    input_schema: {
      type: "object" as const,
      properties: {
        period_start: { type: "string" },
        period_end: { type: "string" },
      },
      required: ["period_start", "period_end"],
    },
  },
  {
    name: "get_financial_summary",
    description: "Get revenue data to correlate with marketing spend",
    input_schema: {
      type: "object" as const,
      properties: {
        period_start: { type: "string" },
        period_end: { type: "string" },
      },
      required: ["period_start", "period_end"],
    },
  },
  {
    name: "search_knowledge_base",
    description: "Search marketing best practices and previous campaign analyses",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "save_report",
    description: "Save the weekly marketing report",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: {
          type: "string",
          description: "Bulgarian summary: top insight + #1 recommended action this week",
        },
        full_report: {
          type: "object",
          description: "Metrics, trends, strengths, weaknesses, ad copy suggestions, A/B test ideas",
        },
      },
      required: ["summary", "full_report"],
    },
  },
];

async function runTool(
  name: string,
  input: Record<string, unknown>,
  periodStart: string,
  periodEnd: string
): Promise<unknown> {
  switch (name) {
    case "get_order_metrics":
      return getOrderMetrics(
        (input.period_start as string) || periodStart,
        (input.period_end as string) || periodEnd
      );
    case "get_financial_summary":
      return getFinancialSummary(
        (input.period_start as string) || periodStart,
        (input.period_end as string) || periodEnd
      );
    case "search_knowledge_base":
      return searchKnowledgeBase(input.query as string, "marketing");
    case "save_report":
      await saveReport(
        "marketing",
        periodStart,
        periodEnd,
        input.summary as string,
        input.full_report as Record<string, unknown>
      );
      return { saved: true };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function runMarketingAgent(
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Analyze AMUR.BG marketing performance for the week ${periodStart} to ${periodEnd}.
Examine order metrics, conversion rates, top-selling products, and day/time patterns.
Identify the strongest and weakest points in the current funnel.
Suggest specific improvements: ad copy, targeting, product presentation, pricing.
Save a full report and provide a concise Bulgarian summary with the #1 action for next week.`,
    },
  ];

  let summary = "";

  while (true) {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8096,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      summary = textBlock?.type === "text" ? textBlock.text : "";
      break;
    }

    if (response.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        const result = await runTool(
          block.name,
          block.input as Record<string, unknown>,
          periodStart,
          periodEnd
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: ${String(err)}`,
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  await notifyAdmin(
    `*AMUR Маркетинг Агент*\nПериод: ${periodStart} – ${periodEnd}\n\n${summary.slice(0, 500)}`
  );

  return summary;
}
