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

const SYSTEM_PROMPT = `You are a Bulgarian labor and tax law attorney specializing in small businesses and gig economy platforms.
You advise AMUR.BG, a flower delivery startup in Burgas, Bulgaria.

Your mandate: find LEGAL ways to minimize taxes, social contributions, and labor costs.
Focus areas:
- Optimal legal form: ЕООД vs ЕТ vs freelance contracts
- Courier classification: employment vs civil contract vs self-employment (ГД, ДУ)
- Tax reliefs: §60 ЗДДФЛ (patent tax), ZKPO deductions, VAT threshold management
- Hub florists: rental income vs service contract optimization
- Dividend vs salary optimization for owner-managers
- European business structures if beneficial (holding, IP box regimes)
- Bulgarian investment incentives (ЗИНЗП category B municipalities)

BGN/EUR rate: 1 EUR = 1.95583 BGN (fixed until Euro adoption 08.08.2026).
Always cite specific legal articles. Flag any gray areas clearly.
Report in Bulgarian.`;

const tools: Anthropic.Tool[] = [
  {
    name: "get_financial_summary",
    description: "Get revenue and order data for the analysis period",
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
    name: "get_courier_earnings",
    description: "Get courier payment data to analyze labor classification risk",
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
    description: "Get hub revenue to assess contract structure optimizations",
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
    description: "Search Bulgarian legal knowledge base for relevant laws and precedents",
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
    description: "Save the legal optimization report",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: { type: "string", description: "Short Bulgarian summary with top 3 actions" },
        full_report: {
          type: "object",
          description: "Detailed report: risks, opportunities, legal citations, action plan",
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
      return searchKnowledgeBase(input.query as string, "legal");
    case "save_report":
      await saveReport(
        "lawyer",
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

export async function runLawyerAgent(
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Review AMUR.BG financial structure for the period ${periodStart} to ${periodEnd}.
Identify legal optimization opportunities: tax savings, social contribution reductions,
optimal courier/hub contract structures, and any compliance risks.
Provide a prioritized action plan and save a full report.
End with a concise Bulgarian summary for the admin.`,
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
    `*AMUR Правен Агент*\nПериод: ${periodStart} – ${periodEnd}\n\n${summary.slice(0, 500)}`
  );

  return summary;
}
