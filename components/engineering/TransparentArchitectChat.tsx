'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase   = 'idle' | 'sending' | 'rag' | 'generating' | 'streaming';
type Token   = { id: number; text: string };
type Message = { role: 'user' | 'assistant'; content: string; tokens?: Token[] };

// ─── Pricing (Azure GPT-4o rates — update for phi4 if known) ─────────────────
const COST_IN  = 2.50  / 1_000_000;
const COST_OUT = 10.00 / 1_000_000;

// ─── Vocabulary for prefix-based word prediction ──────────────────────────────
const VOCAB = [
  'artificial','intelligence','machine','learning','neural','network',
  'transformer','attention','embedding','tokenization','inference','training',
  'parameter','gradient','optimization','architecture','deployment','fine-tuning',
  'prompt','context','hallucination','latency','throughput','quantization',
  'distillation','reinforcement','multimodal','foundational',
  'docker','kubernetes','microservice','microservices','api','database',
  'legacy','integration','migration','performance','scalability','authentication',
  'authorization','encryption','compliance','monitoring','observability',
  'künstliche','intelligenz','maschinelles','lernen','modell','architektur',
  'datenschutz','sicherheit','entwicklung','prototyp','echtzeit','system',
  'skalierung','verschlüsselung','optimierung',
];

function predict(input: string): string[] {
  const last = input.trimEnd().split(/\s+/).pop()?.toLowerCase() ?? '';
  if (last.length < 2) return [];
  return VOCAB.filter(w => w.startsWith(last) && w !== last).slice(0, 3);
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

// Split into displayable tokens: words, with long words subword-split at ~4 chars
function tokenizeInput(text: string): Token[] {
  const words = text.trim().match(/\S+/g) ?? [];
  const result: Token[] = [];
  let id = 1;
  for (const word of words) {
    if (word.length > 9) {
      for (let i = 0; i < word.length; i += 4) {
        result.push({ id: id++, text: word.slice(i, Math.min(i + 4, word.length)) });
      }
    } else {
      result.push({ id: id++, text: word });
    }
  }
  return result;
}

const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';

// ─── Component ────────────────────────────────────────────────────────────────
export default function TransparentArchitectChat() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [phase,       setPhase]       = useState<Phase>('idle');
  const [ragFound,    setRagFound]    = useState(0);
  const [tokenBlocks, setTokenBlocks] = useState<Token[]>([]);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [tps,         setTps]         = useState(0);
  const [totalCost,   setTotalCost]   = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [error,       setError]       = useState('');

  const bottomRef    = useRef<HTMLDivElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const streamStart  = useRef(0);
  const chunkCount   = useRef(0);
  const tpsTimer     = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive     = phase !== 'idle';
  const estInputTok  = estimateTokens(input);
  const estOutputTok = 200;
  const estCost      = estInputTok * COST_IN + estOutputTok * COST_OUT;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tokenBlocks.length, phase]);

  useEffect(() => { setPredictions(predict(input)); }, [input]);

  const acceptWord = (word: string) => {
    const parts = input.trimEnd().split(/\s+/);
    parts[parts.length - 1] = word;
    setInput(parts.join(' ') + ' ');
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isActive) return;

    const userTokens = tokenizeInput(text);
    const next: Message[] = [...messages, { role: 'user', content: text, tokens: userTokens }];
    setMessages(next);
    setInput('');
    setPhase('sending');
    setTokenBlocks([]);
    setRagFound(0);
    setError('');
    chunkCount.current = 0;
    streamStart.current = performance.now();

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
          let evt: {
            type: string;
            step?: string; found?: number;
            text?: string;
            inputTokens?: number; outputTokens?: number;
            message?: string;
          };
          try { evt = JSON.parse(line.slice(6)); } catch { continue; }

          if (evt.type === 'status') {
            if (evt.step === 'rag_searching')  setPhase('rag');
            if (evt.step === 'rag_done')       setRagFound(evt.found ?? 0);
            if (evt.step === 'generating')     setPhase('generating');
          }

          if (evt.type === 'text' && evt.text) {
            setPhase('streaming');
            assembled += evt.text;
            chunkCount.current++;
            setTokenBlocks(prev => [...prev, { id: prev.length + 1, text: evt.text! }]);
          }

          if (evt.type === 'done') {
            const inTok  = evt.inputTokens  ?? estInputTok;
            const outTok = evt.outputTokens ?? chunkCount.current;
            setTotalCost(c   => c + inTok * COST_IN + outTok * COST_OUT);
            setTotalTokens(t => t + inTok + outTok);
          }

          if (evt.type === 'error') setError(evt.message ?? 'Unknown error');
        }
      }

      setMessages(m => [...m, { role: 'assistant', content: assembled }]);
      setTokenBlocks([]);

    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setPhase('idle');
      setTps(0);
      if (tpsTimer.current) clearInterval(tpsTimer.current);
    }
  }, [input, messages, isActive, estInputTok]);

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

      {/* ── Header / metrics ─────────────────────────────────────────────── */}
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
        <div style={{ display: 'flex', gap: 18, fontSize: 10 }}>
          <Metric label="TPS"    value={phase === 'streaming' ? String(tps) : '—'} active={phase === 'streaming'} green />
          <Metric label="COST"   value={`$${totalCost.toFixed(6)}`} green />
          <Metric label="TOKENS" value={totalTokens.toLocaleString('de-DE')} />
        </div>
      </div>

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div style={{
        height: 380,
        overflowY: 'auto',
        padding: '14px 14px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {messages.length === 0 && !isActive && (
          <div style={{ margin: 'auto', opacity: 0.25, fontSize: 11, textAlign: 'center', lineHeight: 2 }}>
            <div>// Transparent Architect Chat</div>
            <div>// Jede Antwort zeigt Tokens, TPS und Kosten in Echtzeit.</div>
            <div>// Ask me anything — I respond in your language.</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}

        {/* Pipeline status — shown while active */}
        {isActive && (
          <PipelineIndicator phase={phase} ragFound={ragFound} />
        )}

        {/* Live streaming token blocks */}
        {tokenBlocks.length > 0 && (
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
        <span style={{ fontSize: 10, opacity: input.trim() ? 0.6 : 0.25 }}>
          {input.trim() ? (
            <>
              {'~'}
              {/* key trick: remounts on every count change → restarts tokenFadeIn */}
              <span
                key={estInputTok}
                style={{
                  animation: 'tokenFadeIn 0.12s ease-out',
                  color: '#15803d',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {estInputTok}
              </span>
              {' tokens  ·  ~$'}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {estCost.toFixed(6)}
              </span>
              {' estimated'}
            </>
          ) : '// token estimator'}
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
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.12)', display: 'flex', alignItems: 'stretch' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="// type your message  (Enter to send, Shift+Enter for newline)"
          disabled={isActive}
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
          disabled={isActive || !input.trim()}
          style={{
            padding: '0 18px',
            border: 'none',
            borderLeft: '1px solid rgba(0,0,0,0.12)',
            background: 'transparent',
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            cursor: isActive || !input.trim() ? 'default' : 'pointer',
            color: isActive || !input.trim() ? 'rgba(0,0,0,0.2)' : '#1a1a1a',
            whiteSpace: 'nowrap',
          }}
        >
          {isActive ? '···' : 'SEND ↵'}
        </button>
      </div>
    </div>
  );
}

// ─── Pipeline indicator ───────────────────────────────────────────────────────
function PipelineIndicator({ phase, ragFound }: { phase: Phase; ragFound: number }) {
  const httpDone  = phase !== 'sending';
  const ragActive = phase === 'rag';
  const ragDone   = phase === 'generating' || phase === 'streaming';
  const genActive = phase === 'generating';
  const genStream = phase === 'streaming';

  const ragLabel = ragDone
    ? `azure-ai-search  ${ragFound} doc${ragFound !== 1 ? 's' : ''}`
    : 'azure-ai-search';

  return (
    <div>
      <Label>// pipeline</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5 }}>
        <Step icon={httpDone ? '✓' : '▶'} green={httpDone} dim={false}
          label="POST /api/chat" blink={!httpDone} />
        <Step icon={ragDone ? '✓' : ragActive ? '▶' : '·'} green={ragDone} dim={!ragActive && !ragDone}
          label={ragLabel} blink={ragActive} />
        <Step icon={genStream ? '●' : genActive ? '▶' : '·'} green={false} dim={!genActive && !genStream}
          label={`phi4-mini-instruct${genStream ? '  · streaming' : ''}`} blink={genActive} pulse={genStream} />
      </div>
    </div>
  );
}

function Step({
  icon, green, dim, label, blink, pulse,
}: {
  icon: string; green: boolean; dim: boolean;
  label: string; blink?: boolean; pulse?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
      <span style={{
        width: 10, flexShrink: 0,
        color: green ? '#15803d' : dim ? 'rgba(0,0,0,0.25)' : '#1a1a1a',
        fontWeight: green ? 700 : 400,
      }}>
        {icon}
      </span>
      <span style={{ opacity: dim ? 0.3 : 0.65 }}>{label}</span>
      {blink  && <span style={{ opacity: 0.4 }} className="cursor-blink">···</span>}
      {pulse  && <span style={{ opacity: 0.5 }} className="cursor-blink">▌</span>}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
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
  const tokenCount = msg.tokens?.length ?? estimateTokens(msg.content);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <Label>
        {isUser ? `> user · ${tokenCount} tokens` : '// assistant'}
      </Label>
      <div style={{
        maxWidth: '92%',
        fontSize: 12,
        lineHeight: 1.65,
        padding: isUser && msg.tokens ? '5px 6px' : '8px 11px',
        border: '1px solid rgba(0,0,0,0.09)',
        backgroundColor: isUser ? 'rgba(0,0,0,0.04)' : 'transparent',
        whiteSpace: isUser && msg.tokens ? 'normal' : 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {isUser && msg.tokens ? (
          <div style={{ lineHeight: 2.3 }}>
            {msg.tokens.map((tok, i) => (
              <span
                key={tok.id}
                style={{
                  display: 'inline-block',
                  margin: '1px 2px',
                  padding: '1px 5px',
                  border: '1px solid rgba(0,0,0,0.22)',
                  background: 'rgba(0,0,0,0.025)',
                  fontSize: 12,
                  fontFamily: MONO,
                  animation: 'tokenFadeIn 0.08s ease-out',
                  animationDelay: `${Math.min(i * 18, 320)}ms`,
                  animationFillMode: 'both',
                }}
              >
                {tok.text}
                <sub style={{ fontSize: 7, opacity: 0.28, marginLeft: 1 }}>#{tok.id}</sub>
              </span>
            ))}
          </div>
        ) : (
          msg.content
        )}
      </div>
    </div>
  );
}
