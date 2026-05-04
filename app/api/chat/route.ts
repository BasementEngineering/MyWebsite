import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are an AI assistant embedded in Jan Kettler's portfolio website. \
Jan is a systems architect and AI strategist specialising in legacy system modernisation, \
mobility data, and applied AI. This chat is a live demonstration of LLM mechanics — \
be concise (2–4 sentences unless the user asks for detail). \
Always respond in the same language the user writes in (German or English).`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  const { messages } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: SYSTEM,
          messages,
        });

        let inputTokens = 0;

        for await (const event of apiStream) {
          if (event.type === 'message_start') {
            inputTokens = event.message.usage.input_tokens;
          }
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta' &&
            event.delta.text
          ) {
            const payload = JSON.stringify({ type: 'text', text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
          if (event.type === 'message_delta') {
            const outputTokens = event.usage.output_tokens;
            const done = JSON.stringify({ type: 'done', inputTokens, outputTokens });
            controller.enqueue(encoder.encode(`data: ${done}\n\n`));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
