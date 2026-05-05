import OpenAI from 'openai';
import { NextRequest } from 'next/server';

async function searchKnowledge(query: string): Promise<{ context: string; count: number }> {
  const endpoint = process.env.AZURE_AI_SEARCH_ENDPOINT?.replace(/\/$/, '');
  const apiKey   = process.env.AZURE_AI_SEARCH_API_KEY;
  const index    = process.env.AZURE_AI_SEARCH_INDEX ?? 'jan-kettler';
  if (!endpoint || !apiKey) return { context: '', count: 0 };

  try {
    const res = await fetch(
      `${endpoint}/indexes/${index}/docs/search?api-version=2024-07-01`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify({ search: query, top: 3, select: 'title,content' }),
      },
    );
    if (!res.ok) return { context: '', count: 0 };
    const data = await res.json();
    const docs = data.value as { title: string; content: string }[];
    return {
      context: docs.map(d => `### ${d.title}\n${d.content}`).join('\n\n'),
      count:   docs.length,
    };
  } catch {
    return { context: '', count: 0 };
  }
}

function getClient() {
  const raw = new URL(process.env.AZURE_AI_FOUNDRY_ENDPOINT!);
  const apiVersion = raw.searchParams.get('api-version') ?? undefined;
  const basePath = raw.pathname.replace(/\/chat\/completions\/?$/, '');
  const baseURL  = `${raw.origin}${basePath}`;
  return new OpenAI({
    apiKey:       process.env.AZURE_AI_FOUNDRY_API_KEY!,
    baseURL,
    defaultQuery: apiVersion ? { 'api-version': apiVersion } : undefined,
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
    return Response.json({ error: `Missing env vars: ${missingVars.join(', ')}` }, { status: 503 });
  }

  const { messages } = await req.json();
  const client   = getClient();
  const encoder  = new TextEncoder();
  const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content ?? '';

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (payload: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      try {
        // ── Step 1: RAG ────────────────────────────────────────────────────
        emit({ type: 'status', step: 'rag_searching' });
        const { context, count } = await searchKnowledge(lastUser);
        emit({ type: 'status', step: 'rag_done', found: count });

        const messagesWithContext = context
          ? messages.map((m: { role: string; content: string }, i: number) =>
              i === messages.length - 1 && m.role === 'user'
                ? { ...m, content: `[KONTEXT – verifizierte Fakten, NUR diese verwenden]\n${context}\n[/KONTEXT]\n\nFrage: ${m.content}` }
                : m
            )
          : messages;

        // ── Step 2: Inference ──────────────────────────────────────────────
        emit({ type: 'status', step: 'generating' });

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
          if (delta) emit({ type: 'text', text: delta });
          if (chunk.usage) {
            inputTokens  = chunk.usage.prompt_tokens;
            outputTokens = chunk.usage.completion_tokens;
          }
        }

        emit({ type: 'done', inputTokens, outputTokens });

      } catch (err) {
        emit({ type: 'error', message: err instanceof Error ? err.message : String(err) });
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
