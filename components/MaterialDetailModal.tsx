'use client';

import React from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, Bookmark, FileText, Layers, HelpCircle } from 'lucide-react';
import { Material } from '@/types';

interface MaterialDetailModalProps {
  material: Material | null;
  onClose: () => void;
  onStartQuiz: (materialId: string) => void;
  onViewFlashcards: (materialId: string) => void;
}

export default function MaterialDetailModal({ material, onClose, onStartQuiz, onViewFlashcards }: MaterialDetailModalProps) {
  if (!material) return null;

  const sum = material.summary;

  return (
    <div className="fixed inset-0 z-50 bg-indigo-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white/20 backdrop-blur-2xl border border-white/40 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/20 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shrink-0 font-black text-lg">
              {material.title.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">{material.title}</h3>
              <p className="text-indigo-100 text-xs mt-0.5">
                Analyzed {material.created_at ? new Date(material.created_at).toLocaleDateString() : 'recently'} • {material.content?.length.toLocaleString()} chars
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto space-y-6 py-6 min-h-0 pr-1">
          
          {/* Executive Overview */}
          {sum?.overview && (
            <div className="bg-indigo-900/40 p-5 rounded-2xl border border-indigo-200/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Executive Overview</span>
              </h4>
              <p className="text-sm leading-relaxed text-indigo-50 font-medium">{sum.overview}</p>
            </div>
          )}

          {/* Key Points & Exam Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Key Points */}
            <div className="bg-white/10 p-5 rounded-2xl border border-white/15">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>High-Yield Key Points</span>
              </h4>
              <ul className="space-y-2 text-xs text-white/90">
                {sum?.keyPoints?.map((kp, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-400 mt-0.5 font-bold">•</span>
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exam Tips */}
            <div className="bg-white/10 p-5 rounded-2xl border border-white/15">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Exam Focus Areas</span>
              </h4>
              <ul className="space-y-2 text-xs text-white/90">
                {sum?.examTips?.map((et, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-amber-400 mt-0.5 font-bold">★</span>
                    <span>{et}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Definitions Table */}
          {sum?.definitions && sum.definitions.length > 0 && (
            <div className="bg-white/10 p-5 rounded-2xl border border-white/15">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Important Glossary Definitions</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sum.definitions.map((def, idx) => (
                  <div key={idx} className="bg-black/20 p-3.5 rounded-xl border border-white/10">
                    <p className="font-bold text-xs text-yellow-200">{def.term}</p>
                    <p className="text-xs text-white/80 mt-1 leading-relaxed">{def.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Text Accordion */}
          <details className="group bg-black/20 rounded-2xl border border-white/10 p-4">
            <summary className="cursor-pointer font-bold text-xs text-white/70 hover:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>View Raw Ingested Notes</span>
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">Click to expand</span>
            </summary>
            <div className="mt-4 pt-4 border-t border-white/10 font-mono text-xs text-white/70 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {material.content}
            </div>
          </details>

        </div>

        {/* Modal Action Footer */}
        <div className="border-t border-white/20 pt-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-white/60">Ready to test retention?</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onClose(); onViewFlashcards(material.id); }}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs transition-all border border-white/20 flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-fuchsia-300" />
              <span>Review Flashcards</span>
            </button>
            <button
              onClick={() => { onClose(); onStartQuiz(material.id); }}
              className="px-5 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs shadow-xl transition-all flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Take AI Quiz</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
