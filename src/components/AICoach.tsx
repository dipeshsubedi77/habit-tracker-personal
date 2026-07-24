import React, { useState, useEffect } from 'react';
import { Sparkles, Mic, Send, Bot, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export function AICoach() {
  const [messages, setMessages] = useState<any[]>([
    { id: 1, role: 'coach', text: "Hey! How are you feeling today? Did you manage to get that morning sunlight in?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase.from('ai_conversations').select('*').order('timestamp', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role,
          text: m.content
        })));
      }
    } catch (e) {
      console.log('No chat history', e);
    }
  };

  const saveMessageToDb = async (role: string, content: string) => {
    try {
      await supabase.from('ai_conversations').insert([{ role, content }]);
    } catch (e) {
      console.error('Error saving chat', e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { id: Date.now(), role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    // Fire and forget save
    saveMessageToDb('user', input);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'coach',
        text: data.text
      }]);
      saveMessageToDb('coach', data.text);
    } catch (error) {
      console.error(error);
      const errText = "I'm having trouble connecting right now. Let's focus on the basics: hydrate, get some movement in, and we can catch up later.";
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'coach',
        text: errText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col relative z-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-blue-500" />
            Thought Space
          </h1>
          <p className="text-slate-400 mt-1">Your AI Life Coach, trained on neuroscience and habit building.</p>
        </div>
      </header>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4 scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'coach' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-slate-300'}`}>
                {msg.role === 'coach' ? <Bot className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-transparent border border-white/10 text-slate-200 rounded-tl-sm'}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isLoading && (
             <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-[80%]"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/20 text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl text-sm leading-relaxed bg-transparent border border-white/10 text-slate-200 rounded-tl-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Thinking...
              </div>
            </motion.div>
          )}
        </div>

        <div className="pt-4 border-t border-white/10 flex gap-2">
          <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0">
            <Mic className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Share your thoughts, ask for advice..."
              className="w-full h-12 bg-transparent border border-white/10 rounded-full px-6 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
