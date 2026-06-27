'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, AlertCircle, HelpCircle, BookOpen } from 'lucide-react';
import { sendTutorChatMessage } from '@/lib/gemini';
import { ChatMessage, Material } from '@/types';

interface AITutorChatProps {
  activeMaterial?: Material | null;
}

export default function AITutorChat({ activeMaterial }: AITutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'model',
      content: activeMaterial 
        ? `Hello! I am your personal tutor. I have loaded your notes on "${activeMaterial.title}". Want to start with a simplified conceptual breakdown, or jump into a quick diagnostic review?`
        : "Hello! I am StudyMate AI, your encouraging personal tutor. Select a study material on the dashboard or ask me any challenging academic concept to break down step-by-step!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // When active material changes, add a notification tutor prompt
  useEffect(() => {
    if (activeMaterial) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_context_${Date.now()}`,
          role: 'model',
          content: `Active topic switched to: "${activeMaterial.title}". What specific term or concept should we simplify?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [activeMaterial?.id]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);
    setError('');

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const replyText = await sendTutorChatMessage(
        historyPayload,
        query,
        activeMaterial?.content
      );

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        content: replyText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI tutor.');
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    'Simplify this topic like I am 12 years old',
    'Quiz me with one Socratic question',
    'What are the most common exam traps here?',
    'Give me a real-world analogy for this concept'
  ];

  return (
    <div className="w-full h-full bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
      {/* Header */}
      <div className="bg-white/10 p-5 border-b border-white/20 flex justify-between items-center shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-lg font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-lg leading-tight flex items-center gap-2">
              <span>AI Tutor Chat</span>
              <span className="text-xs bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 px-2 py-0.5 rounded-full font-medium">Online</span>
            </h4>
            <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Active Context: <strong className="text-white">{activeMaterial?.title || 'Global Knowledge Base'}</strong></span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ id: `rst_${Date.now()}`, role: 'model', content: "Chat reset! How else can I assist your study session?", timestamp: new Date() }])}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 transition-colors"
          title="Reset Conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error Boundary / Notice */}
      {error && (
        <div className="bg-rose-500/30 border-b border-rose-300/40 px-4 py-2 flex items-center justify-between text-xs text-rose-100 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-md ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg whitespace-pre-wrap font-sans ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-400/40' 
                  : 'bg-white/20 backdrop-blur-md text-white rounded-tl-none border border-white/30'
              }`}>
                {m.content}
                <div className={`text-[10px] mt-1.5 opacity-50 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 bg-white text-indigo-700 rounded-xl shrink-0 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 bg-white/15 backdrop-blur-md text-white/80 rounded-2xl rounded-tl-none border border-white/20 text-xs flex items-center gap-2">
                <span>Tutor is formulating a step-by-step breakdown...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Bar */}
      <div className="px-6 py-2 bg-white/5 border-t border-white/10 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            disabled={isLoading}
            className="whitespace-nowrap px-3 py-1.5 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-xl text-xs font-medium transition-all border border-white/15 flex items-center gap-1.5 shrink-0"
          >
            <HelpCircle className="w-3 h-3 text-indigo-300" />
            <span>{qp}</span>
          </button>
        ))}
      </div>

      {/* Input Footer */}
      <div className="p-4 bg-black/20 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input
            type="text"
            placeholder={`Ask StudyMate AI about ${activeMaterial?.title ? `"${activeMaterial.title}"` : 'any subject'}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full bg-white/10 border border-white/20 rounded-2xl pl-5 pr-12 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1.5 p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors shadow-md disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
