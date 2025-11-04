// Language configuration for speech recognition and synthesis
// Note: Browser speech recognition support varies by language
// Most browsers support: English (all dialects), Spanish, French, German
// Limited support for: Hindi, and other Indian languages (depends on browser and OS)
// For best results with Indian languages, use Chrome on Android or Windows with language packs installed
export const LANGUAGES = [
  { 
    code: 'en-IN', 
    label: 'English (Indian)', 
    flag: '🇮🇳', 
    startCommand: 'start', 
    sayPrompt: "Say 'start' when you're ready",
    stepText: (num, total) => `Step ${num} of ${total}`,
    timeText: { minute: 'minute', minutes: 'minutes', second: 'second', seconds: 'seconds', takes: 'This step takes approximately', and: 'and' }
  },
  { 
    code: 'en-GB', 
    label: 'English (British)', 
    flag: '🇬🇧', 
    startCommand: 'start', 
    sayPrompt: "Say 'start' when you're ready",
    stepText: (num, total) => `Step ${num} of ${total}`,
    timeText: { minute: 'minute', minutes: 'minutes', second: 'second', seconds: 'seconds', takes: 'This step takes approximately', and: 'and' }
  },
  { 
    code: 'en-US', 
    label: 'English (American)', 
    flag: '🇺🇸', 
    startCommand: 'start', 
    sayPrompt: "Say 'start' when you're ready",
    stepText: (num, total) => `Step ${num} of ${total}`,
    timeText: { minute: 'minute', minutes: 'minutes', second: 'second', seconds: 'seconds', takes: 'This step takes approximately', and: 'and' }
  },
  { 
    code: 'hi-IN', 
    label: 'Hindi', 
    flag: '🇮🇳', 
    startCommand: 'शुरू', 
    sayPrompt: "'शुरू' बोलें जब आप तैयार हों",
    stepText: (num, total) => `कदम ${num} का ${total}`,
    timeText: { minute: 'मिनट', minutes: 'मिनट', second: 'सेकंड', seconds: 'सेकंड', takes: 'यह कदम लगभग लेता है', and: 'और' }
  },
  { 
    code: 'bn-IN', 
    label: 'Bengali', 
    flag: '🇮🇳', 
    startCommand: 'শুরু', 
    sayPrompt: "'শুরু' বলুন যখন আপনি প্রস্তুত",
    stepText: (num, total) => `ধাপ ${num} এর ${total}`,
    timeText: { minute: 'মিনিট', minutes: 'মিনিট', second: 'সেকেন্ড', seconds: 'সেকেন্ড', takes: 'এই ধাপে প্রায় সময় লাগে', and: 'এবং' }
  },
  { 
    code: 'ta-IN', 
    label: 'Tamil', 
    flag: '🇮🇳', 
    startCommand: 'தொடங்கு', 
    sayPrompt: "நீங்கள் தயாராக இருக்கும்போது 'தொடங்கு' என்று சொல்லுங்கள்",
    stepText: (num, total) => `படி ${num} / ${total}`,
    timeText: { minute: 'நிமிடம்', minutes: 'நிமிடங்கள்', second: 'விநாடி', seconds: 'விநாடிகள்', takes: 'இந்த படி தோராயமாக எடுக்கும்', and: 'மற்றும்' }
  },
  { 
    code: 'es-ES', 
    label: 'Spanish', 
    flag: '🇪🇸', 
    startCommand: 'empezar', 
    sayPrompt: "Di 'empezar' cuando estés listo",
    stepText: (num, total) => `Paso ${num} de ${total}`,
    timeText: { minute: 'minuto', minutes: 'minutos', second: 'segundo', seconds: 'segundos', takes: 'Este paso toma aproximadamente', and: 'y' }
  },
  { 
    code: 'fr-FR', 
    label: 'French', 
    flag: '🇫🇷', 
    startCommand: 'commencer', 
    sayPrompt: "Dites 'commencer' quand vous êtes prêt",
    stepText: (num, total) => `Étape ${num} sur ${total}`,
    timeText: { minute: 'minute', minutes: 'minutes', second: 'seconde', seconds: 'secondes', takes: 'Cette étape prend environ', and: 'et' }
  },
  { 
    code: 'de-DE', 
    label: 'German', 
    flag: '🇩🇪', 
    startCommand: 'start', 
    sayPrompt: "Sagen Sie 'start', wenn Sie bereit sind",
    stepText: (num, total) => `Schritt ${num} von ${total}`,
    timeText: { minute: 'Minute', minutes: 'Minuten', second: 'Sekunde', seconds: 'Sekunden', takes: 'Dieser Schritt dauert ungefähr', and: 'und' }
  },
  { 
    code: 'ar-SA', 
    label: 'Arabic', 
    flag: '🇸🇦', 
    startCommand: 'ابدأ', 
    sayPrompt: "قل 'ابدأ' عندما تكون جاهزاً",
    stepText: (num, total) => `الخطوة ${num} من ${total}`,
    timeText: { minute: 'دقيقة', minutes: 'دقائق', second: 'ثانية', seconds: 'ثواني', takes: 'تستغرق هذه الخطوة تقريباً', and: 'و' }
  },
];

export const getLanguageLabel = (code) => {
  const lang = LANGUAGES.find(l => l.code === code);
  return lang ? lang.label : code;
};

export const getLanguageFlag = (code) => {
  const lang = LANGUAGES.find(l => l.code === code);
  return lang ? lang.flag : '🌐';
};

export const getStartCommand = (code) => {
  const lang = LANGUAGES.find(l => l.code === code);
  return lang ? lang.startCommand : 'start';
};

export const getSayPrompt = (code) => {
  const lang = LANGUAGES.find(l => l.code === code);
  return lang ? lang.sayPrompt : "Say 'start' when you're ready";
};

export const getStepText = (code, stepNum, totalSteps) => {
  const lang = LANGUAGES.find(l => l.code === code);
  return lang && lang.stepText ? lang.stepText(stepNum, totalSteps) : `Step ${stepNum} of ${totalSteps}`;
};

export const getTimeText = (code, minutes, seconds) => {
  const lang = LANGUAGES.find(l => l.code === code);
  if (!lang || !lang.timeText) {
    // Default English
    const parts = [];
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes > 1 ? 'minutes' : 'minute'}`);
    }
    if (seconds > 0) {
      parts.push(`${seconds} ${seconds > 1 ? 'seconds' : 'second'}`);
    }
    return parts.length > 0 ? `This step takes approximately ${parts.join(' and ')}.` : '';
  }
  
  const { minute, minutes: mins, second, seconds: secs, takes, and: andWord } = lang.timeText;
  const parts = [];
  
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes > 1 ? mins : minute}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} ${seconds > 1 ? secs : second}`);
  }
  
  return parts.length > 0 ? `${takes} ${parts.join(` ${andWord} `)}.` : '';
};

export const getLanguageSupportNote = (code) => {
  // Languages with good browser support
  const wellSupportedLanguages = ['en-IN', 'en-GB', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];
  
  if (wellSupportedLanguages.includes(code)) {
    return null; // No note needed
  }
  
  // Indian and other languages with limited support
  return 'Note: Speech recognition support for this language may vary by browser. For best results, use Chrome with appropriate language support enabled. You can always type your message instead.';
};
