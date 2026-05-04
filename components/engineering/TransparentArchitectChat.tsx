'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Message    = { role: 'user' | 'assistant'; content: string };
type TokenBlock = { id: number; text: string };

// ─── Pricing  (Azure GPT-4o) ─────────────────────────────────────────────────
const COST_IN  = 2.50  / 1_000_000;
const COST_OUT = 10.00 / 1_000_000;

// ─── Vocabulary for prefix-based word prediction ──────────────────────────────
const VOCAB = [
  // AI / ML
  'artificial','intelligence','machine','learning','neural','network',
  'transformer','attention','embedding','tokenization','inference','training',
  'parameter','gradient','optimization','architecture','deployment','fine-tuning',
  'prompt','context','hallucination','latency','throughput','quantization',
  'distillation','reinforcement','multimodal','foundational',
  // Engineering
  'docker','kubernetes','microservice','microservices','api','database',
  'legacy','integration','migration','performance','scalability','authentication',
  'authorization','encryption','compliance','monitoring','observability',
  // German
  'künstliche','intelligenz','maschinelles','lernen','modell','architektur',
  'datenschutz','sicherheit','entwicklung','prototyp','echtzeit','system',
  'deployment','skalierung','verschlüsselung','optimierung',
];

function predict(input: string): string[] {
  const last = input.trimEnd().split(/\s+/).pop()?.toLowerCase() ?? '';
  if (last.length < 2) return [];
  return VOCAB.filter(w => w.startsWith(last) && w !== last).slice(0, 3);
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';

// ─── Component ────────────────────────────────────────────────────────────────
export default function TransparentArchitectChat() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [streaming,   setStreaming]   = useState(false);
  const [tokenBlocks, setTokenBlocks] = useState<TokenBlock[]>([]);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [tps,         setTps]         = useState(0);
  const [totalCost,   setTotalCost]   = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [error,       setError]       = useState('');

  const bottomRef     = useRef<HTMLDivElement>(null);
  const abortRef      = useRef<AbortController | null>(null);
  const streamStart   = useRef(0);
  const chunkCount    = useRef(0);
  const tokenIdCount  = useRef(0);
  const tpsTimer      = useRef<ReturnType<typeof setInterval> | null>(null);

  const estInputTok  = estimateTokens(input);
  const estOutputTok = 200;
  const estCost      = estInputTok * COST_IN + estOutputTok * COST_OUT;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tokenBlocks.length]);

  useEffect(() => { setPredictions(predict(input)); }, [input]);

  const acceptWord = (word: string) => {
    const parts = input.trimEnd().split(/\s+/);
    parts[parts.length - 1] = word;
    setInput(parts.join(' ') + ' ');
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setStreaming(true);
    setTokenBlocks([]);
    setError('');
    chunkCount.current  = 0;
    tokenIdCount.current = 0;
    streamStart.current  = performance.now();

    tpsTimer.current = setInterval(() => {
      const elapsed = (performance.now() - streamStart.current) / 1000;
      if (elapsed > 0) setTps(Math.round(chunkCount.current / elapsed));
    }, 150);

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: next }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let assembled = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw   = decoder.decode(value, { stream: true });
        const lines = raw.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          let evt: { type: string; text?: string; inputTokens?: number; outputTokens?: number; message?: string };
          try { evt = JSON.parse(line.slice(6)); } catch { continue; }

          if (evt.type === 'text' && evt.text) {
            assembled += evt.text;
            chunkCount.current++;
            tokenIdCount.current++;
            const id   = tokenIdCount.current;
            const text = evt.text;
            setTokenBlocks(prev => [...prev, { id, text }]);
          }

          if (evt.type === 'done') {
            const inTok  = evt.inputTokens  ?? estInputTok;
            const outTok = evt.outputTokens ?? chunkCount.current;
            setTotalCost(c   => c + inTok * COST_IN + outTok * COST_OUT);
            setTotalTokens(t => t + inTok + outTok);
          }

          if (evt.type === 'error') {
            setError(evt.message ?? 'Unknown error');
          }
        }
      }

      setMessages(m => [...m, { role: 'assistant', content: assembled }]);
      setTokenBlocks([]);

    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
      }
    } finally {
      setStreaming(false);
      setTps(0);
      if (tpsTimer.current) clearInterval(tpsTimer.current);
    }
  }, [input, messages, streaming, estInputTok]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      border: '1px solid rgba(0,0,0,0.15)',
      fontFamily: MONO,
      backgroundColor: 'rgba(242,240,233,0.7)',
      backdropFilter: 'blur(4px)',
    }}>

      {/* ── Header / metrics bar ─────────────────────────────────────────── */}
      <div style={{
        padding: '9px 14px',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div>
          <span style={{ fontSize: 10, opacity: 0.3 }}>// </span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Transparent Architect Chat
          </span>
        </div>

        {/* Live odometer metrics */}
        <div style={{ display: 'flex', gap: 18, fontSize: 10 }}>
          <Metric label="TPS" value={streaming ? String(tps) : '—'} active={streaming} green />
          <Metric label="COST" value={`$${totalCost.toFixed(6)}`} green />
          <Metric label="TOKENS" value={totalTokens.toLocaleString('de-DE')} />
        </div>
      </div>

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div style={{
        height: 340,
        overflowY: 'auto',
        padding: '14px 14px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {messages.length === 0 && !streaming && (
          <div style={{ margin: 'auto', opacity: 0.25, fontSize: 11, textAlign: 'center', lineHeight: 2 }}>
            <div>// Transparent Architect Chat</div>
            <div>// Jede Antwort zeigt Tokens, TPS und Kosten in Echtzeit.</div>
            <div>// Ask me anything — I respond in your language.</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}

        {/* Live streaming token blocks */}
        {streaming && tokenBlocks.length > 0 && (
          <div>
            <Label>// assistant · streaming</Label>
            <div style={{ lineHeight: 2.2, marginTop: 4 }}>
              {tokenBlocks.map(b => (
                <span key={b.id} className="token-block">
                  {b.text}
                  <sub style={{ fontSize: 7, opacity: 0.3, marginLeft: 1 }}>#{b.id}</sub>
                </span>
              ))}
              <span className="cursor-blink">▌</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 11, color: '#c53030', opacity: 0.8 }}>
            // Error: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Token estimator + word predictions ───────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.08)',
        padding: '6px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 32,
        flexWrap: 'wrap',
        gap: 6,
      }}>
        <span style={{ fontSize: 10, opacity: input.trim() ? 0.55 : 0.25 }}>
          {input.trim()
            ? `~${estInputTok + estOutputTok} tokens · ~$${estCost.toFixed(6)} estimated`
            : '// token estimator'}
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          {predictions.map(w => (
            <button
              key={w}
              onClick={() => acceptWord(w)}
              style={{
                padding: '1px 8px',
                border: '1px solid rgba(0,0,0,0.15)',
                background: 'transparent',
                fontFamily: MONO,
                fontSize: 10,
                cursor: 'pointer',
                color: '#1a1a1a',
                opacity: 0.6,
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input area ───────────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'stretch',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="// type your message  (Enter to send, Shift+Enter for newline)"
          disabled={streaming}
          rows={2}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '10px 14px',
            fontFamily: MONO,
            fontSize: 12,
            lineHeight: 1.6,
            color: '#1a1a1a',
          }}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          style={{
            padding: '0 18px',
            border: 'none',
            borderLeft: '1px solid rgba(0,0,0,0.12)',
            background: 'transparent',
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            cursor: streaming || !input.trim() ? 'default' : 'pointer',
            color: streaming || !input.trim() ? 'rgba(0,0,0,0.2)' : '#1a1a1a',
            whiteSpace: 'nowrap',
          }}
        >
          {streaming ? '···' : 'SEND ↵'}
        </button>
      </div>
    </div>
  );
}

// ─── Small sub-components ─────────────────────────────────────────────────────
function Metric({ label, value, active, green }: {
  label: string; value: string; active?: boolean; green?: boolean;
}) {
  return (
    <span style={{ opacity: active === false ? 0.3 : 1 }}>
      <span style={{ opacity: 0.45 }}>{label} </span>
      <span style={{
        color: green ? '#15803d' : 'inherit',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 600,
        minWidth: 56,
        display: 'inline-block',
      }}>
        {value}
      </span>
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, opacity: 0.3, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
      {children}
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <Label>{isUser ? '> user' : '// assistant'}</Label>
      <div style={{
        maxWidth: '88%',
        fontSize: 12,
        lineHeight: 1.65,
        padding: '8px 11px',
        border: '1px solid rgba(0,0,0,0.09)',
        backgroundColor: isUser ? 'rgba(0,0,0,0.04)' : 'transparent',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  );
}
