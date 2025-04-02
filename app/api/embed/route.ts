import { createClient } from "@/utils/supabase/server";
import OpenAI from "openai";


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  console.log("TRIGGERING POST REQUEST");

  const supabase = await createClient();

  console.log(supabase);

  // Pass a specific document to convert embeddings
  const { document_id } = await req.json();

  // selects all rows where the embedding is null
  const { data: rows, error: selectError } = await supabase
    .from("document_sections")
    .select(`id, content`)
    .is("embedding", null)
    .eq("document_id", document_id)


  if (selectError) {
    return new Response(selectError.message, { status: 500 });
  }

  for (const row of rows) {
    const { id, ["content"]: content } = row;

    if (!content) {
      console.error(`No content available in column content'`);
      continue;
    }

    try {
      const response = await client.embeddings.create({
        input: content,
        model: "text-embedding-3-small",
      });

      // Update the database with the embedding
      const { error } = await supabase
        .from("document_sections")
        .update({
          ["embedding"]: response.data[0].embedding,
        })
        .eq("id", id);

      if (error) {
        console.error(
          `Failed to save embedding on document_sections table with id ${id}`
        );
      }
    } catch (error) {
      console.error(`Error generating embedding for id ${id}:`, error);
    }
  }

  return new Response("Success!", { status: 200 });
}
