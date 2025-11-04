import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CookMode from './CookMode';
import TasteProfileInfo from './TasteProfileInfo';
import { AuthContext } from '../context/AuthContext';
import { LANGUAGES, getLanguageFlag, getLanguageSupportNote } from '../utils/languages';
import { scaleRecipe, getTimeAdjustmentText } from '../utils/recipeScaler';

export default function ChatWindow({ history = [], onSend, isSpeaking = false, onStopSpeaking, recipe }) {
  const { user, updateLanguage, updateSpeechSpeed } = useContext(AuthContext);
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || 'en-IN');
  const [speechSpeed, setSpeechSpeed] = useState(user?.speechSpeed || 1.0);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const [showServingsDropdown, setShowServingsDropdown] = useState(false);
  const [servings, setServings] = useState(recipe?.originalServings || 2);
  const [scaledRecipe, setScaledRecipe] = useState(null);
  const recognitionRef = useRef(null);
  const interimTextRef = useRef('');
  const languageDropdownRef = useRef(null);
  const speedDropdownRef = useRef(null);
  const servingsDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(event.target)) {
        setShowSpeedDropdown(false);
      }
      if (servingsDropdownRef.current && !servingsDropdownRef.current.contains(event.target)) {
        setShowServingsDropdown(false);
      }
    };

    if (showLanguageDropdown || showSpeedDropdown || showServingsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown, showSpeedDropdown, showServingsDropdown]);

  useEffect(() => {
    // Sync selected language and speed with user preference
    if (user?.language) {
      setSelectedLanguage(user.language);
    }
    if (user?.speechSpeed !== undefined) {
      setSpeechSpeed(user.speechSpeed);
    }
  }, [user]);

  // Scale recipe when servings change
  useEffect(() => {
    if (recipe) {
      const scaled = scaleRecipe(recipe, servings);
      setScaledRecipe(scaled);
    } else {
      setScaledRecipe(null);
    }
  }, [recipe, servings]);

  // Initialize servings when recipe first loads
  useEffect(() => {
    if (recipe?.originalServings) {
      setServings(recipe.originalServings);
    }
  }, [recipe?._id]); // Only run when recipe ID changes (new recipe)

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        console.log(`✅ Speech recognition started for language: ${selectedLanguage}`);
        setIsListening(true);
        interimTextRef.current = '';
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log(`Recognized text (${selectedLanguage}):`, transcript);
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
        console.error('Speech recognition error:', event.error, 'Language:', selectedLanguage);
        
        if (event.error === 'language-not-supported') {
          console.warn(`⚠️ Language ${selectedLanguage} may not be fully supported by your browser`);
          alert(`Speech recognition for ${selectedLanguage} may not be fully supported by your browser. Please try typing instead or switch to a supported language like English.`);
        } else if (event.error === 'network') {
          console.warn('⚠️ Network error - speech recognition requires internet connection');
        } else if (event.error === 'not-allowed') {
          console.warn('⚠️ Microphone permission denied');
        }
        
        setIsListening(false);
        if (event.error === 'no-speech') {
          // Auto-stop if no speech detected after timeout
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
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
  }, [selectedLanguage]);

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

  const handleLanguageChange = async (langCode) => {
    setSelectedLanguage(langCode);
    setShowLanguageDropdown(false);
    
    // Stop current recognition if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    // Show support note if language has limited support
    const supportNote = getLanguageSupportNote(langCode);
    if (supportNote) {
      console.log('⚠️', supportNote);
      // Optionally show a brief toast notification
    }
    
    // Update in backend
    try {
      await updateLanguage(langCode);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const handleSpeedChange = async (speed) => {
    setSpeechSpeed(speed);
    setShowSpeedDropdown(false);
    
    // Update in backend
    try {
      await updateSpeechSpeed(speed);
    } catch (error) {
      console.error('Failed to save speech speed preference:', error);
    }
  };

  const handleServingsChange = (newServings) => {
    setServings(newServings);
    setShowServingsDropdown(false);
    
    // Show time adjustment message
    if (recipe?.originalServings && newServings !== recipe.originalServings) {
      const timeMsg = getTimeAdjustmentText(recipe.originalServings, newServings, selectedLanguage);
      console.log('⏱️', timeMsg);
    }
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
            {/* Language Selector */}
            <div className="language-selector" ref={languageDropdownRef}>
              <button
                type="button"
                className="language-button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                title="Select language"
              >
                <span className="language-flag">{getLanguageFlag(selectedLanguage)}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
              
              {showLanguageDropdown && (
                <div className="language-dropdown">
                  <div className="language-dropdown-header">Select Language</div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`language-option ${selectedLanguage === lang.code ? 'active' : ''}`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <span className="language-flag">{lang.flag}</span>
                      <span className="language-label">{lang.label}</span>
                      {selectedLanguage === lang.code && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Speech Speed Selector */}
            <div className="speed-selector" ref={speedDropdownRef}>
              <button
                type="button"
                className="speed-button"
                onClick={() => setShowSpeedDropdown(!showSpeedDropdown)}
                title="Speech speed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <span className="speed-label">{speechSpeed}x</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
              
              {showSpeedDropdown && (
                <div className="speed-dropdown">
                  <div className="speed-dropdown-header">Speech Speed</div>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      className={`speed-option ${speechSpeed === speed ? 'active' : ''}`}
                      onClick={() => handleSpeedChange(speed)}
                    >
                      <span className="speed-value">{speed}x</span>
                      <span className="speed-description">
                        {speed < 0.75 ? 'Very Slow' : speed < 1 ? 'Slow' : speed === 1 ? 'Normal' : speed <= 1.5 ? 'Fast' : 'Very Fast'}
                      </span>
                      {speechSpeed === speed && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Servings Selector - Only show when recipe exists */}
            {recipe && (
              <div className="servings-selector" ref={servingsDropdownRef}>
                <button
                  type="button"
                  className="servings-button"
                  onClick={() => setShowServingsDropdown(!showServingsDropdown)}
                  title="Adjust servings"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                    <path d="M11 7h2v10h-2z"/>
                  </svg>
                  <span className="servings-label">{servings} servings</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </button>
                
                {showServingsDropdown && (
                  <div className="servings-dropdown">
                    <div className="servings-dropdown-header">Adjust Servings</div>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={`servings-option ${servings === count ? 'active' : ''}`}
                        onClick={() => handleServingsChange(count)}
                      >
                        <span className="servings-count">{count}</span>
                        <span className="servings-description">
                          {count === 1 ? 'person' : `people`}
                        </span>
                        {servings === count && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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
        recipe={scaledRecipe || recipe} 
        onSpeak={() => {}} 
        onStopSpeaking={onStopSpeaking}
        language={selectedLanguage}
        speechSpeed={speechSpeed}
      />
    </div>
  );
}

