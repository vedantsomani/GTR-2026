import React, { useState, useRef, useEffect } from 'react';

const MAX_LEN = 500;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'greeting',
      role: 'bot',
      text: 'Registration is **FREE** and open till **April 20** on Unstop. What do you want to know about GTR 2026?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      const reply = data.text || data.response || 'Something went wrong, try again.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 2, role: 'bot', text: 'Network issue — check your connection and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) => {
    // Handle **bold** and links
    const parts = text.split(/(\*\*.*?\*\*|https?:\/\/\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('http')) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#00cec9', textDecoration: 'underline' }}>{part.length > 40 ? 'Open Link ↗' : part}</a>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const showQuickReplies = messages.length <= 2 && !loading;

  return (
    <>
      {/* Bottom prompt bar */}
      <div
        onClick={() => setIsOpen(true)}
        className={`chatbot-inline-prompt ${isOpen ? 'hidden' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
      >
        <div className="chatbot-inline-icon">💬</div>
        <div className="chatbot-inline-text">Ask about GTR 2026</div>
        <button tabIndex={-1} className="chatbot-inline-action">Ask</button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div className="chatbot-panel chatbot-panel-open">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <img src="/purple-logo.png" alt="GTR Avatar" className="chatbot-avatar-img" />
              <div>
                <div className="chatbot-header-title">GTR 2026 — Grand Tech Racing</div>
                <div className="chatbot-header-status">Online</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="chatbot-close-btn" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`chatbot-msg chatbot-msg-${m.role}`}>
                <div className="chatbot-msg-bubble">{renderText(m.text)}</div>
              </div>
            ))}

            {showQuickReplies && (
              <div className="chatbot-quick-replies">
                {['How to register?', 'Car specs', 'Prize pool', 'Who hosts this?'].map(q => (
                  <button key={q} className="chatbot-quick-btn" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}

            {loading && (
              <div className="chatbot-msg chatbot-msg-bot">
                <div className="chatbot-msg-bubble chatbot-typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="chatbot-input-bar">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here..."
              disabled={loading}
              maxLength={MAX_LEN}
              className="chatbot-input"
              autoComplete="off"
            />
            <button type="submit" disabled={loading || !input.trim()} className="chatbot-send-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
