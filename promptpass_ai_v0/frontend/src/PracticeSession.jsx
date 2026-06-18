import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppLogo } from './App';

const MarkdownComponents = {
  h1: ({node, ...props}) => <h1 style={{fontSize: '1.5rem', color: '#0f172a', marginTop: '25px', marginBottom: '15px'}} {...props}/>,
  h2: ({node, ...props}) => <h2 style={{fontSize: '1.3rem', color: '#0f172a', marginTop: '20px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px'}} {...props}/>,
  h3: ({node, ...props}) => <h3 style={{fontSize: '1.1rem', color: '#0f172a', marginTop: '16px', marginBottom: '8px'}} {...props}/>,
  p: ({node, ...props}) => <p style={{fontSize: '1.05rem', color: '#334155', lineHeight: '1.7', marginBottom: '15px'}} {...props}/>,
  strong: ({node, ...props}) => <strong style={{color: '#0ea5e9', fontWeight: '700'}} {...props}/>,
  ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', color: '#334155', marginBottom: '15px', lineHeight: '1.7'}} {...props}/>,
  code: ({node, inline, ...props}) => inline 
    ? <code style={{background: '#f1f5f9', padding: '3px 6px', borderRadius: '6px', color: '#db2777', fontSize: '0.9em', fontFamily: 'monospace'}} {...props} />
    : <pre style={{background: '#0f172a', color: '#e2e8f0', padding: '20px', borderRadius: '12px', overflowX: 'auto', marginBottom: '20px'}}><code style={{fontFamily: 'monospace', fontSize: '0.95em'}} {...props}/></pre>
};

export default function PracticeSession({ planId, plans, onSwitch, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  const [questionAnswers, setQuestionAnswers] = useState({});
  const [questionExplanations, setQuestionExplanations] = useState({});
  const [questionChats, setQuestionChats] = useState({});

  useEffect(() => {
    setCurrentIndex(0); setSelectedAnswer(''); setExplanation(''); setChatLog([]); setChatInput('');
    fetch(`http://localhost:8000/api/plans/${planId}/questions`).then(res => res.json()).then(setQuestions);
    fetchProgress();
  }, [planId]);

  useEffect(() => {
    const currentQuestion = questions[currentIndex];
  
    if (!currentQuestion) return;
  
    const qid = currentQuestion.id;
  
    setSelectedAnswer(questionAnswers[qid] || '');
    setExplanation(questionExplanations[qid] || '');
    setChatLog(questionChats[qid] || []);
  }, [
    currentIndex,
    questions,
    questionAnswers,
    questionExplanations,
    questionChats
  ]);

  const fetchProgress = async () => {
    const res = await fetch(`http://localhost:8000/api/plans/${planId}/progress`);
    setProgress(await res.json());
  };

  const processStream = async (response, stateUpdater) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try { stateUpdater(JSON.parse(line.replace('data: ', '')).text); } catch(e) {}
        }
      }
    }
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer) return alert("Please choose an answer!");
    setExplanation(''); setChatLog([]); setIsStreaming(true);
    const response = await fetch('http://localhost:8000/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questions[currentIndex].id, selected_answer: selectedAnswer })
    });
    await processStream(response, (text) => setExplanation(prev => prev + text));
    setIsStreaming(false); fetchProgress();
  };

  const handleAskFollowUp = async () => {
    if (!chatInput) return;
    const currentQuery = chatInput;
    setChatLog(prev => [...prev, { role: 'user', content: currentQuery }, { role: 'ai', content: '' }]);
    setChatInput(''); setIsChatting(true);
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_text: questions[currentIndex].text, ai_explanation: explanation, user_message: currentQuery })
    });
    await processStream(response, (text) => {
      setChatLog(prev => {
        const newLog = [...prev];
        newLog[newLog.length - 1].content += text;
        return newLog;
      });
    });
    setIsChatting(false);
  };

  if (!questions.length)
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading Workspace...
      </div>
    );
  
  const currentQuestion = questions[currentIndex];
  
  const total = questions.length;
  const attempted = progress.filter(p => p.status !== 'gray').length;
  const correct = progress.filter(p => p.status === 'green').length;
  const wrong = progress.filter(p => p.status === 'red').length;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: '#f4f4f5', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '320px', background: '#0f172a', color: '#fff', padding: '30px 25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <AppLogo />
          <h1 style={{ margin: '0 0 0 10px', fontSize: '1.5rem', fontWeight: '800' }}>PromptPass</h1>
        </div>
        
        <button onClick={onBack} style={{ padding: '12px', background: '#1e293b', color: '#fff', borderRadius: '10px', border: 'none', marginBottom: '30px', cursor: 'pointer' }}>← Dashboard</button>
        
        <select value={planId} onChange={(e) => onSwitch(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1e293b', color: '#fff', marginBottom: '40px' }}>
          {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>{total}<br/>Total</div>
          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>{attempted}<br/>Attempted</div>
          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '10px', textAlign: 'center', color: '#10b981' }}>{correct}<br/>Correct</div>
          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '10px', textAlign: 'center', color: '#ef4444' }}>{wrong}<br/>Wrong</div>
        </div>
      </div>

      {/* LEARNING AREA */}
      <div style={{ flex: '1', padding: '50px', overflowY: 'auto', background: '#fff' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', display: 'inline-block', fontWeight: '800', marginBottom: '20px' }}>QUESTION {currentQuestion.question_number}</div>
          <p style={{ fontSize: '1.25rem', color: '#0f172a' }}>{currentQuestion.text}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
            {Object.entries(currentQuestion.options).map(([key, val]) => (
              <label key={key} style={{ padding: '18px', border: '2px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', background: selectedAnswer === key ? '#f0f9ff' : '#fff' }}>
                <input type="radio" value={key} checked={selectedAnswer === key} onChange={(e) => setSelectedAnswer(e.target.value)} style={{ marginRight: '15px' }} />
                {key}. {val}
              </label>
            ))}
          </div>

          <button onClick={handleCheckAnswer} disabled={isStreaming} style={{ width: '100%', padding: '18px', background: '#0f172a', color: '#fff', borderRadius: '12px', marginTop: '30px', fontWeight: 'bold' }}>
            {isStreaming ? 'AI Analyzing...' : 'Submit & Evaluate'}
          </button>
          
          {/* UNIFIED EVALUATION & CHAT */}
          {explanation && (
            <div style={{ marginTop: '50px', padding: '40px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '30px' }}>
                <h3 style={{ marginTop: '0', color: '#0f172a' }}>AI Tutor Explanation</h3>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{explanation}</ReactMarkdown>
              </div>
              
              <div style={{ marginTop: '30px' }}>
                <h4 style={{ color: '#0f172a', marginBottom: '20px' }}>Ask a follow-up:</h4>
                {chatLog.map((msg, i) => (
                  <div key={i} style={{ marginBottom: '15px', padding: '15px', borderRadius: '12px', background: msg.role === 'user' ? '#f1f5f9' : '#eef2ff' }}>
                    <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '5px' }}>{msg.role === 'user' ? 'You' : 'PromptPass AI'}</strong>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{msg.content}</ReactMarkdown>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about this specific question..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  <button onClick={handleAskFollowUp} disabled={isChatting} style={{ padding: '10px 20px', background: '#0ea5e9', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Ask</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DIRECTORY */}
      <div style={{ width: '300px', background: '#f8fafc', borderLeft: '1px solid #e2e8f0', padding: '30px 20px', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: '20px' }}>Question Directory</h3>
        {Array.from({ length: Math.ceil(progress.length / 50) }).map((_, batchIdx) => (
          <details key={batchIdx} style={{ marginBottom: '10px' }} open={batchIdx === 0}>
            <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Questions {batchIdx * 50 + 1} - {Math.min((batchIdx + 1) * 50, progress.length)}</summary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {progress.slice(batchIdx * 50, (batchIdx + 1) * 50).map((item, idx) => {
                const globalIdx = batchIdx * 50 + idx;
                return (
                  <button key={item.question_id} onClick={() => setCurrentIndex(globalIdx)} style={{ width: '35px', height: '35px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentIndex === globalIdx ? '#0f172a' : (item.status === 'green' ? '#dcfce7' : '#fff'), color: currentIndex === globalIdx ? '#fff' : '#0f172a' }}>{item.question_number}</button>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}