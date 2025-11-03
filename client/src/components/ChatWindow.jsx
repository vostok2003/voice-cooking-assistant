import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CookMode from './CookMode';
import TasteProfileInfo from './TasteProfileInfo';

export default function ChatWindow({ history = [], onSend, isSpeaking = false, onStopSpeaking, recipe }) {
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
    <div className="chat-window-container">
      <div className="chat-window glass-card">
        <div className="chat-messages-wrapper">
          <div className="chat-messages">
            {history.length === 0 && (
              <motion.div 
                className="chat-empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="empty-state-icon">🤖</div>
                <h3 className="empty-state-title">Start Your Cooking Journey</h3>
                <p className="empty-state-text">Ask me anything about cooking, recipes, or ingredients!</p>
                <div className="empty-state-suggestions">
                  <button className="suggestion-chip" onClick={() => setText("Give me a quick pasta recipe")}>Quick Pasta 🍝</button>
                  <button className="suggestion-chip" onClick={() => setText("Healthy breakfast ideas")}>Healthy Breakfast 🥞</button>
                  <button className="suggestion-chip" onClick={() => setText("Easy dessert recipes")}>Easy Dessert 🍰</button>
                </div>
              </motion.div>
            )}
            
            <AnimatePresence>
              {history.map((m, i) => (
                <motion.div 
                  key={i} 
                  className={`chat-message ${m.role}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <div className="message-avatar">
                    {m.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{m.text}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {recipe && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <TasteProfileInfo />
              </motion.div>
            )}
          </div>
        </div>

        <form className="chat-input-container" onSubmit={submit}>
          <div className="chat-input-wrapper">
            <input 
              value={text} 
              onChange={e=>setText(e.target.value)} 
              placeholder={isListening ? "Listening... Speak now..." : "Type your message or use voice..."}
              className={`chat-input ${isListening ? 'listening' : ''}`}
            />
            
            <div className="chat-input-actions">
              {isSpeaking && onStopSpeaking && (
                <motion.button
                  type="button"
                  onClick={onStopSpeaking}
                  className="btn-chat-stop"
                  title="Stop speaking"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                </motion.button>
              )}
              
              <motion.button
                type="button"
                onClick={toggleListening}
                disabled={!isSupported}
                className={`btn-chat-mic ${isListening ? 'listening' : ''} ${!isSupported ? 'disabled' : ''}`}
                title={!isSupported ? 'Speech recognition not supported' : (isListening ? 'Stop listening' : 'Start voice input')}
                whileHover={isSupported ? { scale: 1.1 } : {}}
                whileTap={isSupported ? { scale: 0.9 } : {}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                {isListening && <span className="mic-pulse"></span>}
              </motion.button>
              
              <motion.button 
                type="submit" 
                className="btn-chat-send"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!text.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
                </svg>
                <span>Send</span>
              </motion.button>
            </div>
          </div>
        </form>
      </div>

      <CookMode 
        recipe={recipe} 
        onSpeak={() => {}} 
        onStopSpeaking={onStopSpeaking}
      />
    </div>
  );
}

