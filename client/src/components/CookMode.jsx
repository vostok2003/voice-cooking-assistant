import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function CookMode({ recipe, onSpeak, onStopSpeaking }) {
  const [isCooking, setIsCooking] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isWaitingForStart, setIsWaitingForStart] = useState(false);
  const [cookingStatus, setCookingStatus] = useState(''); // 'speaking', 'waiting', 'timer', 'complete'
  const [recognitionPermissionGranted, setRecognitionPermissionGranted] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);
  
  const timerIntervalRef = useRef(null);
  const startRecognitionRef = useRef(null);
  const synthRef = useRef(null);
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
    synthRef.current = window.speechSynthesis;
    
    // Load voices - they might not be available immediately
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log(`Loaded ${voices.length} voices`);
      if (voices.length === 0) {
        // Voices might load asynchronously, try again
        setTimeout(loadVoices, 100);
      }
    };
    
    // Load voices when they become available
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
    
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
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const speakText = (text, onComplete) => {
    if (!synthRef.current || !text) {
      console.log('Cannot speak: synthRef or text missing');
      if (onComplete) onComplete();
      return;
    }
    
    console.log('🔊 Queuing speech:', text.substring(0, 50) + '...');
    
    // Ensure we have access to speech synthesis
    if (!window.speechSynthesis) {
      console.error('❌ Speech synthesis API not available');
      if (onComplete) onComplete();
      return;
    }
    
    // If speech is already active, queue the new speech (don't cancel)
    // SpeechSynthesis automatically queues utterances
    if (synthRef.current.speaking || synthRef.current.pending) {
      console.log('⏳ Speech in progress - will queue this new speech');
      // Just queue it - the API handles queuing automatically
      // But we need to ensure the callback still fires
      continueSpeaking();
      return;
    }
    
    continueSpeaking();
    
    function continueSpeaking() {
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      let hasStarted = false;
      let hasEnded = false;
      let startTimeout = null;
      
      utterance.onstart = () => {
        hasStarted = true;
        if (startTimeout) {
          clearTimeout(startTimeout);
          startTimeout = null;
        }
        console.log('✅ Speech STARTED - you should hear it now! 🔊');
        
        // Force audio context activation if needed
        // Some browsers require this for audio playback
        if (window.AudioContext || window.webkitAudioContext) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
              console.log('Audio context resumed');
            });
          }
        }
        
        // Double-check speech is actually speaking
        setTimeout(() => {
          const isActuallySpeaking = synthRef.current?.speaking || false;
          console.log('Speech verification:', {
            hasStarted,
            isActuallySpeaking,
            pending: synthRef.current?.pending,
            paused: synthRef.current?.paused,
            volume: utterance.volume,
            rate: utterance.rate
          });
          
          if (!isActuallySpeaking && !synthRef.current?.paused) {
            console.warn('⚠️ WARNING: Speech reported started but not actually speaking!');
            console.warn('This might be a browser issue. Please check:');
            console.warn('1. System volume is not muted');
            console.warn('2. Browser tab volume is not muted');
            console.warn('3. Browser allows autoplay');
          }
        }, 200);
      };
      
      if (onComplete) {
        utterance.onend = () => {
          hasEnded = true;
          console.log('✅ Speech completed successfully');
          if (startTimeout) clearTimeout(startTimeout);
          onComplete();
        };
        utterance.onerror = (event) => {
          console.log('Speech error:', event.error);
          // For interrupted errors, don't treat as failure if it already started
          if (event.error === 'interrupted' && hasStarted) {
            console.log('⚠️ Speech was interrupted after starting (may have been heard)');
          } else if (event.error === 'interrupted' && !hasStarted) {
            console.log('⚠️ Speech was interrupted before starting - will retry');
            // Retry once if interrupted before starting
            setTimeout(() => {
              if (!hasStarted) {
                try {
                  synthRef.current.speak(utterance);
                } catch (e) {
                  console.error('Retry failed:', e);
                  if (onComplete) onComplete();
                }
              }
            }, 300);
            return; // Don't call onComplete yet, wait for retry
          } else if (event.error) {
            console.error('❌ Speech error:', event.error);
          }
          
          if (!hasEnded && onComplete) {
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 100);
          }
          if (startTimeout) clearTimeout(startTimeout);
        };
      }
      
      // CRITICAL FIX: Call speak() synchronously in the same execution context
      // Browsers block audio if there's ANY async operation (setTimeout, Promise, etc.)
      try {
        console.log('🔊 Calling speak() SYNCHRONOUSLY...');
        console.log('Text length:', text.length, 'Preview:', text.substring(0, 50));
        
        // Check if browser supports speech synthesis
        if (!window.speechSynthesis) {
          console.error('❌ Speech synthesis not supported');
          if (onComplete) onComplete();
          return;
        }
        
        // Get voices - must be done synchronously
        let voices = window.speechSynthesis.getVoices();
        
        // If no voices, try loading them (but don't wait)
        if (voices.length === 0) {
          // Trigger voice loading
          window.speechSynthesis.getVoices();
          // Try again immediately
          voices = window.speechSynthesis.getVoices();
        }
        
        if (voices.length > 0) {
          const englishVoice = voices.find(v => 
            v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en')
          ) || voices[0];
          
          utterance.voice = englishVoice;
          console.log(`Using voice: ${englishVoice.name} (${englishVoice.lang})`);
        } else {
          console.warn('⚠️ No voices available - will use default');
        }
        
        // Set all properties synchronously
        utterance.volume = 1.0;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        
        // Cancel only if something is ACTUALLY speaking (not pending)
        if (synthRef.current.speaking) {
          console.log('Canceling existing speech...');
          synthRef.current.cancel();
        }
        
        // CRITICAL: Call speak() SYNCHRONOUSLY - no delays, no async operations
        console.log('🔊 CALLING speak() NOW - SYNCHRONOUS...');
        const speakResult = synthRef.current.speak(utterance);
        console.log('speak() returned:', speakResult);
        
        // Immediate status check
        console.log('Immediate status:', {
          speaking: synthRef.current.speaking,
          pending: synthRef.current.pending,
          paused: synthRef.current.paused
        });
        
        if (onSpeak) onSpeak();
      } catch (err) {
        console.error('❌ CRITICAL ERROR calling speak():', err);
        console.error('Error details:', err.message, err.stack);
        if (startTimeout) clearTimeout(startTimeout);
        if (onComplete) onComplete();
      }
    }
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
    const maxAttempts = 5;
    let isRestarting = false;

    const startRecognition = () => {
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
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('✅ Listening for "start" command...');
          setRecognitionError(null);
          recognitionAttempts = 0; // Reset on successful start
          isRestarting = false;
        };

        recognition.onresult = (event) => {
          const transcript = event.results[event.resultIndex][0].transcript.toLowerCase().trim();
          console.log('🎤 Heard:', transcript);
          if (transcript.includes('start')) {
            console.log('✅ Start command detected!');
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
            isRestarting = true;
            setTimeout(() => {
              if (isWaitingRef.current && isCookingRef.current && !isRestarting) {
                isRestarting = false;
                // Only restart if recognition actually stopped
                if (!startRecognitionRef.current || 
                    startRecognitionRef.current.readyState === SpeechRecognition.STOPPED ||
                    startRecognitionRef.current.readyState === SpeechRecognition.INACTIVE) {
                  startRecognition();
                }
              }
            }, 1000);
          }
        };

        recognition.onend = () => {
          console.log('Recognition ended');
          // With continuous=true, onend should only fire on error or manual stop
          // Only restart if we're still waiting and haven't exceeded attempts
          if (isWaitingRef.current && isCookingRef.current && !isRestarting && recognitionAttempts < maxAttempts) {
            // Wait before restarting to prevent rapid loops
            setTimeout(() => {
              if (isWaitingRef.current && isCookingRef.current && !isRestarting) {
                // Check if recognition is not already active
                if (!startRecognitionRef.current || 
                    (startRecognitionRef.current && 
                     (startRecognitionRef.current.readyState === SpeechRecognition.STOPPED ||
                      startRecognitionRef.current.readyState === SpeechRecognition.INACTIVE))) {
                  startRecognition();
                }
              }
            }, 1000);
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
    
    let instructionText = `Step ${stepNumber} of ${totalSteps}. ${step.instruction}`;
    
    if (step.estimateSeconds > 0) {
      const minutes = Math.floor(step.estimateSeconds / 60);
      const seconds = step.estimateSeconds % 60;
      if (minutes > 0 && seconds > 0) {
        instructionText += ` This step takes approximately ${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds > 1 ? 's' : ''}.`;
      } else if (minutes > 0) {
        instructionText += ` This step takes approximately ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      } else {
        instructionText += ` This step takes approximately ${seconds} second${seconds > 1 ? 's' : ''}.`;
      }
      instructionText += " Say 'start' when you're ready to begin the timer.";
    } else {
      instructionText += " Say 'start' when you're ready for the next step.";
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
        if (synthRef.current?.speaking) {
          synthRef.current.cancel();
        }
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
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
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
      
      let instructionText = `Step ${stepNumber} of ${totalSteps}. ${step.instruction}`;
      
      if (step.estimateSeconds > 0) {
        const minutes = Math.floor(step.estimateSeconds / 60);
        const seconds = step.estimateSeconds % 60;
        if (minutes > 0 && seconds > 0) {
          instructionText += ` This step takes approximately ${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds > 1 ? 's' : ''}.`;
        } else if (minutes > 0) {
          instructionText += ` This step takes approximately ${minutes} minute${minutes > 1 ? 's' : ''}.`;
        } else {
          instructionText += ` This step takes approximately ${seconds} second${seconds > 1 ? 's' : ''}.`;
        }
        instructionText += " Say 'start' when you're ready to begin the timer.";
      } else {
        instructionText += " Say 'start' when you're ready for the next step.";
      }
      
      // Speak IMMEDIATELY - no delays, no callbacks
      const utterance = new SpeechSynthesisUtterance(instructionText);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Get voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        utterance.voice = englishVoice;
      }
      
      // Set callbacks
      utterance.onend = () => {
        setCookingStatus('waiting');
        setIsWaitingForStart(true);
        listenForStart();
      };
      
      utterance.onerror = (e) => {
        console.error('Speech error:', e.error);
        if (e.error !== 'interrupted') {
          setCookingStatus('waiting');
          setIsWaitingForStart(true);
          listenForStart();
        }
      };
      
      // SPEAK IMMEDIATELY - this is critical for browser audio
      console.log('🔊 Speaking first instruction IMMEDIATELY from button click...');
      window.speechSynthesis.speak(utterance);
      setCookingStatus('speaking');
    }
  };

  const handleStopCooking = () => {
    cleanup();
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
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      // Wait a moment then proceed
      setTimeout(() => {
        proceedToNextStep();
      }, 200);
    } else {
      // Last step - just complete
      console.log('⏭ Last step skipped - recipe complete');
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setCookingStatus('complete');
      setIsWaitingForStart(false);
      setIsTimerRunning(false);
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
                    <div>Waiting for you to say "start"</div>
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
                testUtterance.lang = 'en-US';
                
                // Get voices
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                  const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
                  testUtterance.voice = englishVoice;
                  console.log('Using voice:', englishVoice.name);
                }
                
                // Cancel any existing speech
                if (synthRef.current.speaking) {
                  synthRef.current.cancel();
                }
                
                // Speak immediately
                synthRef.current.speak(testUtterance);
                
                console.log('Test speech started. If you cannot hear it:');
                console.log('1. Check system volume');
                console.log('2. Check browser tab volume');
                console.log('3. Check browser audio permissions');
                console.log('4. Try a different browser');
                
                testUtterance.onstart = () => console.log('✅ Test speech started');
                testUtterance.onend = () => console.log('✅ Test speech ended');
                testUtterance.onerror = (e) => console.error('❌ Test speech error:', e.error);
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
        </div>
      )}
    </div>
  );
}

