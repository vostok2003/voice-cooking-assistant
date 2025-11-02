import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import api from '../utils/api';
import { useParams } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage(){
  const { id } = useParams(); // recipe id (optional)
  const [history, setHistory] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const synthRef = useRef(null);

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
    if (!synthRef.current || !text) return;
    
    // Stop any ongoing speech
    synthRef.current.cancel();
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Speak the text
    synthRef.current.speak(utterance);
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
      // when new chat: POST /recipes/generate with { prompt } (controller will save)
      const res = await api.post('/recipes/generate', { prompt });
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
      
      // Speak the response back to the user
      // Combine all assistant parts into one text
      const fullResponse = assistantParts.map(part => part.text).join('\n\n');
      if (fullResponse) {
        speakText(fullResponse);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch from Gemini');
    }
  };

  return (
    <div className="chat-page">
      <Header />
      <ChatWindow history={history} onSend={handleSendPrompt} recipe={recipe} />
    </div>
  );
}

