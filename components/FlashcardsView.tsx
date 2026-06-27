'use client';

import React, { useState } from 'react';
import { Layers, RotateCw, ChevronLeft, ChevronRight, Sparkles, BookOpen, CheckCircle } from 'lucide-react';
import { Material } from '@/types';

interface FlashcardsViewProps {
  materials: Material[];
}

export default function FlashcardsView({ materials }: FlashcardsViewProps) {
  const [selectedMatId, setSelectedMatId] = useState<string>(materials[0]?.id || '');
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeMat = materials.find(m => m.id === selectedMatId);
  const cards = activeMat?.summary?.flashcards || [
    { topic: 'General Study', front: 'What is Active Recall?', back: 'Testing your memory during review rather than passively re-reading text.' },
    { topic: 'General Study', front: 'What is Spaced Repetition?', back: 'Reviewing information at systematically increasing intervals to combat the forgetting curve.' }
  ];

  const currentCard = cards[cardIdx] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCardIdx((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCardIdx((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 text-white min-h-0 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-fuchsia-300" />
            <span>AI Flashcards Deck</span>
          </h3>
          <p className="text-indigo-100 text-xs mt-1">Automatically extracted QA conceptual pairs designed for rapid spaced repetition mastery.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMatId}
            onChange={(e) => { setSelectedMatId(e.target.value); setCardIdx(0); setIsFlipped(false); }}
            className="bg-white/10 border border-white/30 rounded-xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white max-w-[260px]"
          >
            {materials.map(m => (
              <option key={m.id} value={m.id} className="bg-indigo-950 text-white">
                {m.title} ({m.summary?.flashcards?.length || 0} cards)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-full max-w-xl flex flex-col items-center gap-6">
          
          {/* Deck Status */}
          <div className="w-full flex justify-between items-center text-xs font-bold px-4 text-white/80">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
              <span>{currentCard?.topic || activeMat?.title}</span>
            </span>
            <span>Card {cardIdx + 1} of {cards.length}</span>
          </div>

          {/* Interactive Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 cursor-pointer [perspective:1000px] group"
          >
            <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}>
              
              {/* FRONT (Question) */}
              <div className="absolute inset-0 w-full h-full bg-white/25 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl flex flex-col justify-between [backface-visibility:hidden]">
                <div className="flex justify-between items-center text-xs uppercase tracking-wider font-extrabold text-indigo-200">
                  <span>Question</span>
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                </div>

                <div className="flex-1 flex items-center justify-center text-center my-4">
                  <h4 className="text-xl md:text-2xl font-bold leading-relaxed text-white">
                    {currentCard?.front}
                  </h4>
                </div>

                <div className="text-center text-xs font-semibold text-white/60 flex items-center justify-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Click card to reveal answer</span>
                </div>
              </div>

              {/* BACK (Answer) */}
              <div className="absolute inset-0 w-full h-full bg-indigo-900/80 backdrop-blur-2xl border-2 border-indigo-300/60 rounded-3xl p-8 shadow-2xl flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="flex justify-between items-center text-xs uppercase tracking-wider font-extrabold text-emerald-300">
                  <span>Answer</span>
                  <CheckCircle className="w-4 h-4" />
                </div>

                <div className="flex-1 flex items-center justify-center text-center my-4">
                  <p className="text-lg md:text-xl font-medium leading-relaxed text-indigo-50">
                    {currentCard?.back}
                  </p>
                </div>

                <div className="text-center text-xs font-semibold text-indigo-200 flex items-center justify-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click to flip back</span>
                </div>
              </div>

            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev}
              className="p-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl transition-all border border-white/30 shadow-lg active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-6 py-4 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-2xl shadow-xl transition-all flex items-center gap-2 active:scale-95 text-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span>Flip Card</span>
            </button>

            <button
              onClick={handleNext}
              className="p-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl transition-all border border-white/30 shadow-lg active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
