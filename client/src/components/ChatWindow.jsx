import React, { useState } from 'react';

export default function ChatWindow({ history = [], onSend }) {
  const [text, setText] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onSend(text.trim());
    setText('');
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {history.length === 0 && <div className="muted">No messages yet — start by typing a prompt below.</div>}
        {history.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'assistant'}`}>
            <div className="msg-body">{m.text}</div>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a prompt to ask Gemini..." />
        <button type="submit" className="btn-primary">Send</button>
      </form>
    </div>
  );
}

