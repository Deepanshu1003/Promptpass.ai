import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppLogo } from './App';

// ─── Markdown renderer ────────────────────────────────────────────────────────

const MarkdownComponents = {
  h1: ({ node, ...props }) => (
    <h1 style={{ fontSize: '1.4rem', color: '#0f172a', marginTop: '24px', marginBottom: '12px' }} {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2
      style={{
        fontSize: '1.2rem',
        color: '#0f172a',
        marginTop: '18px',
        marginBottom: '10px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '6px',
      }}
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginTop: '14px', marginBottom: '6px' }} {...props} />
  ),
  p: ({ node, ...props }) => (
    <p style={{ fontSize: '1.02rem', color: '#334155', lineHeight: '1.75', marginBottom: '12px' }} {...props} />
  ),
  strong: ({ node, ...props }) => <strong style={{ color: '#0ea5e9', fontWeight: '700' }} {...props} />,
  ul: ({ node, ...props }) => (
    <ul style={{ paddingLeft: '20px', color: '#334155', marginBottom: '12px', lineHeight: '1.75' }} {...props} />
  ),
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code
        style={{
          background: '#f1f5f9',
          padding: '2px 6px',
          borderRadius: '5px',
          color: '#db2777',
          fontSize: '0.9em',
          fontFamily: 'monospace',
        }}
        {...props}
      />
    ) : (
      <pre
        style={{
          background: '#0f172a',
          color: '#e2e8f0',
          padding: '18px',
          borderRadius: '10px',
          overflowX: 'auto',
          marginBottom: '18px',
        }}
      >
        <code style={{ fontFamily: 'monospace', fontSize: '0.92em' }} {...props} />
      </pre>
    ),
};

// ─── Local-storage helpers ────────────────────────────────────────────────────

const LS_KEY = (planId) => `promptpass_state_${planId}`;

function loadFromStorage(planId) {
  try {
    const raw = localStorage.getItem(LS_KEY(planId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(planId, data) {
  try {
    localStorage.setItem(LS_KEY(planId), JSON.stringify(data));
  } catch {
    /* quota errors etc — silent */
  }
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const colors = { green: '#10b981', red: '#ef4444', gray: '#cbd5e1' };
  const titles = { green: 'Correct', red: 'Incorrect', gray: 'Not attempted' };
  return (
    <span
      title={titles[status] || 'Unknown'}
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: colors[status] || colors.gray,
        flexShrink: 0,
      }}
    />
  );
}

// ─── Review modal ─────────────────────────────────────────────────────────────

function ReviewModal({ questions, progress, filter, onClose, onNavigate }) {
  const filtered = progress.filter((p) => p.status === filter);
  const label = filter === 'green' ? 'Correct' : 'Incorrect';
  const accent = filter === 'green' ? '#10b981' : '#ef4444';
  const bgAccent = filter === 'green' ? '#f0fdf4' : '#fef2f2';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '18px',
          width: '480px',
          maxHeight: '70vh',
          overflowY: 'auto',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, color: accent, fontSize: '1.15rem' }}>
            {label} Questions ({filtered.length})
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              color: '#64748b',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
            No {label.toLowerCase()} questions yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((item) => {
              const q = questions.find((q) => q.id === item.question_id);
              if (!q) return null;
              return (
                <button
                  key={item.question_id}
                  onClick={() => {
                    const idx = questions.findIndex((q) => q.id === item.question_id);
                    onNavigate(idx);
                    onClose();
                  }}
                  style={{
                    background: bgAccent,
                    border: `1px solid ${accent}30`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'transform 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
                >
                  <span
                    style={{ fontSize: '0.75rem', fontWeight: '700', color: accent, textTransform: 'uppercase' }}
                  >
                    Q{q.question_number}
                  </span>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      lineHeight: '1.45',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {q.text}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PracticeSession({ planId, plans, onSwitch, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-question persistent state (keyed by question ID)
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [questionExplanations, setQuestionExplanations] = useState({});
  const [questionChats, setQuestionChats] = useState({});

  // Derived view state for the currently visible question
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Review modal
  const [reviewFilter, setReviewFilter] = useState(null); // 'green' | 'red' | null

  const chatInputRef = useRef(null);

  // ── Load questions + progress on plan change ────────────────────────────────
  useEffect(() => {
    setCurrentIndex(0);
    setChatInput('');

    // Restore persisted per-question state from localStorage
    const saved = loadFromStorage(planId);
    if (saved) {
      setQuestionAnswers(saved.answers || {});
      setQuestionExplanations(saved.explanations || {});
      setQuestionChats(saved.chats || {});
    } else {
      setQuestionAnswers({});
      setQuestionExplanations({});
      setQuestionChats({});
    }

    fetch(`http://localhost:8000/api/plans/${planId}/questions`)
      .then((r) => r.json())
      .then(setQuestions);
    fetchProgress();
  }, [planId]);

  // ── Autosave to localStorage whenever per-question state changes ────────────
  useEffect(() => {
    if (!planId) return;
    saveToStorage(planId, {
      answers: questionAnswers,
      explanations: questionExplanations,
      chats: questionChats,
    });
  }, [planId, questionAnswers, questionExplanations, questionChats]);

  // ── Sync view state when navigating questions ───────────────────────────────
  useEffect(() => {
    const q = questions[currentIndex];
    if (!q) return;
    setSelectedAnswer(questionAnswers[q.id] || '');
    setExplanation(questionExplanations[q.id] || '');
    setChatLog(questionChats[q.id] || []);
    setChatInput('');
  }, [currentIndex, questions, questionAnswers, questionExplanations, questionChats]);

  const fetchProgress = async () => {
    const res = await fetch(`http://localhost:8000/api/plans/${planId}/progress`);
    setProgress(await res.json());
  };

  // ── Stream helper ───────────────────────────────────────────────────────────
  const processStream = async (response, stateUpdater) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            stateUpdater(JSON.parse(line.replace('data: ', '')).text);
          } catch {}
        }
      }
    }
  };

  // ── Submit answer ───────────────────────────────────────────────────────────
  const handleCheckAnswer = async () => {
    if (!selectedAnswer) return alert('Please choose an answer first!');
    const q = questions[currentIndex];

    // Optimistically clear old explanation for this question
    setExplanation('');
    setQuestionExplanations((prev) => ({ ...prev, [q.id]: '' }));
    setChatLog([]);
    setQuestionChats((prev) => ({ ...prev, [q.id]: [] }));
    setIsStreaming(true);

    const response = await fetch('http://localhost:8000/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: q.id, selected_answer: selectedAnswer }),
    });

    await processStream(response, (text) => {
      setExplanation((prev) => {
        const next = prev + text;
        setQuestionExplanations((e) => ({ ...e, [q.id]: next }));
        return next;
      });
    });

    setIsStreaming(false);
    fetchProgress();
  };

  // ── Follow-up chat ──────────────────────────────────────────────────────────
  const handleAskFollowUp = async () => {
    const query = chatInput.trim();
    if (!query) return;
    const q = questions[currentIndex];

    const newEntry = [{ role: 'user', content: query }, { role: 'ai', content: '' }];
    const updatedLog = [...chatLog, ...newEntry];
    setChatLog(updatedLog);
    setQuestionChats((prev) => ({ ...prev, [q.id]: updatedLog }));
    setChatInput('');
    setIsChatting(true);

    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_text: q.text,
        ai_explanation: explanation,
        user_message: query,
      }),
    });

    await processStream(response, (text) => {
      setChatLog((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: updated[updated.length - 1].content + text,
        };
        setQuestionChats((c) => ({ ...c, [q.id]: updated }));
        return updated;
      });
    });

    setIsChatting(false);
  };

  // ── Radio change with answer persistence ────────────────────────────────────
  const handleSelectAnswer = (key) => {
    const q = questions[currentIndex];
    setSelectedAnswer(key);
    setQuestionAnswers((prev) => ({ ...prev, [q.id]: key }));
  };

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  const navigate = useCallback(
    (delta) => {
      setCurrentIndex((i) => Math.max(0, Math.min(questions.length - 1, i + delta)));
    },
    [questions.length]
  );

  useEffect(() => {
    const handler = (e) => {
      // Don't intercept when typing in an input/textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);

      // Option shortcuts: 1=A, 2=B, 3=C, 4=D
      const optionKeys = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E', '6': 'F' };
      if (optionKeys[e.key] && questions[currentIndex]) {
        const opts = questions[currentIndex].options;
        if (opts[optionKeys[e.key]]) handleSelectAnswer(optionKeys[e.key]);
      }

      // Enter = submit
      if (e.key === 'Enter' && !isStreaming && !isChatting) handleCheckAnswer();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, currentIndex, questions, isStreaming, isChatting, selectedAnswer]);

  // ── Chat input: Cmd/Ctrl+Enter to send ──────────────────────────────────────
  const handleChatKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAskFollowUp();
    }
  };

  // ── Guard: loading ──────────────────────────────────────────────────────────
  if (!questions.length) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#64748b',
        }}
      >
        Loading workspace…
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const attempted = progress.filter((p) => p.status !== 'gray').length;
  const correct = progress.filter((p) => p.status === 'green').length;
  const wrong = progress.filter((p) => p.status === 'red').length;

  const progressPct = total > 0 ? Math.round((attempted / total) * 100) : 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: '#f4f4f5',
        overflow: 'hidden',
      }}
    >
      {/* ── SIDEBAR ── */}
      <div
        style={{
          width: '300px',
          background: '#0f172a',
          color: '#fff',
          padding: '28px 22px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <AppLogo />
          <h1 style={{ margin: '0 0 0 10px', fontSize: '1.4rem', fontWeight: '800' }}>PromptPass</h1>
        </div>

        <button
          onClick={onBack}
          style={{
            padding: '11px',
            background: '#1e293b',
            color: '#94a3b8',
            borderRadius: '10px',
            border: 'none',
            marginBottom: '16px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'color 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          ← Dashboard
        </button>

        <select
          value={planId}
          onChange={(e) => onSwitch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '10px',
            background: '#1e293b',
            color: '#fff',
            marginBottom: '28px',
            border: '1px solid #334155',
          }}
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        {/* Progress bar */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}
          >
            <span>Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0ea5e9, #10b981)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Stats grid — correct & wrong are clickable */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
          <div
            style={{
              background: '#1e293b',
              padding: '14px',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#94a3b8',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{total}</div>
            Total
          </div>
          <div
            style={{
              background: '#1e293b',
              padding: '14px',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#94a3b8',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{attempted}</div>
            Done
          </div>

          {/* Correct — clickable */}
          <button
            onClick={() => setReviewFilter('green')}
            style={{
              background: '#052e16',
              padding: '14px',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#6ee7b7',
              border: '1px solid #10b98130',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#10b981')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#10b98130')}
            title="Click to review correct answers"
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>{correct}</div>
            Correct ↗
          </button>

          {/* Wrong — clickable */}
          <button
            onClick={() => setReviewFilter('red')}
            style={{
              background: '#2d0a0a',
              padding: '14px',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#fca5a5',
              border: '1px solid #ef444430',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#ef4444')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#ef444430')}
            title="Click to review incorrect answers"
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ef4444' }}>{wrong}</div>
            Wrong ↗
          </button>
        </div>

        {/* Keyboard hints */}
        <div
          style={{
            background: '#1e293b',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '0.76rem',
            color: '#64748b',
            lineHeight: '1.7',
          }}
        >
          <div style={{ color: '#94a3b8', fontWeight: '700', marginBottom: '6px' }}>⌨ Shortcuts</div>
          <div>← → Navigate questions</div>
          <div>1–4 Select option A–D</div>
          <div>Enter Submit answer</div>
          <div>⌘↵ Send chat message</div>
        </div>
      </div>

      {/* ── MAIN LEARNING AREA ── */}
      <div
        style={{
          flex: 1,
          padding: '40px 50px',
          overflowY: 'auto',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
          {/* Navigation bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '28px',
            }}
          >
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '4px 14px',
                borderRadius: '20px',
                fontWeight: '800',
                fontSize: '0.85rem',
              }}
            >
              Q {currentQuestion.question_number} / {total}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate(-1)}
                disabled={currentIndex === 0}
                style={navBtnStyle(currentIndex === 0)}
              >
                ← Prev
              </button>
              <button
                onClick={() => navigate(1)}
                disabled={currentIndex === questions.length - 1}
                style={navBtnStyle(currentIndex === questions.length - 1)}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Question */}
          <p style={{ fontSize: '1.2rem', color: '#0f172a', lineHeight: '1.7', marginBottom: '28px' }}>
            {currentQuestion.text}
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(currentQuestion.options).map(([key, val]) => {
              const isSelected = selectedAnswer === key;
              return (
                <label
                  key={key}
                  style={{
                    padding: '16px 20px',
                    border: `2px solid ${isSelected ? '#38bdf8' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected ? '#f0f9ff' : '#fff',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    value={key}
                    checked={isSelected}
                    onChange={() => handleSelectAnswer(key)}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <span style={{ color: '#0f172a', fontSize: '1rem', lineHeight: '1.55' }}>
                    <strong style={{ color: '#0ea5e9', marginRight: '6px' }}>{key}.</strong>
                    {val}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={handleCheckAnswer}
            disabled={isStreaming || !selectedAnswer}
            style={{
              width: '100%',
              padding: '17px',
              background: isStreaming || !selectedAnswer ? '#94a3b8' : '#0f172a',
              color: '#fff',
              borderRadius: '12px',
              marginTop: '24px',
              fontWeight: '800',
              fontSize: '1rem',
              border: 'none',
              cursor: isStreaming || !selectedAnswer ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isStreaming ? '⚙ AI Analysing…' : 'Submit & Evaluate  (Enter)'}
          </button>

          {/* ── Evaluation + Chat ── */}
          {explanation && (
            <div
              style={{
                marginTop: '44px',
                padding: '36px',
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.1rem' }}>AI Tutor Explanation</h3>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '28px', marginBottom: '28px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {explanation}
                </ReactMarkdown>
              </div>

              {/* Chat */}
              <h4 style={{ color: '#0f172a', marginBottom: '16px', fontSize: '0.95rem' }}>
                Ask a follow-up question:
              </h4>
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '14px',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: msg.role === 'user' ? '#f1f5f9' : '#eef2ff',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '6px',
                      color: msg.role === 'user' ? '#64748b' : '#4f46e5',
                    }}
                  >
                    {msg.role === 'user' ? 'You' : 'PromptPass AI'}
                  </strong>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {msg.content || '…'}
                  </ReactMarkdown>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Ask about this question… (⌘ Enter to send)"
                  rows={2}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    resize: 'vertical',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAskFollowUp}
                  disabled={isChatting || !chatInput.trim()}
                  style={{
                    padding: '10px 20px',
                    background: isChatting || !chatInput.trim() ? '#94a3b8' : '#0ea5e9',
                    color: '#fff',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: isChatting || !chatInput.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    alignSelf: 'flex-end',
                  }}
                >
                  {isChatting ? '…' : 'Ask'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── QUESTION DIRECTORY (right panel) ── */}
      <div
        style={{
          width: '280px',
          background: '#f8fafc',
          borderLeft: '1px solid #e2e8f0',
          padding: '28px 18px',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '18px', fontSize: '0.95rem', color: '#0f172a' }}>
          Question Directory
        </h3>
        {Array.from({ length: Math.ceil(progress.length / 50) }).map((_, batchIdx) => (
          <details key={batchIdx} style={{ marginBottom: '12px' }} open={batchIdx === 0}>
            <summary
              style={{ cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}
            >
              Q {batchIdx * 50 + 1} – {Math.min((batchIdx + 1) * 50, progress.length)}
            </summary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {progress.slice(batchIdx * 50, (batchIdx + 1) * 50).map((item, idx) => {
                const globalIdx = batchIdx * 50 + idx;
                const isActive = currentIndex === globalIdx;
                const statusColors = {
                  green: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
                  red: { bg: '#fef2f2', border: '#ef4444', text: '#7f1d1d' },
                  gray: { bg: '#fff', border: '#cbd5e1', text: '#0f172a' },
                };
                const sc = isActive
                  ? { bg: '#0f172a', border: '#0f172a', text: '#fff' }
                  : statusColors[item.status] || statusColors.gray;

                return (
                  <button
                    key={item.question_id}
                    onClick={() => setCurrentIndex(globalIdx)}
                    title={`Q${item.question_number} — ${item.status === 'green' ? 'Correct' : item.status === 'red' ? 'Incorrect' : 'Not attempted'}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '7px',
                      border: `1.5px solid ${sc.border}`,
                      background: sc.bg,
                      color: sc.text,
                      cursor: 'pointer',
                      fontWeight: isActive ? '800' : '600',
                      fontSize: '0.8rem',
                      transition: 'transform 0.1s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {item.question_number}
                  </button>
                );
              })}
            </div>
          </details>
        ))}
      </div>

      {/* ── Review Modal ── */}
      {reviewFilter && (
        <ReviewModal
          questions={questions}
          progress={progress}
          filter={reviewFilter}
          onClose={() => setReviewFilter(null)}
          onNavigate={(idx) => setCurrentIndex(idx)}
        />
      )}
    </div>
  );
}

// ── Tiny style helper ─────────────────────────────────────────────────────────

function navBtnStyle(disabled) {
  return {
    padding: '8px 16px',
    background: disabled ? '#f1f5f9' : '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#94a3b8' : '#0f172a',
    fontWeight: '600',
    fontSize: '0.88rem',
    transition: 'background 0.15s',
  };
}