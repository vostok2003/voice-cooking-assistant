import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { getStartCommand, getSayPrompt, getStepText, getTimeText } from '../utils/languages';
import { speak as enhancedSpeak, cancelSpeech } from '../utils/speechSynthesis';

export default function CookMode({ recipe, onSpeak, onStopSpeaking, language = 'en-IN', speechSpeed = 1.0 }) {
  const [isCooking, setIsCooking] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isWaitingForStart, setIsWaitingForStart] = useState(false);
  const [cookingStatus, setCookingStatus] = useState(''); // 'speaking', 'waiting', 'timer', 'complete'
  const [recognitionPermissionGranted, setRecognitionPermissionGranted] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [tasteRating, setTasteRating] = useState({
    sweet: 0,
    salty: 0,
    spicy: 0,
    sour: 0,
    bitter: 0,
    umami: 0
  });
  const [userTasteNotes, setUserTasteNotes] = useState('');
  
  const timerIntervalRef = useRef(null);
  const startRecognitionRef = useRef(null);
  const isWaitingRef = useRef(false);
  const isCookingRef = useRef(false);
  const currentStepIndexRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => {
    isWaitingRef.current = isWaitingForStart;
    isCookingRef.current = isCooking;
    currentStepIndexRef.current = currentStepIndex;
  }, [isWaitingForStart, isCooking, currentStepIndex]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (startRecognitionRef.current) {
      try {
        startRecognitionRef.current.stop();
      } catch (e) {}
      startRecognitionRef.current = null;
    }
    // Use enhanced speech cancellation
    cancelSpeech();
  };

  const speakText = (text, onComplete) => {
    if (!text) {
      console.log('Cannot speak: text missing');
      if (onComplete) onComplete();
      return;
    }
    
    console.log('🔊 Queuing speech:', text.substring(0, 50) + '...');
    console.log(`Using language: ${language}, speed: ${speechSpeed}x`);
    
    // Use enhanced speech synthesis with ResponsiveVoice support
    enhancedSpeak(text, language, {
      rate: speechSpeed,
      pitch: 1,
      volume: 1,
      onStart: () => {
        console.log('✅ Speech STARTED - you should hear it now! 🔊');
        if (onSpeak) onSpeak();
      },
      onEnd: () => {
        console.log('✅ Speech completed successfully');
        if (onComplete) onComplete();
      },
      onError: (error) => {
        console.error('❌ Speech error:', error);
        if (onComplete) onComplete();
      },
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const proceedToNextStep = useCallback(() => {
    if (currentStepIndexRef.current < recipe?.steps?.length - 1) {
      const nextIndex = currentStepIndexRef.current + 1;
      setCurrentStepIndex(nextIndex);
      setTimerSeconds(0);
      setIsTimerRunning(false);
      // speakCurrentInstruction will be called via useEffect
    } else {
      // Recipe complete
      speakText("Congratulations! You have completed the recipe.");
      setCookingStatus('complete');
      setIsWaitingForStart(false);
      setIsTimerRunning(false);
      // Show rating form immediately when recipe is complete
      setShowRating(true);
    }
  }, [recipe]);

  const onTimerComplete = useCallback(() => {
    // Don't speak "Time's up" - it interrupts and causes confusion
    // Just move to next step which will speak the next instruction
    console.log('⏰ Timer completed - moving to next step');
    proceedToNextStep();
  }, [proceedToNextStep]);

  const handleStartCommand = useCallback(() => {
    if (!isWaitingRef.current) return;
    
    setIsWaitingForStart(false);
    if (startRecognitionRef.current) {
      try {
        startRecognitionRef.current.stop();
      } catch (e) {}
      startRecognitionRef.current = null;
    }

    const step = recipe?.steps?.[currentStepIndexRef.current];
    if (step?.estimateSeconds > 0) {
      // Start timer
      setTimerSeconds(step.estimateSeconds);
      setIsTimerRunning(true);
      setCookingStatus('timer');
      // Don't speak "Timer started" - it interrupts the instruction
      // The timer display shows the time anyway
      console.log(`⏰ Timer started: ${formatTime(step.estimateSeconds)}`);
    } else {
      // No timer, move to next step immediately
      proceedToNextStep();
    }
  }, [recipe, proceedToNextStep]);

  // Request microphone permission when component mounts or when cooking starts
  const requestMicrophonePermission = useCallback(async () => {
    try {
      // Request permission using navigator.mediaDevices.getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setRecognitionPermissionGranted(true);
      setRecognitionError(null);
      console.log('✅ Microphone permission granted');
      return true;
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      setRecognitionPermissionGranted(false);
      setRecognitionError(err.message || 'Microphone permission denied');
      return false;
    }
  }, []);

  const listenForStart = useCallback(() => {
    // Clean up any existing recognition first
    if (startRecognitionRef.current) {
      try {
        startRecognitionRef.current.stop();
        startRecognitionRef.current.abort();
      } catch (e) {
        // Ignore errors
      }
      startRecognitionRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('⚠️ Speech recognition not available in this browser');
      setRecognitionError('Speech recognition not supported');
      // Fallback: show manual button, don't auto-proceed
      return;
    }

    let recognitionAttempts = 0;
    const maxAttempts = 3; // Reduced from 5 to 3
    let isRestarting = false;
    let lastRestartTime = 0;
    const MIN_RESTART_INTERVAL = 2000; // Minimum 2 seconds between restarts

    const startRecognition = () => {
      // Check if we're restarting too quickly
      const now = Date.now();
      if (now - lastRestartTime < MIN_RESTART_INTERVAL) {
        console.log('⚠️ Preventing rapid restart - waiting...');
        return;
      }
      lastRestartTime = now;

      if (!isWaitingRef.current || !isCookingRef.current || isRestarting) {
        return;
      }

      try {
        // Clean up old recognition if exists
        if (startRecognitionRef.current) {
          try {
            startRecognitionRef.current.stop();
            startRecognitionRef.current.abort();
          } catch (e) {}
          startRecognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening continuously
        recognition.interimResults = false;
        recognition.lang = language;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          const startCmd = getStartCommand(language);
          console.log(`✅ Listening for "${startCmd}" command...`);
          setRecognitionError(null);
          recognitionAttempts = 0; // Reset on successful start
          isRestarting = false;
        };

        recognition.onresult = (event) => {
          const transcript = event.results[event.resultIndex][0].transcript.toLowerCase().trim();
          const startCmd = getStartCommand(language).toLowerCase();
          console.log('🎤 Heard:', transcript);
          if (transcript.includes(startCmd)) {
            console.log(`✅ Start command "${startCmd}" detected!`);
            try {
              recognition.stop();
              recognition.abort();
            } catch (e) {}
            startRecognitionRef.current = null;
            handleStartCommand();
          }
        };

        recognition.onerror = (event) => {
          if (event.error === 'aborted') {
            // Aborted is normal when we stop it ourselves
            return;
          }
          if (event.error === 'no-speech') {
            // No speech is normal with continuous mode, just keep listening
            console.log('No speech detected, continuing to listen...');
            return;
          }
          
          console.log('⚠️ Recognition error:', event.error);
          setRecognitionError(`Recognition error: ${event.error}`);
          
          // Don't restart on certain fatal errors
          if (event.error === 'not-allowed') {
            console.error('❌ Microphone permission denied');
            setRecognitionError('Microphone permission denied. Please allow microphone access.');
            setRecognitionPermissionGranted(false);
            return;
          }
          
          if (event.error === 'network' || event.error === 'service-not-allowed') {
            console.error('❌ Fatal recognition error:', event.error);
            setRecognitionError(`Recognition unavailable: ${event.error}`);
            return;
          }

          // For other errors, try to restart (continuous mode should handle it, but just in case)
          if (isWaitingRef.current && isCookingRef.current && recognitionAttempts < maxAttempts) {
            recognitionAttempts++;
            console.log(`Attempting restart ${recognitionAttempts}/${maxAttempts}`);
            isRestarting = true;
            setTimeout(() => {
              isRestarting = false;
              if (isWaitingRef.current && isCookingRef.current) {
                // Only restart if recognition actually stopped
                if (!startRecognitionRef.current) {
                  startRecognition();
                }
              }
            }, 2000); // Increased to 2 seconds
          } else if (recognitionAttempts >= maxAttempts) {
            console.log('Max recognition restart attempts reached. Please use manual start button.');
            setRecognitionError('Voice recognition unavailable. Please use the "Start Timer" button.');
          }
        };

        recognition.onend = () => {
          console.log('Recognition ended');
          // With continuous=true, onend should only fire on error or manual stop
          // Only restart if we're still waiting and haven't exceeded attempts
          if (isWaitingRef.current && isCookingRef.current && !isRestarting && recognitionAttempts < maxAttempts) {
            recognitionAttempts++;
            // Wait before restarting to prevent rapid loops
            setTimeout(() => {
              if (isWaitingRef.current && isCookingRef.current && !isRestarting) {
                // Check if recognition is not already active
                if (!startRecognitionRef.current || 
                    (startRecognitionRef.current && 
                     (startRecognitionRef.current.readyState === undefined ||
                      startRecognitionRef.current.readyState === 2 ||
                      startRecognitionRef.current.readyState === 0))) {
                  startRecognition();
                }
              }
            }, 1500); // Increased delay to 1.5 seconds to prevent rapid restarts
          }
        };

        startRecognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (startErr) {
          console.error('❌ Error calling recognition.start():', startErr);
          // If it's a permission error, request permission
          if (startErr.message && startErr.message.includes('not-allowed')) {
            setRecognitionError('Microphone permission needed. Please click "Request Microphone Access" button.');
            setRecognitionPermissionGranted(false);
          } else {
            setRecognitionError(`Failed to start: ${startErr.message}`);
          }
          startRecognitionRef.current = null;
        }
      } catch (err) {
        console.error('❌ Error creating recognition:', err);
        setRecognitionError(`Recognition error: ${err.message}`);
        startRecognitionRef.current = null;
      }
    };

    // Request permission first if not already granted
    if (!recognitionPermissionGranted) {
      requestMicrophonePermission().then((granted) => {
        if (granted && isWaitingRef.current && isCookingRef.current) {
          // Small delay to ensure permission is fully processed
          setTimeout(() => {
            if (isWaitingRef.current && isCookingRef.current) {
              startRecognition();
            }
          }, 300);
        } else if (!granted && isWaitingRef.current && isCookingRef.current) {
          // Permission denied - show manual button
          setRecognitionError('Microphone permission denied. Use "Start Timer" button instead.');
        }
      });
    } else {
      // Permission already granted, start immediately
      // Small delay to ensure previous recognition is stopped
      setTimeout(() => {
        if (isWaitingRef.current && isCookingRef.current) {
          startRecognition();
        }
      }, 300);
    }
  }, [handleStartCommand, recognitionPermissionGranted, requestMicrophonePermission]);

  const speakCurrentInstruction = useCallback(() => {
    if (!recipe?.steps || currentStepIndexRef.current >= recipe.steps.length) {
      // Recipe complete
      speakText("Congratulations! You have completed the recipe.");
      setCookingStatus('complete');
      setIsWaitingForStart(false);
      return;
    }

    const step = recipe.steps[currentStepIndexRef.current];
    const stepNumber = currentStepIndexRef.current + 1;
    const totalSteps = recipe.steps.length;
    const sayPrompt = getSayPrompt(language);
    const stepText = getStepText(language, stepNumber, totalSteps);
    
    let instructionText = `${stepText}. ${step.instruction}`;
    
    if (step.estimateSeconds > 0) {
      const minutes = Math.floor(step.estimateSeconds / 60);
      const seconds = step.estimateSeconds % 60;
      const timeText = getTimeText(language, minutes, seconds);
      if (timeText) {
        instructionText += ` ${timeText}`;
      }
      instructionText += ` ${sayPrompt} to begin the timer.`;
    } else {
      instructionText += ` ${sayPrompt} for the next step.`;
    }

    setCookingStatus('speaking');
    speakText(instructionText, () => {
      // After speaking completes
      if (step.estimateSeconds > 0) {
        setCookingStatus('waiting');
        setIsWaitingForStart(true);
        listenForStart();
      } else {
        // No timer, just wait for start command to proceed
        setCookingStatus('waiting');
        setIsWaitingForStart(true);
        listenForStart();
      }
    });
  }, [recipe, listenForStart]);

  // Removed - we now handle initial speech in handleStartCooking
  // to ensure it's triggered from user interaction

  // Speak instruction when step index changes (but not on initial cooking start)
  useEffect(() => {
    if (isCooking && recipe?.steps && currentStepIndex < recipe.steps.length && currentStepIndex > 0) {
      // Wait for previous step to finish before speaking next
      // Use a short delay to ensure browser is ready
      const timeoutId = setTimeout(() => {
        // Cancel any existing speech first
        cancelSpeech();
        // Small delay after cancel
        setTimeout(() => {
          speakCurrentInstruction();
        }, 100);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [currentStepIndex, isCooking, recipe, speakCurrentInstruction]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            onTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds, onTimerComplete]);

  const handleStartCooking = () => {
    if (!recipe?.steps || recipe.steps.length === 0) {
      alert('No recipe steps available');
      return;
    }
    
    // Stop any speech from ChatPage first
    cancelSpeech();
    
    // Call stopSpeaking to notify parent component
    if (onStopSpeaking) {
      onStopSpeaking();
    }
    
    // Request microphone permission proactively when user clicks "Cook Now"
    // This ensures permission is granted from a user gesture context
    requestMicrophonePermission();
    
    setIsCooking(true);
    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    
    // CRITICAL: Speak IMMEDIATELY in the same execution context as the button click
    // DO NOT use setTimeout - it breaks the user gesture context for audio
    if (recipe.steps && recipe.steps.length > 0) {
      const step = recipe.steps[0];
      const stepNumber = 1;
      const totalSteps = recipe.steps.length;
      const sayPrompt = getSayPrompt(language);
      const stepText = getStepText(language, stepNumber, totalSteps);
      
      let instructionText = `${stepText}. ${step.instruction}`;
      
      if (step.estimateSeconds > 0) {
        const minutes = Math.floor(step.estimateSeconds / 60);
        const seconds = step.estimateSeconds % 60;
        const timeText = getTimeText(language, minutes, seconds);
        if (timeText) {
          instructionText += ` ${timeText}`;
        }
        instructionText += ` ${sayPrompt} to begin the timer.`;
      } else {
        instructionText += ` ${sayPrompt} for the next step.`;
      }
      
      // SPEAK IMMEDIATELY using enhanced speech synthesis
      console.log('🔊 Speaking first instruction IMMEDIATELY from button click...');
      setCookingStatus('speaking');
      
      enhancedSpeak(instructionText, language, {
        rate: speechSpeed,
        pitch: 1.0,
        volume: 1.0,
        onStart: () => {
          console.log('✅ First instruction started speaking');
        },
        onEnd: () => {
          setCookingStatus('waiting');
          setIsWaitingForStart(true);
          listenForStart();
        },
        onError: (e) => {
          console.error('Speech error:', e);
          setCookingStatus('waiting');
          setIsWaitingForStart(true);
          listenForStart();
        },
      });
    }
  };

  const handleStopCooking = () => {
    cleanup();
    // Show rating form when cooking is complete
    if (cookingStatus === 'complete') {
      setShowRating(true);
    }
    setIsCooking(false);
    setCurrentStepIndex(0);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setIsWaitingForStart(false);
    setCookingStatus('');
    if (onStopSpeaking) onStopSpeaking();
  };

  const handleRestartTimer = () => {
    if (currentStepIndexRef.current >= recipe.steps.length) return;
    const step = recipe.steps[currentStepIndexRef.current];
    if (step.estimateSeconds > 0) {
      setIsTimerRunning(false);
      setTimerSeconds(step.estimateSeconds);
      setIsWaitingForStart(false);
      if (startRecognitionRef.current) {
        try {
          startRecognitionRef.current.stop();
        } catch (e) {}
      }
      // Don't speak "Timer restarted" - just restart listening
      console.log('⏰ Timer restarted');
      setIsWaitingForStart(true);
      listenForStart();
    }
  };

  const handleSkipStep = () => {
    // Stop any ongoing timer
    setIsTimerRunning(false);
    setTimerSeconds(0);
    
    // Stop listening for start command
    setIsWaitingForStart(false);
    if (startRecognitionRef.current) {
      try {
        startRecognitionRef.current.stop();
      } catch (e) {}
      startRecognitionRef.current = null;
    }
    
    // Don't cancel current speech - let it finish or just move on
    // Cancel only if user explicitly skipped
    
    // Move to next step
    if (currentStepIndexRef.current < recipe.steps.length - 1) {
      console.log(`⏭ Step ${currentStepIndexRef.current + 1} skipped`);
      // Cancel current speech since user skipped
      cancelSpeech();
      // Wait a moment then proceed
      setTimeout(() => {
        proceedToNextStep();
      }, 200);
    } else {
      // Last step - just complete
      console.log('⏭ Last step skipped - recipe complete');
      cancelSpeech();
      setCookingStatus('complete');
      setIsWaitingForStart(false);
      setIsTimerRunning(false);
      // Show rating form immediately when recipe is complete
      setShowRating(true);
    }
  };

  const handleRestartRecipe = () => {
    cleanup();
    setCurrentStepIndex(0);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setIsWaitingForStart(false);
    setCookingStatus('');
    speakCurrentInstruction();
  };

  const handleSubmitRating = async () => {
    try {
      console.log('Submitting taste rating for recipe:', recipe._id);
      console.log('Taste rating data:', tasteRating);
      console.log('User notes:', userTasteNotes);
      
      const response = await api.post(`/recipes/${recipe._id}/taste-rating`, {
        tasteRating,
        userTasteNotes
      });
      
      console.log('Taste rating saved successfully:', response.data);
      setShowRating(false);
      // Reset rating form
      setTasteRating({
        sweet: 0,
        salty: 0,
        spicy: 0,
        sour: 0,
        bitter: 0,
        umami: 0
      });
      setUserTasteNotes('');
    } catch (err) {
      console.error('Error saving taste rating:', err);
      alert('Failed to save taste rating. Please try again.');
    }
  };

  if (!recipe?.steps || recipe.steps.length === 0) {
    return null;
  }

  const currentStep = recipe.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / recipe.steps.length) * 100;

  return (
    <div className="cook-mode-container">
      {!isCooking ? (
        <button 
          onClick={handleStartCooking} 
          className="btn-cook-now"
        >
          🍳 Cook Now
        </button>
      ) : (
        <div className="cook-mode-panel">
          <div className="cook-mode-header">
            <h3>🍳 Cooking Mode: {recipe.title}</h3>
            <button onClick={handleStopCooking} className="btn-stop-cooking">
              Stop Cooking
            </button>
          </div>

          <div className="cook-progress">
            <div className="cook-progress-bar">
              <div 
                className="cook-progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="cook-progress-text">
              Step {currentStepIndex + 1} of {recipe.steps.length}
            </div>
          </div>

          <div className="cook-current-step">
            <div className="cook-step-number">Step {currentStepIndex + 1}</div>
            <div className="cook-step-instruction">{currentStep?.instruction}</div>
            
            {currentStep?.estimateSeconds > 0 && (
              <div className="cook-timer-section">
                {isTimerRunning ? (
                  <div className="cook-timer-display">
                    <div className="cook-timer-time">{formatTime(timerSeconds)}</div>
                    <div className="cook-timer-label">Time Remaining</div>
                  </div>
                ) : isWaitingForStart ? (
                  <div className="cook-waiting-status">
                    <div className="cook-waiting-icon">🎤</div>
                    <div>Waiting for you to say "{getStartCommand(language)}"</div>
                    {recognitionError && (
                      <div className="cook-recognition-error">
                        {recognitionError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cook-timer-info">
                    Timer: {formatTime(currentStep.estimateSeconds)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="cook-controls">
            <button 
              onClick={handleSkipStep} 
              className="btn-skip-step"
              disabled={cookingStatus === 'complete'}
            >
              ⏭ Skip Step
            </button>
            <button 
              onClick={handleRestartTimer} 
              className="btn-restart-timer"
              disabled={!isTimerRunning && !isWaitingForStart}
            >
              ↻ Restart Timer
            </button>
            {isWaitingForStart && (
              <button
                onClick={() => {
                  // Manual start timer button - bypasses speech recognition
                  console.log('Manual start timer clicked');
                  handleStartCommand();
                }}
                className="btn-start-timer-manual"
                title="Click to start timer manually (if voice recognition isn't working)"
              >
                ▶ Start Timer
              </button>
            )}
            {!recognitionPermissionGranted && isWaitingForStart && (
              <button
                onClick={async () => {
                  const granted = await requestMicrophonePermission();
                  if (granted && isWaitingForStart && isCooking) {
                    // Restart listening
                    listenForStart();
                  }
                }}
                className="btn-request-microphone"
                title="Request microphone permission for voice commands"
              >
                🎤 Request Microphone Access
              </button>
            )}
            <button 
              onClick={handleRestartRecipe} 
              className="btn-restart-recipe"
            >
              ⟲ Restart Recipe
            </button>
            <button 
              onClick={() => {
                // Test speech - ensure this is direct user interaction
                console.log('🧪 Testing speech synthesis...');
                if (!window.speechSynthesis) {
                  alert('Speech synthesis not supported in this browser');
                  return;
                }
                
                const testUtterance = new SpeechSynthesisUtterance('Testing speech synthesis. Can you hear this?');
                testUtterance.volume = 1.0;
                testUtterance.rate = 0.9;
                testUtterance.pitch = 1.0;
                testUtterance.lang = language;
                
                // Get voices
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                  const languageVoice = voices.find(v => v.lang === language) || 
                                        voices.find(v => v.lang.startsWith(language.split('-')[0])) ||
                                        voices[0];
                  testUtterance.voice = languageVoice;
                  console.log('Using voice:', languageVoice.name, 'for language:', language);
                }
                
                // Cancel any existing speech
                cancelSpeech();
                
                // Speak immediately
                enhancedSpeak('Testing speech synthesis. Can you hear this?', language, {
                  rate: speechSpeed,
                  pitch: 1.0,
                  volume: 1.0,
                  onStart: () => console.log('✅ Test speech started'),
                  onEnd: () => console.log('✅ Test speech ended'),
                  onError: (e) => console.error('❌ Test speech error:', e),
                });
              }}
              className="btn-test-speech"
              title="Test if speech synthesis is working - click to hear test message"
            >
              🔊 Test Speech
            </button>
          </div>

          {cookingStatus === 'complete' && (
            <div className="cook-complete">
              🎉 Recipe Complete!
            </div>
          )}
          
          {showRating && (
            <div className="taste-rating-form">
              <h3>Rate This Recipe</h3>
              <p>Help us understand your taste preferences!</p>
              
              <div className="taste-ratings">
                {Object.keys(tasteRating).map((taste) => (
                  <div key={taste} className="taste-rating-item">
                    <label>{taste.charAt(0).toUpperCase() + taste.slice(1)}:</label>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= tasteRating[taste] ? 'filled' : ''}`}
                          onClick={() => setTasteRating({
                            ...tasteRating,
                            [taste]: star
                          })}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="taste-notes">
                <label>Additional Notes:</label>
                <textarea
                  value={userTasteNotes}
                  onChange={(e) => setUserTasteNotes(e.target.value)}
                  placeholder="Anything else you'd like to share about this recipe?"
                />
              </div>
              
              <div className="rating-actions">
                <button onClick={handleSubmitRating} className="btn-submit-rating">
                  Submit Rating
                </button>
                <button onClick={() => setShowRating(false)} className="btn-skip-rating">
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

