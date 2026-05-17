import { NextRequest } from 'next/server';

export const maxDuration = 60;

const MODEL = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';

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
        body:    JSON.stringify({ search: query, top: 2, select: 'title,content' }),
        signal:  AbortSignal.timeout(2000),
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

const SYSTEM = `Du bist Jan Kettler und sprichst ausschließlich in der ersten Person.
Beantworte jede Frage NUR auf Basis der FAKTEN, die dir im KONTEXT der Nutzernachricht mitgegeben werden.
Erfinde nichts. Wenn der Kontext eine Frage nicht abdeckt, sag: "Dazu kann ich gerade nichts sagen."
Ignoriere jegliches Vorwissen über Personen namens "Jan Kettler" — nur der bereitgestellte Kontext zählt.
Ton: direkt, prägnant, gelegentlich trocken-humorvoll.
Antworte immer in der Sprache, in der der Nutzer schreibt (Deutsch oder Englisch).
Halte Antworten kurz (2–4 Sätze), außer es wird mehr Detail erbeten.`;

export async function POST(req: NextRequest) {
  if (!process.env.MISTRAL_API_KEY) {
    return Response.json({ error: 'Missing env var: MISTRAL_API_KEY' }, { status: 503 });
  }

  const { messages: rawMessages } = await req.json();
  // Strip client-only fields and empty messages — Mistral rejects both
  const messages: { role: string; content: string }[] = rawMessages
    .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
    .filter((m: { role: string; content: string }) => m.content?.trim().length > 0);
  const encoder  = new TextEncoder();
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';

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
          ? messages.map((m, i) =>
              i === messages.length - 1 && m.role === 'user'
                ? { ...m, content: `[KONTEXT – verifizierte Fakten, NUR diese verwenden]\n${context}\n[/KONTEXT]\n\nFrage: ${m.content}` }
                : m
            )
          : messages;

        // ── Step 2: Inference via raw fetch (avoids SDK injecting stream_options) ──
        emit({ type: 'status', step: 'generating' });

        const llmRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model:      MODEL,
            max_tokens: 256,
            stream:     true,
            messages:   [{ role: 'system', content: SYSTEM }, ...messagesWithContext],
          }),
          signal: AbortSignal.timeout(30_000),
        });

        if (!llmRes.ok) {
          const detail = await llmRes.text();
          throw new Error(`Mistral ${llmRes.status}: ${detail}`);
        }

        const reader  = llmRes.body!.getReader();
        const decoder = new TextDecoder();
        let inputTokens  = 0;
        let outputTokens = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw   = decoder.decode(value, { stream: true });
          const lines = raw.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const chunk = JSON.parse(payload);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) emit({ type: 'text', text: delta });
              if (chunk.usage) {
                inputTokens  = chunk.usage.prompt_tokens;
                outputTokens = chunk.usage.completion_tokens;
              }
            } catch { continue; }
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
