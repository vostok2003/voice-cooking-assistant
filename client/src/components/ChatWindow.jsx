import React, { useState, useEffect, useRef } from 'react';

export default function ChatWindow({ history = [], onSend }) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const interimTextRef = useRef('');

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        interimTextRef.current = '';
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update text with final transcript and show interim results
        if (finalTranscript) {
          setText(prev => {
            const base = prev.replace(interimTextRef.current, '').trim();
            interimTextRef.current = '';
            return (base + (base ? ' ' : '') + finalTranscript).trim();
          });
        } else if (interimTranscript) {
          // Show interim results in the input
          setText(prev => {
            const base = prev.replace(interimTextRef.current, '').trim();
            interimTextRef.current = interimTranscript;
            return base + (base ? ' ' : '') + interimTranscript;
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          // Auto-stop if no speech detected after timeout
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Clean up any remaining interim text
        if (interimTextRef.current) {
          setText(prev => prev.replace(interimTextRef.current, '').trim());
          interimTextRef.current = '';
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Clean up interim text when stopping
      if (interimTextRef.current) {
        setText(prev => prev.replace(interimTextRef.current, '').trim());
        interimTextRef.current = '';
      }
    } else {
      try {
        interimTextRef.current = '';
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    // Stop listening if still active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    await onSend(text.trim());
    setText('');
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {history.length === 0 && <div className="muted">No messages yet — start by typing a prompt below or use the microphone to speak.</div>}
        {history.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'assistant'}`}>
            <div className="msg-body">{m.text}</div>
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input 
          value={text} 
          onChange={e=>setText(e.target.value)} 
          placeholder={isListening ? "Listening... Speak now..." : "Type a prompt to ask Gemini or use microphone..."}
          className={isListening ? 'listening' : ''}
        />
        <button
          type="button"
          onClick={toggleListening}
          disabled={!isSupported}
          className={`mic-button ${isListening ? 'listening' : ''} ${!isSupported ? 'disabled' : ''}`}
          title={!isSupported ? 'Speech recognition not supported in this browser' : (isListening ? 'Stop listening' : 'Start voice input')}
          style={{ 
            opacity: isSupported ? 1 : 0.5,
            cursor: isSupported ? 'pointer' : 'not-allowed'
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill={isListening ? '#ef4444' : 'currentColor'}
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        <button type="submit" className="btn-primary">Send</button>
      </form>
    </div>
  );
}

