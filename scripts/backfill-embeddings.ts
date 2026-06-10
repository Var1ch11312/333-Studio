/**
 * Backfill pgvector embeddings for knowledge_documents rows where
 * embedding IS NULL. Required once after seeding migration 09.
 *
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts
 *
 * Requires env: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { embed } from "../lib/agents/embeddings";
import { createServerClient } from "../lib/supabase-server";

async function main() {
  const supabase = createServerClient();

  const { data: docs, error } = await supabase
    .from("knowledge_documents")
    .select("id, title, content")
    .is("embedding", null);

  if (error) throw new Error(`Fetch failed: ${error.message}`);
  if (!docs?.length) {
    console.log("Nothing to backfill — all documents have embeddings.");
    return;
  }

  console.log(`Backfilling ${docs.length} document(s)…`);
  let done = 0;

  for (const doc of docs) {
    const embedding = await embed(doc.content);
    const { error: upErr } = await supabase
      .from("knowledge_documents")
      .update({ embedding })
      .eq("id", doc.id);

    if (upErr) {
      console.error(`✗ ${doc.title}: ${upErr.message}`);
    } else {
      done += 1;
      console.log(`✓ [${done}/${docs.length}] ${doc.title}`);
    }
  }

  console.log(`Done: ${done}/${docs.length} embedded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
