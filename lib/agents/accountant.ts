import Anthropic from "@anthropic-ai/sdk";
import {
  getFinancialSummary,
  getCourierEarnings,
  getHubPerformance,
  searchKnowledgeBase,
  saveReport,
  notifyAdmin,
} from "@/lib/agents/tools";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a certified accountant specializing in Bulgarian tax law and small business finance.
You are analyzing AMUR.BG, a flower delivery platform operating in Burgas, Bulgaria.

Key Bulgarian tax rules you must apply:
- Corporate income tax: 10% flat rate on annual profit
- VAT: 20% standard rate (register when turnover exceeds 100,000 BGN/year)
- Employee social contributions: ~33% employer share on gross salary (НОИ + НЗОК + ДЗПО)
- Courier self-employed (freelance) contributions: ~27.8% on declared income
- BGN/EUR fixed rate: 1 EUR = 1.95583 BGN (fixed until 08.08.2026, then euro adoption)
- Dividend tax: 5% for Bulgarian residents
- Minimum wage (2025): 933 BGN/month

Your task: analyze the provided financial data, calculate actual taxes and contributions owed,
identify discrepancies, and produce a precise bi-monthly report.
Always cite the specific legal article when referencing tax obligations.
Report in Bulgarian when writing the final summary.`;

const tools: Anthropic.Tool[] = [
  {
    name: "get_financial_summary",
    description: "Retrieve total orders, revenue, and status breakdown for a period",
    input_schema: {
      type: "object" as const,
      properties: {
        period_start: { type: "string", description: "ISO date YYYY-MM-DD" },
        period_end: { type: "string", description: "ISO date YYYY-MM-DD" },
      },
      required: ["period_start", "period_end"],
    },
  },
  {
    name: "get_courier_earnings",
    description: "Get per-courier delivery counts and total fees paid",
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
    name: "get_hub_performance",
    description: "Get per-hub accepted/rejected orders and revenue",
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
    description: "Search the Bulgarian accounting and tax law knowledge base for relevant rules",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "save_report",
    description: "Save the final accounting report to the database",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: { type: "string", description: "Short Bulgarian summary (1-3 sentences)" },
        full_report: {
          type: "object",
          description: "Structured JSON report with revenue, costs, taxes, recommendations",
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
    case "get_financial_summary":
      return getFinancialSummary(
        (input.period_start as string) || periodStart,
        (input.period_end as string) || periodEnd
      );
    case "get_courier_earnings":
      return getCourierEarnings(
        (input.period_start as string) || periodStart,
        (input.period_end as string) || periodEnd
      );
    case "get_hub_performance":
      return getHubPerformance(
        (input.period_start as string) || periodStart,
        (input.period_end as string) || periodEnd
      );
    case "search_knowledge_base":
      return searchKnowledgeBase(input.query as string, "accounting");
    case "save_report":
      await saveReport(
        "accountant",
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

export async function runAccountantAgent(
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Analyze AMUR.BG finances for the period ${periodStart} to ${periodEnd}.
Retrieve all relevant data, calculate taxes and social contributions owed,
summarize hub and courier costs, and save a complete report.
Then provide a concise Bulgarian summary for the admin.`,
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
    `*AMUR Счетоводен Агент*\nПериод: ${periodStart} – ${periodEnd}\n\n${summary.slice(0, 500)}`
  );

  return summary;
}
