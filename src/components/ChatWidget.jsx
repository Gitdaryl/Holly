import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

const SESSION_ID = Math.random().toString(36).slice(2);

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm Holly's assistant. I know every lake and neighborhood in the Irish Hills. What are you looking for?",
};

const LEAD_PROMPT_AFTER = 2;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  useEffect(() => {
    if (userMessageCount >= LEAD_PROMPT_AFTER && !leadCaptured && !showLeadForm) {
      setShowLeadForm(true);
    }
  }, [userMessageCount, leadCaptured, showLeadForm]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.filter(m => m.role !== 'system'),
          sessionId: SESSION_ID,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || "I'm not sure about that - call Holly at (517) 403-3413." }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Having trouble connecting. You can reach Holly at (517) 403-3413." }]);
    } finally {
      setLoading(false);
    }
  };

  const saveLead = async () => {
    if (!leadForm.name && !leadForm.email) return;

    const interest = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' | ')
      .slice(0, 500);

    try {
      await fetch('/api/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadForm, interest, sessionId: SESSION_ID }),
      });
    } catch {
      // silently fail - don't disrupt chat
    }

    setLeadCaptured(true);
    setLeadSaved(true);
    setShowLeadForm(false);
    setMessages(prev => [...prev, { role: 'assistant', content: `Thanks, ${leadForm.name || 'there'}! Holly will be in touch. You can also call her anytime at (517) 403-3413.` }]);
  };

  return (
    <>
      {/* Chat bubble trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Chat with Holly's assistant"
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #e84393, #c0166d)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(232,67,147,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
        {/* Notification dot when closed */}
        {!open && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 10, height: 10, borderRadius: '50%',
            background: '#22c55e', border: '2px solid white',
          }} />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 998,
          width: 'min(360px, calc(100vw - 2rem))',
          height: 'min(520px, calc(100vh - 7rem))',
          background: '#faf9f7', borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideIn 0.25s ease-out',
          fontFamily: "'DM Sans', -apple-system, sans-serif",
        }}>
          <style>{`
            @keyframes chatSlideIn {
              from { opacity: 0; transform: translateY(12px) scale(0.97); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2332, #2c4a6e)',
            padding: '1rem 1.25rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>H</span>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Holly's Assistant</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Online now
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '0.25rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1a2332, #2c4a6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 800 }}>H</span>
                </div>
                <div style={{ padding: '0.6rem 0.9rem', background: 'white', borderRadius: '14px 14px 14px 4px', border: '1px solid #e8e4df', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e0', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <style>{`@keyframes pulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }`}</style>
              </div>
            )}

            {/* Lead capture form */}
            {showLeadForm && !leadCaptured && (
              <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8e4df', padding: '1rem', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.82rem', color: '#1a2332', fontWeight: 600, marginBottom: '0.75rem' }}>
                  Want Holly to follow up with you?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input placeholder="Your name" value={leadForm.name} onChange={e => setLeadForm(d => ({ ...d, name: e.target.value }))} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.83rem', fontFamily: 'inherit', outline: 'none' }} />
                  <input placeholder="Email" type="email" value={leadForm.email} onChange={e => setLeadForm(d => ({ ...d, email: e.target.value }))} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.83rem', fontFamily: 'inherit', outline: 'none' }} />
                  <input placeholder="Phone (optional)" type="tel" value={leadForm.phone} onChange={e => setLeadForm(d => ({ ...d, phone: e.target.value }))} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e8e4df', fontSize: '0.83rem', fontFamily: 'inherit', outline: 'none' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={saveLead} disabled={!leadForm.name && !leadForm.email} style={{ flex: 1, background: '#e84393', color: 'white', border: 'none', padding: '0.55rem', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: (!leadForm.name && !leadForm.email) ? 0.5 : 1 }}>
                      Yes, follow up
                    </button>
                    <button onClick={() => { setShowLeadForm(false); setLeadCaptured(true); }} style={{ flex: 1, background: 'white', color: '#6b7a8d', border: '1px solid #e8e4df', padding: '0.55rem', borderRadius: '8px', fontSize: '0.83rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid #e8e4df', background: 'white', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about lakes, prices, regions..."
                rows={1}
                style={{
                  flex: 1, padding: '0.6rem 0.75rem', borderRadius: '10px',
                  border: '1px solid #e8e4df', fontSize: '0.85rem', fontFamily: 'inherit',
                  resize: 'none', outline: 'none', lineHeight: 1.5, maxHeight: '100px',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  background: '#e84393', border: 'none', borderRadius: '10px',
                  width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  opacity: (!input.trim() || loading) ? 0.5 : 1, transition: 'opacity 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <a href="tel:5174033413" style={{ fontSize: '0.72rem', color: '#94a3b8', textDecoration: 'none' }}>
                Or call Holly: (517) 403-3413
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
