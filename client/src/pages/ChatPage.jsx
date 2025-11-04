import React, { useState, useEffect, useRef, useContext } from 'react';
import Header from '../components/Header';
import api from '../utils/api';
import { useParams } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import { AuthContext } from '../context/AuthContext';
import { speak as enhancedSpeak, cancelSpeech, isSpeaking as checkIfSpeaking } from '../utils/speechSynthesis';

export default function ChatPage(){
  const { user } = useContext(AuthContext);
  const { id } = useParams(); // recipe id (optional)
  const [history, setHistory] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(null);
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || 'en-IN');

  useEffect(() => {
    // Sync selected language with user preference
    if (user?.language) {
      setSelectedLanguage(user.language);
    }
  }, [user]);

  useEffect(() => {
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;
    return () => {
      // Cleanup: stop any speaking when component unmounts
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (id) loadRecipe(id);
  }, [id]);

  const speakText = (text) => {
    if (!text) return;
    
    // Stop any ongoing speech
    cancelSpeech();
    setIsSpeaking(false);
    
    // Use enhanced speech synthesis with ResponsiveVoice support
    enhancedSpeak(text, selectedLanguage, {
      rate: 0.9,
      pitch: 1,
      volume: 1,
      onStart: () => {
        setIsSpeaking(true);
        console.log(`🔊 Speaking in ${selectedLanguage}`);
      },
      onEnd: () => {
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error('Speech error:', error);
        setIsSpeaking(false);
      },
    });
  };

  const stopSpeaking = () => {
    cancelSpeech();
    setIsSpeaking(false);
  };

  const loadRecipe = async (rid) => {
    try {
      const res = await api.get(`/recipes/${rid}`); // implement GET /recipes/:id server-side
      setRecipe(res.data);
      // Build chat history using recipe summary & steps
      const initial = [];
      if (res.data.summary) initial.push({ role: 'assistant', text: res.data.summary });
      if (Array.isArray(res.data.ingredients) && res.data.ingredients.length > 0) {
        const ingredientsText = `Ingredients:\n${res.data.ingredients.map(i => `- ${i}`).join('\n')}`;
        initial.push({ role: 'assistant', text: ingredientsText });
      }
      res.data.steps?.forEach(s => initial.push({ role: 'assistant', text: s.instruction }));
      setHistory(initial);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendPrompt = async (prompt) => {
    // call backend route that invokes gemini (we already have generateAndSave)
    try {
      // when new chat: POST /recipes/generate with { prompt, language } (controller will save)
      const res = await api.post('/recipes/generate', { 
        prompt,
        language: selectedLanguage 
      });
      // returned recipe saved => show its data
      setRecipe(res.data);
      // decode steps/summary from response
      const assistantParts = [];
      if (res.data.summary) assistantParts.push({ role: 'assistant', text: res.data.summary });
      if (Array.isArray(res.data.ingredients) && res.data.ingredients.length > 0) {
        const ingredientsText = `Ingredients:\n${res.data.ingredients.map(i => `- ${i}`).join('\n')}`;
        assistantParts.push({ role: 'assistant', text: ingredientsText });
      }
      res.data.steps?.forEach(s => assistantParts.push({ role: 'assistant', text: s.instruction }));
      setHistory(h => [...h, { role: 'user', text: prompt }, ...assistantParts]);
      
      // Speak the recipe response back to the user
      // CookMode will cancel this speech when user clicks "Cook Now", so it's safe
      const fullResponse = assistantParts.map(part => part.text).join('. ');
      if (fullResponse) {
        // Format for better speech: replace newlines with pauses, clean up text
        const speechText = fullResponse
          .replace(/\n/g, '. ')  // Replace newlines with periods and spaces
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .replace(/\.\s*\./g, '.')  // Replace double periods with single
          .trim();
        
        // Small delay to ensure recipe data is fully set
        setTimeout(() => {
          speakText(speechText);
        }, 300);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch from Gemini');
    }
  };

  return (
    <div className="chat-page">
      {/* Animated background gradients */}
      <div className="chat-page-gradient-bg">
        <div className="chat-orb chat-orb-1"></div>
        <div className="chat-orb chat-orb-2"></div>
        <div className="chat-orb chat-orb-3"></div>
      </div>
      
      <Header />
      <ChatWindow 
        history={history} 
        onSend={handleSendPrompt} 
        recipe={recipe}
        isSpeaking={isSpeaking}
        onStopSpeaking={stopSpeaking}
      />
    </div>
  );
}

