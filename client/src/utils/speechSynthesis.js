// Enhanced speech synthesis with better Indian language support
// Uses ResponsiveVoice when available, falls back to browser's speechSynthesis

// Language to ResponsiveVoice voice mapping
const RESPONSIVE_VOICE_MAP = {
  'en-IN': 'Hindi Female', // English with Indian accent
  'en-GB': 'UK English Female',
  'en-US': 'US English Female',
  'hi-IN': 'Hindi Female',
  'ta-IN': 'Tamil Female',
  'bn-IN': 'Bengali Female',
  'es-ES': 'Spanish Female',
  'fr-FR': 'French Female',
  'de-DE': 'Deutsch Female',
  'ar-SA': 'Arabic Female',
};

/**
 * Check if ResponsiveVoice is available
 */
export const isResponsiveVoiceAvailable = () => {
  const available = typeof window !== 'undefined' && window.responsiveVoice;
  if (!available) {
    console.warn('⚠️ ResponsiveVoice not loaded. For better Indian language support (Bengali, Hindi, Tamil), add API key to index.html');
    console.warn('Get free API key from: https://responsivevoice.org/');
  }
  return available;
};

/**
 * Get available voices for ResponsiveVoice
 */
export const getAvailableVoices = () => {
  if (isResponsiveVoiceAvailable()) {
    return window.responsiveVoice.getVoices();
  }
  return [];
};

/**
 * Speak text using ResponsiveVoice or browser's speechSynthesis
 * @param {string} text - Text to speak
 * @param {string} languageCode - Language code (e.g., 'hi-IN', 'en-US')
 * @param {Object} options - Speech options
 * @param {Function} options.onStart - Callback when speech starts
 * @param {Function} options.onEnd - Callback when speech ends
 * @param {Function} options.onError - Callback on error
 * @param {number} options.rate - Speech rate (0.1 to 10, default 0.9)
 * @param {number} options.pitch - Speech pitch (0 to 2, default 1)
 * @param {number} options.volume - Speech volume (0 to 1, default 1)
 */
export const speak = (text, languageCode = 'en-IN', options = {}) => {
  const {
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
    rate = 0.9,
    pitch = 1,
    volume = 1,
  } = options;

  console.log(`🎙️ Attempting to speak in ${languageCode}:`, text.substring(0, 50) + '...');

  // Try ResponsiveVoice first (better Indian language support)
  if (isResponsiveVoiceAvailable()) {
    const voiceName = RESPONSIVE_VOICE_MAP[languageCode] || 'UK English Female';
    
    console.log(`🔊 Using ResponsiveVoice: ${voiceName} for ${languageCode}`);
    console.log('Available ResponsiveVoice voices:', window.responsiveVoice.getVoices().map(v => v.name).join(', '));
    
    try {
      // Cancel any ongoing speech
      window.responsiveVoice.cancel();
      
      // Speak with ResponsiveVoice
      window.responsiveVoice.speak(text, voiceName, {
        rate: rate,
        pitch: pitch,
        volume: volume,
        onstart: () => {
          console.log(`✅ ResponsiveVoice speech started (${voiceName})`);
          onStart();
        },
        onend: () => {
          console.log(`✅ ResponsiveVoice speech completed (${voiceName})`);
          onEnd();
        },
        onerror: (error) => {
          console.error('❌ ResponsiveVoice error:', error);
          console.log('Falling back to browser speech synthesis...');
          // Fallback to browser speech synthesis
          speakWithBrowserAPI(text, languageCode, options);
          onError(error);
        },
      });
      
      return true;
    } catch (error) {
      console.error('❌ ResponsiveVoice failed, falling back to browser API:', error);
      return speakWithBrowserAPI(text, languageCode, options);
    }
  } else {
    // Fallback to browser's speechSynthesis
    console.log('ℹ️ ResponsiveVoice not available, using browser speechSynthesis');
    if (languageCode === 'bn-IN' || languageCode === 'hi-IN' || languageCode === 'ta-IN') {
      console.warn(`⚠️ For better ${languageCode} speech quality, add ResponsiveVoice API key to index.html`);
      console.warn('Get free API key: https://responsivevoice.org/');
    }
    return speakWithBrowserAPI(text, languageCode, options);
  }
};

/**
 * Speak using browser's native speechSynthesis API
 */
const speakWithBrowserAPI = (text, languageCode, options = {}) => {
  const {
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
    rate = 0.9,
    pitch = 1,
    volume = 1,
  } = options;

  if (!window.speechSynthesis) {
    console.error('❌ Speech synthesis not supported');
    onError(new Error('Speech synthesis not supported'));
    return false;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Try to find a voice for the language
    const voices = window.speechSynthesis.getVoices();
    console.log(`Available browser voices (${voices.length}):`, voices.map(v => `${v.name} (${v.lang})`).join(', '));
    
    if (voices.length > 0) {
      // Try exact match first
      let languageVoice = voices.find(v => v.lang === languageCode);
      
      // If no exact match, try language prefix (e.g., 'bn' from 'bn-IN')
      if (!languageVoice) {
        const langPrefix = languageCode.split('-')[0];
        languageVoice = voices.find(v => v.lang.startsWith(langPrefix));
        if (languageVoice) {
          console.log(`🔍 Found voice by language prefix: ${languageVoice.name} (${languageVoice.lang})`);
        }
      }
      
      // If still no match, use default
      if (!languageVoice) {
        languageVoice = voices[0];
        console.warn(`⚠️ No voice found for ${languageCode}, using default: ${languageVoice.name} (${languageVoice.lang})`);
        console.warn('Bengali text-to-speech requires ResponsiveVoice. Add API key to index.html for better support.');
      }
      
      utterance.voice = languageVoice;
      console.log(`🎵 Using voice: ${languageVoice.name} (${languageVoice.lang}) for ${languageCode}`);
    } else {
      console.warn('⚠️ No voices available yet. Speech might not work properly.');
    }

    utterance.onstart = () => {
      console.log(`✅ Browser speech started (lang: ${languageCode})`);
      onStart();
    };

    utterance.onend = () => {
      console.log(`✅ Browser speech completed (lang: ${languageCode})`);
      onEnd();
    };

    utterance.onerror = (event) => {
      console.error(`❌ Browser speech error for ${languageCode}:`, event.error);
      if (event.error === 'language-not-supported') {
        console.error(`❌ ${languageCode} is not supported by your browser's speech synthesis`);
        console.error('To fix: Add ResponsiveVoice API key to index.html');
      }
      onError(event);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.error('❌ Browser speech synthesis failed:', error);
    onError(error);
    return false;
  }
};

/**
 * Cancel ongoing speech
 */
export const cancelSpeech = () => {
  if (isResponsiveVoiceAvailable()) {
    window.responsiveVoice.cancel();
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Check if currently speaking
 */
export const isSpeaking = () => {
  if (isResponsiveVoiceAvailable() && window.responsiveVoice.isPlaying()) {
    return true;
  }
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    return true;
  }
  return false;
};
