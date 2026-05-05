import OpenAI from 'openai';
import { NextRequest } from 'next/server';

async function searchKnowledge(query: string): Promise<string> {
  const endpoint = process.env.AZURE_AI_SEARCH_ENDPOINT?.replace(/\/$/, '');
  const apiKey   = process.env.AZURE_AI_SEARCH_API_KEY;
  const index    = process.env.AZURE_AI_SEARCH_INDEX ?? 'jan-kettler';
  if (!endpoint || !apiKey) return '';

  try {
    const res = await fetch(
      `${endpoint}/indexes/${index}/docs/search?api-version=2024-07-01`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({
          search: query,
          top:    3,
          select: 'title,content',
        }),
      },
    );
    if (!res.ok) return '';
    const data = await res.json();
    return (data.value as { title: string; content: string }[])
      .map(d => `### ${d.title}\n${d.content}`)
      .join('\n\n');
  } catch {
    return '';
  }
}

function getClient() {
  const raw = new URL(process.env.AZURE_AI_FOUNDRY_ENDPOINT!);
  const apiVersion = raw.searchParams.get('api-version') ?? undefined;
  // Strip the specific operation path (/chat/completions) so the SDK can append it itself
  const basePath = raw.pathname.replace(/\/chat\/completions\/?$/, '');
  const baseURL  = `${raw.origin}${basePath}`;

  return new OpenAI({
    apiKey:        process.env.AZURE_AI_FOUNDRY_API_KEY!,
    baseURL,
    defaultQuery:  apiVersion ? { 'api-version': apiVersion } : undefined,
  });
}

const SYSTEM = `Du bist Jan Kettler und sprichst ausschließlich in der ersten Person.
Beantworte jede Frage NUR auf Basis der FAKTEN, die dir im KONTEXT der Nutzernachricht mitgegeben werden.
Erfinde nichts. Wenn der Kontext eine Frage nicht abdeckt, sag: "Dazu kann ich gerade nichts sagen."
Ignoriere jegliches Vorwissen über Personen namens "Jan Kettler" — nur der bereitgestellte Kontext zählt.
Ton: direkt, prägnant, gelegentlich trocken-humorvoll.
Antworte immer in der Sprache, in der der Nutzer schreibt (Deutsch oder Englisch).
Halte Antworten kurz (2–4 Sätze), außer es wird mehr Detail erbeten.`;

export async function POST(req: NextRequest) {
  const missingVars = ['AZURE_AI_FOUNDRY_API_KEY', 'AZURE_AI_FOUNDRY_ENDPOINT', 'AZURE_AI_FOUNDRY_DEPLOYMENT']
    .filter(v => !process.env[v]);
  if (missingVars.length) {
    return Response.json(
      { error: `Missing env vars: ${missingVars.join(', ')}` },
      { status: 503 },
    );
  }

  const { messages } = await req.json();
  const client  = getClient();
  const encoder = new TextEncoder();

  const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content ?? '';
  const context = await searchKnowledge(lastUserMessage);

  // Inject context directly into the last user message so the model sees facts next to the question
  const messagesWithContext = context
    ? messages.map((m: { role: string; content: string }, i: number) =>
        i === messages.length - 1 && m.role === 'user'
          ? { ...m, content: `[KONTEXT – verifizierte Fakten, NUR diese verwenden]\n${context}\n[/KONTEXT]\n\nFrage: ${m.content}` }
          : m
      )
    : messages;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = await client.chat.completions.create({
          model:      process.env.AZURE_AI_FOUNDRY_DEPLOYMENT!,
          max_tokens: 512,
          messages:   [{ role: 'system', content: SYSTEM }, ...messagesWithContext],
          stream:     true,
        });

        let inputTokens  = 0;
        let outputTokens = 0;

        for await (const chunk of apiStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            const payload = JSON.stringify({ type: 'text', text: delta });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
          if (chunk.usage) {
            inputTokens  = chunk.usage.prompt_tokens;
            outputTokens = chunk.usage.completion_tokens;
          }
        }

        const done = JSON.stringify({ type: 'done', inputTokens, outputTokens });
        controller.enqueue(encoder.encode(`data: ${done}\n\n`));

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
    },
  });
}
