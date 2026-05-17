'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { encode, decode } from 'gpt-tokenizer';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase   = 'idle' | 'sending' | 'rag' | 'generating' | 'streaming';
type Token   = { id: number; tokenId: number; text: string; group: number; isFirst: boolean; isLast: boolean };
type Message = { role: 'user' | 'assistant'; content: string; tokens?: Token[] };

// ─── Pricing (Azure GPT-4o rates) ─────────────────────────────────────────────
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
  if (!text.trim()) return 0;
  try { return encode(text).length; } catch { return Math.max(1, Math.ceil(text.length / 4)); }
}

// Real GPT BPE tokenization via gpt-tokenizer (cl100k_base vocab).
// Tokens that belong to the same visual word are grouped so the UI
// can render them side-by-side inside a shared border.
function tokenizeInput(text: string): Token[] {
  const ids  = encode(text);
  const result: Token[] = [];
  let group  = 0;
  let seqId  = 1;

  // Decode each token individually to get its string
  const texts = ids.map(id => decode([id]));

  // A new visual word-group starts when the decoded text begins with a space
  // or when the previous token ended with a space (GPT attaches spaces to the
  // START of the following token, so " hello" is one token).
  let groupStart = 0;
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    const startsGroup = i === 0 || t.startsWith(' ');
    if (startsGroup) { group++; groupStart = i; }

    const isFirst = i === groupStart;
    // peek ahead: next token starts a new group (or we're last)?
    const isLast = i === texts.length - 1 || texts[i + 1].startsWith(' ');

    result.push({ id: seqId++, tokenId: ids[i], text: t, group, isFirst, isLast });
  }

  return result;
}

const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const MAX_INPUT_TOKENS = 200;

const SUGGESTED_PROMPTS = [
  'Was waren deine letzten Projekte?',
  'Wie setzt du KI konkret in der Praxis ein?',
  'Was ist dein Software Stack?',
];

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#0f0f0f',
  bgMessage:  '#181818',
  bgUser:     '#1e2a1e',
  bgInput:    '#161616',
  border:     'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',
  text:       '#e8e8e8',
  textDim:    'rgba(232,232,232,0.45)',
  textFaint:  'rgba(232,232,232,0.22)',
  green:      '#4ade80',
  greenDim:   'rgba(74,222,128,0.5)',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TransparentArchitectChat() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [phase,       setPhase]       = useState<Phase>('idle');
  const [ragFound,    setRagFound]    = useState(0);
  const [tokenBlocks, setTokenBlocks] = useState<Token[]>([]);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [tps,          setTps]          = useState(0);
  const [totalCost,    setTotalCost]    = useState(0);
  const [totalTokens,  setTotalTokens]  = useState(0);
  const [error,        setError]        = useState('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [liveTime,     setLiveTime]     = useState<number>(0);
  const [privacyModal, setPrivacyModal] = useState<string | null>(null); // pending message text

  const messagesRef    = useRef<HTMLDivElement>(null);
  const bottomRef      = useRef<HTMLDivElement>(null);
  const abortRef       = useRef<AbortController | null>(null);
  const streamStart    = useRef(0);
  const sendStart      = useRef(0);
  const chunkCount     = useRef(0);
  const tpsTimer       = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  const privacyAcked   = useRef(false);

  const isActive     = phase !== 'idle';
  const estInputTok  = estimateTokens(input);
  const estOutputTok = 200;
  const estCost      = estInputTok * COST_IN + estOutputTok * COST_OUT;
  const overLimit    = estInputTok > MAX_INPUT_TOKENS;

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, tokenBlocks.length, phase]);

  useEffect(() => { setPredictions(predict(input)); }, [input]);

  const acceptWord = (word: string) => {
    const parts = input.trimEnd().split(/\s+/);
    parts[parts.length - 1] = word;
    setInput(parts.join(' ') + ' ');
  };

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isActive || overLimit) return;
    if (!privacyAcked.current) { setPrivacyModal(text); return; }

    const userTokens = tokenizeInput(text);
    const next: Message[] = [...messages, { role: 'user', content: text, tokens: userTokens }];
    setMessages(next);
    setInput('');
    setPhase('sending');
    setTokenBlocks([]);
    setRagFound(0);
    setError('');
    setResponseTime(null);
    setLiveTime(0);
    chunkCount.current = 0;
    streamStart.current = performance.now();
    sendStart.current   = performance.now();
    liveTimer.current = setInterval(() => {
      setLiveTime(parseFloat(((performance.now() - sendStart.current) / 1000).toFixed(1)));
    }, 100);

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

      if (assembled.trim()) setMessages(m => [...m, { role: 'assistant', content: assembled }]);
      setTokenBlocks([]);
      setResponseTime(parseFloat(((performance.now() - sendStart.current) / 1000).toFixed(1)));

    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
        setResponseTime(parseFloat(((performance.now() - sendStart.current) / 1000).toFixed(1)));
      }
    } finally {
      setPhase('idle');
      setTps(0);
      if (tpsTimer.current)  clearInterval(tpsTimer.current);
      if (liveTimer.current) clearInterval(liveTimer.current);
    }
  }, [input, messages, isActive, overLimit, estInputTok, liveTime]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: MONO,
      backgroundColor: C.bg,
      border: `1px solid ${C.borderStrong}`,
      borderRadius: 4,
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        backgroundColor: '#0a0a0a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Traffic light dots */}
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f57', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#febc2e', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28c840', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: C.textDim, marginLeft: 8, letterSpacing: '0.08em' }}>
            Jan Kettlers Chatbot
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 11 }}>
          <Metric label="TIME"   value={isActive ? `${liveTime}s` : responseTime !== null ? `${responseTime}s` : '—'} active={isActive} />
          <Metric label="TPS"    value={phase === 'streaming' ? String(tps) : '—'} active={phase === 'streaming'} />
          <Metric label="COST"   value={`$${totalCost.toFixed(6)}`} highlight={totalCost > 0} />
          <Metric label="TOKENS" value={totalTokens.toLocaleString('de-DE')} />
        </div>
      </div>

      {/* ── Message list ────────────────────────────────────────────────────── */}
      <div ref={messagesRef} style={{
        height: 420,
        overflowY: 'auto',
        padding: '20px 20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {messages.length === 0 && !isActive && (
          <div style={{ fontSize: 12, color: C.textFaint, letterSpacing: '0.08em' }}>
            // Ask me anything about Jan
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}

        {isActive && (
          <PipelineIndicator phase={phase} ragFound={ragFound} />
        )}

        {tokenBlocks.length > 0 && (
          <div>
            <MsgLabel>// assistant · streaming</MsgLabel>
            <div style={{
              marginTop: 8,
              padding: '12px 14px',
              backgroundColor: C.bgMessage,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 14,
              color: C.text,
              lineHeight: 2.2,
            }}>
              {tokenBlocks.map(b => (
                <span key={b.id} className="token-block">
                  {b.text}
                  <sub style={{ fontSize: 8, color: C.textFaint, marginLeft: 1 }}>#{b.id}</sub>
                </span>
              ))}
              <span className="cursor-blink" style={{ color: C.green }}>▌</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 13, color: '#f87171' }}>
            // Error: {error}
          </div>
        )}

        {/* Suggested prompts — always visible, styled as clickable user bubbles */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
          <MsgLabel>// vorgeschlagene fragen</MsgLabel>
          {SUGGESTED_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => !isActive && send(prompt)}
              disabled={isActive}
              style={{
                fontFamily: MONO,
                fontSize: 13,
                padding: '8px 12px',
                border: `1px dashed ${isActive ? C.border : C.borderStrong}`,
                background: isActive ? 'transparent' : C.bgUser,
                color: isActive ? C.textFaint : C.textDim,
                cursor: isActive ? 'default' : 'pointer',
                borderRadius: 3,
                maxWidth: '88%',
                textAlign: 'right',
                lineHeight: 1.5,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (isActive) return;
                (e.currentTarget as HTMLButtonElement).style.borderColor = C.green;
                (e.currentTarget as HTMLButtonElement).style.color = C.text;
              }}
              onMouseLeave={e => {
                if (isActive) return;
                (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderStrong;
                (e.currentTarget as HTMLButtonElement).style.color = C.textDim;
              }}
            >
              {prompt} ›
            </button>
          ))}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* ── Token estimator + word predictions ──────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        padding: '7px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 34,
        flexWrap: 'wrap',
        gap: 6,
        backgroundColor: '#0a0a0a',
      }}>
        <span style={{ fontSize: 11, color: overLimit ? '#f87171' : input.trim() ? C.textDim : C.textFaint }}>
          {input.trim() ? (
            <>
              {'~'}
              <span
                key={estInputTok}
                style={{
                  animation: 'tokenFadeIn 0.12s ease-out',
                  color: overLimit ? '#f87171' : C.green,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {estInputTok}
              </span>
              {` / ${MAX_INPUT_TOKENS} tokens`}
              {!overLimit && (
                <>
                  {'  ·  ~$'}
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{estCost.toFixed(6)}</span>
                  {' estimated'}
                </>
              )}
              {overLimit && '  ·  Nachricht zu lang'}
            </>
          ) : `// max ${MAX_INPUT_TOKENS} tokens per message`}
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          {predictions.map(w => (
            <button
              key={w}
              onClick={() => acceptWord(w)}
              style={{
                padding: '2px 9px',
                border: `1px solid ${C.border}`,
                background: 'transparent',
                fontFamily: MONO,
                fontSize: 11,
                cursor: 'pointer',
                color: C.textDim,
                borderRadius: 2,
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* ── Privacy notice modal ────────────────────────────────────────────── */}
      {privacyModal !== null && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            backgroundColor: '#141414',
            border: `1px solid ${C.borderStrong}`,
            borderRadius: 4,
            padding: '28px 28px 24px',
            maxWidth: 420,
            width: '100%',
            fontFamily: MONO,
          }}>
            <div style={{ fontSize: 10, color: C.textFaint, letterSpacing: '0.2em', marginBottom: 16 }}>
              // DATENSCHUTZHINWEIS
            </div>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7, margin: 0 }}>
              Deine Nachricht wird zur Verarbeitung an{' '}
              <span style={{ color: C.green }}>Mistral AI</span> (Frankreich, EU) und{' '}
              <span style={{ color: C.green }}>Azure AI Search</span> (Microsoft) weitergeleitet.
              Es werden keine Nachrichten dauerhaft gespeichert.
            </p>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  privacyAcked.current = true;
                  const msg = privacyModal;
                  setPrivacyModal(null);
                  send(msg);
                }}
                style={{
                  fontFamily: MONO, fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.12em', padding: '8px 24px',
                  backgroundColor: C.green, color: '#0f0f0f',
                  border: 'none', borderRadius: 3, cursor: 'pointer',
                }}
              >
                VERSTANDEN ↵
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${C.borderStrong}`,
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: C.bgInput,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Nachricht eingeben  (Enter zum Senden, Shift+Enter für Zeilenumbruch)"
          disabled={isActive}
          rows={3}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '14px 16px',
            fontFamily: MONO,
            fontSize: 14,
            lineHeight: 1.65,
            color: C.text,
          }}
        />
        <button
          onClick={() => send()}
          disabled={isActive || !input.trim() || overLimit}
          style={{
            padding: '0 22px',
            border: 'none',
            borderLeft: `1px solid ${C.borderStrong}`,
            background: isActive || !input.trim() || overLimit ? 'transparent' : C.green,
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            cursor: isActive || !input.trim() || overLimit ? 'default' : 'pointer',
            color: isActive || !input.trim() || overLimit ? C.textFaint : '#0f0f0f',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s, color 0.2s',
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
      <MsgLabel>// pipeline</MsgLabel>
      <div style={{
        marginTop: 8,
        padding: '10px 14px',
        backgroundColor: C.bgMessage,
        border: `1px solid ${C.border}`,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <Step icon={httpDone ? '✓' : '▶'} green={httpDone} dim={false}  label="POST /api/chat"            blink={!httpDone} />
        <Step icon={ragDone ? '✓' : ragActive ? '▶' : '·'} green={ragDone} dim={!ragActive && !ragDone}   label={ragLabel}  blink={ragActive} />
        <Step icon={genStream ? '●' : genActive ? '▶' : '·'} green={false} dim={!genActive && !genStream} label={`mistral-small-latest${genStream ? '  · streaming' : ''}`} blink={genActive} pulse={genStream} />
      </div>
    </div>
  );
}

function Step({ icon, green, dim, label, blink, pulse }: {
  icon: string; green: boolean; dim: boolean;
  label: string; blink?: boolean; pulse?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
      <span style={{
        width: 12, flexShrink: 0,
        color: green ? C.green : dim ? C.textFaint : C.textDim,
        fontWeight: green ? 700 : 400,
      }}>
        {icon}
      </span>
      <span style={{ color: dim ? C.textFaint : C.textDim }}>{label}</span>
      {blink && <span style={{ color: C.textFaint }} className="cursor-blink">···</span>}
      {pulse && <span style={{ color: C.green }}    className="cursor-blink">▌</span>}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Metric({ label, value, active, highlight }: {
  label: string; value: string; active?: boolean; highlight?: boolean;
}) {
  return (
    <span style={{ opacity: active === false ? 0.35 : 1 }}>
      <span style={{ color: C.textFaint }}>{label} </span>
      <span style={{
        color: highlight ? C.green : C.textDim,
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

function MsgLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: C.textFaint, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
      {children}
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const tokenCount = msg.tokens?.length ?? estimateTokens(msg.content);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <MsgLabel>
        {isUser ? `> user · ${tokenCount} tokens` : '// assistant'}
      </MsgLabel>
      <div style={{
        maxWidth: '88%',
        fontSize: 14,
        lineHeight: 1.7,
        padding: isUser && msg.tokens ? '8px 10px' : '12px 14px',
        border: `1px solid ${C.border}`,
        borderRadius: 3,
        backgroundColor: isUser ? C.bgUser : C.bgMessage,
        color: C.text,
        whiteSpace: isUser && msg.tokens ? 'normal' : 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {isUser && msg.tokens ? (
          <div style={{ lineHeight: 2.6, wordBreak: 'break-word' }}>
            {msg.tokens.map((tok, i) => {
              // Strip the leading space from the text for display — we render
              // the gap between groups via marginLeft on isFirst tokens.
              const displayText = tok.text.startsWith(' ') ? tok.text.slice(1) : tok.text;
              const alone = tok.isFirst && tok.isLast;
              return (
                <span
                  key={tok.id}
                  style={{
                    display: 'inline-block',
                    marginLeft:  tok.isFirst ? (i === 0 ? 0 : '0.35em') : 0,
                    marginBottom: 3,
                    padding: '2px 5px',
                    // Shared border: only draw the sides that start/end the group
                    borderTop:    `1px solid rgba(74,222,128,0.3)`,
                    borderBottom: `1px solid rgba(74,222,128,0.3)`,
                    borderLeft:   tok.isFirst ? `1px solid rgba(74,222,128,0.3)` : `1px solid rgba(74,222,128,0.12)`,
                    borderRight:  tok.isLast  ? `1px solid rgba(74,222,128,0.3)` : 'none',
                    borderRadius: alone ? 2 : tok.isFirst ? '2px 0 0 2px' : tok.isLast ? '0 2px 2px 0' : 0,
                    background:   'rgba(74,222,128,0.06)',
                    fontSize: 13,
                    fontFamily: MONO,
                    color: C.text,
                    animation: 'tokenFadeIn 0.08s ease-out',
                    animationDelay: `${Math.min(i * 18, 320)}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  {displayText}
                  <sub style={{ fontSize: 7, color: C.textFaint, marginLeft: 1 }}>{tok.tokenId}</sub>
                </span>
              );
            })}
          </div>
        ) : (
          msg.content
        )}
      </div>
    </div>
  );
}
