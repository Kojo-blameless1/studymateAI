'use client';

import React, { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '@/lib/supabaseClient';
import { generateMaterialSummary } from '@/lib/gemini';
import { Material } from '@/types';

interface MaterialUploadProps {
  onSuccess: (newMaterial: Material) => void;
  onCancel: () => void;
}

export default function MaterialUpload({ onSuccess, onCancel }: MaterialUploadProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.type.includes('text')) {
      setError('Please upload a plain text (.txt) file or paste your notes directly below.');
      return;
    }

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setError('');
    };
    reader.onerror = () => setError('Failed to read the file.');
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a material title and note content.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      setStatusMsg('Step 1/2: Saving raw lecture notes directly to database...');
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mat_${Date.now()}`;

      setStatusMsg('Step 2/2: Triggering Gemini AI to extract key points, definitions & flashcards...');
      const summary = await generateMaterialSummary(title.trim(), content.trim());

      const newMaterial: Material = {
        id,
        title: title.trim(),
        content: content.trim(),
        summary,
        created_at: new Date().toISOString()
      };

      await db.saveMaterial(newMaterial);
      setStatusMsg('Complete! Learning tools ready.');
      onSuccess(newMaterial);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during AI material processing.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-indigo-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/20 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6 border-b border-white/20 pb-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg text-indigo-600">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Add Study Material</h3>
            <p className="text-indigo-100 text-xs">Upload lecture notes or paste text to instantly generate AI summaries & quizzes.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/30 border border-rose-300/50 rounded-2xl flex items-center gap-3 text-rose-100 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">Subject / Lecture Title</label>
            <input
              type="text"
              placeholder="e.g. Biology 101 - Cellular Respiration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-inner"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-white/90">Lecture Notes Content</label>
              <label className="cursor-pointer text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-white/20 font-medium">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .txt File</span>
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              rows={8}
              placeholder="Paste raw lecture notes, textbook excerpts, or article text here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isUploading}
              className="w-full bg-white/10 border border-white/30 rounded-2xl p-4 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-inner font-sans leading-relaxed resize-none"
            />
            <p className="text-right text-xs text-white/60 mt-1">{content.length.toLocaleString()} characters</p>
          </div>

          {isUploading && (
            <div className="p-4 bg-indigo-900/40 rounded-2xl border border-indigo-200/30 flex items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-white shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">{statusMsg}</p>
                <p className="text-xs text-indigo-200 mt-0.5">Gemini is structuring high-yield exam tips and definitions...</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-sm transition-all border border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
