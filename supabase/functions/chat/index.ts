import { createClient } from "@supabase/supabase-js";
import { CoreMessage, streamText } from "ai";
import { codeBlock } from "common-tags";
import { LangChainAdapter } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Create an openai instance
const openai = createOpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

// Extract Supabase secrets
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

// Open up CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Automatically returns response if method is options
  if (req.method === "OPTIONS") {
    console.log("OPTIONS RECEIVED");
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: "Missing environment variables.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const authorization = req.headers.get("Authorization");

  if (!authorization) {
    return new Response(
      JSON.stringify({ error: `No authorization header passed` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Creates a supabase instance
  console.log("Creating a Supabase instance");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        authorization,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  
  const fullRequest = await req.json()
  console.log("Full Request: ", fullRequest)
  
  const { id: chatId, messages, embedding } = fullRequest;


  // Perform the embedding similarity search

  const { data: documents, error: matchError } = await supabase
    .rpc("match_document_sections", {
      embedding,
      match_threshold: 0.5
    })
    .select("content")
    .limit(5);

  console.log("SUCCESSFULLY PERFORMED SIMILARITY SEARCH");
  console.log("RETRIEVED DOCUMENTS: ", documents);


  if (matchError) {
    console.error(matchError);
    return new Response(
      JSON.stringify({
        error: "There was an error reading your documents, please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const injectedDocs =
    documents && documents.length > 0
      ? documents.map(({ content }) => content).join("\n\n")
      : "No documents found";

  console.log("INJECTED DOCUMENTS", injectedDocs)

  const completionMessages: CoreMessage[] = [
    {
      role: "user",
      content: codeBlock`
          You're an AI assistant who answers questions about documents.

          You're a chat bot, so keep your replies succinct.

          You're only allowed to use the documents below to answer the question.

          If the question isn't related to these documents, say:
          "Sorry, I couldn't find any information on that."

          If the information isn't available in the below documents, say:
          "Sorry, I couldn't find any information on that."

          Do not go off topic.

          Documents:
          ${injectedDocs}
        `,
    },
    ...messages,
  ];

  console.log(JSON.stringify(completionMessages));

  const stream = streamText({
    model: openai("gpt-3.5-turbo"),
    messages: completionMessages,
    temperature: 0,
    maxTokens: 1024,
    headers: corsHeaders
  });

  // Convert the stream to response and add CORS headers
  const streamResponse = await stream.toDataStreamResponse();

  // Create a new response with the same body but with CORS headers
  const responseWithCors = new Response(streamResponse.body, {
    status: streamResponse.status,
    statusText: streamResponse.statusText,
    headers: {...corsHeaders}
    // headers: new Headers([
    //   ...Array.from(streamResponse.headers.entries()),
    //   ...Object.entries(corsHeaders),
    // ]),
  });

  return responseWithCors;
});
