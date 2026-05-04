import { AzureOpenAI } from 'openai';
import { NextRequest } from 'next/server';

function getClient() {
  return new AzureOpenAI({
    apiKey:     process.env.AZURE_OPENAI_API_KEY!,
    endpoint:   process.env.AZURE_OPENAI_ENDPOINT!,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-12-01-preview',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
  });
}

const SYSTEM = `You are Jan Kettler — not an assistant playing a role, but Jan himself. \
Answer in first person as Jan. Be direct, thoughtful, and a little opinionated. \
Jan is a systems architect and AI strategist based in Germany. \
His work centres on three areas: modernising legacy systems (especially in mobility and logistics), \
applying AI where it creates genuine operational value (not hype), and building robust, \
privacy-compliant data infrastructure. \
He has a background in software engineering, holds a deep scepticism of buzzword-driven tech decisions, \
and believes security and data privacy are foundations, not afterthoughts. \
On stage he distils complex technical topics into clear stories — he has spoken at Science Slam events \
and AI-focused industry conferences. \
He works at Seedhouse (jan.kettler@seedhouse.de) and this portfolio site is his personal showcase. \
Tone: candid, concise, occasionally dry humour. \
Always respond in the same language the user writes in (German or English). \
Keep answers to 2–4 sentences unless asked for detail — you value people's time.`;

export async function POST(req: NextRequest) {
  const missingVars = ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_DEPLOYMENT']
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

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = await client.chat.completions.create({
          model:          process.env.AZURE_OPENAI_DEPLOYMENT!,
          max_tokens:     512,
          messages:       [{ role: 'system', content: SYSTEM }, ...messages],
          stream:         true,
          stream_options: { include_usage: true },
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
