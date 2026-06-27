'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Sparkles, Trophy, RotateCcw, ArrowRight, Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/supabaseClient';
import { generateAIQuiz, analyzeQuizPerformance } from '@/lib/gemini';
import { Material, Quiz, QuizQuestion } from '@/types';

interface AIQuizViewProps {
  materials: Material[];
  onScoreUpdated: () => void;
}

export default function AIQuizView({ materials, onScoreUpdated }: AIQuizViewProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // History & Analysis state
  const [quizHistory, setQuizHistory] = useState<Quiz[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await db.getQuizzes();
    setQuizHistory(history);
    
    if (history.length > 0) {
      setIsAnalyzing(true);
      const perfData = history.map(q => ({
        score: q.score,
        total: q.questions?.length || 5
      }));
      const aiAnalysis = await analyzeQuizPerformance(perfData);
      setAnalysis(aiAnalysis);
      setIsAnalyzing(false);
    }
  };

  const handleStartQuiz = async () => {
    const material = materials.find(m => m.id === selectedMaterialId);
    if (!material) {
      setError('Please select a valid study material first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setIsQuizCompleted(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);

    try {
      const generated = await generateAIQuiz(material.title, material.content, 5);
      setQuestions(generated);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz questions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption) return;
    setIsAnswerSubmitted(true);
    const currentQ = questions[currentIndex];
    if (selectedOption === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizCompleted(true);
      // Save quiz to db
      const finalScore = score + (selectedOption === questions[currentIndex].correctAnswer ? 1 : 0);
      const newQuiz: Quiz = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `qz_${Date.now()}`,
        material_id: selectedMaterialId,
        questions,
        score: finalScore,
        created_at: new Date().toISOString()
      };
      await db.saveQuiz(newQuiz);
      onScoreUpdated();
      loadHistory();
    }
  };

  const activeMaterial = materials.find(m => m.id === selectedMaterialId);
  const currentQ = questions[currentIndex];

  return (
    <div className="w-full h-full flex flex-col gap-6 text-white min-h-0 overflow-y-auto">
      {/* Top Banner / Selection */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-yellow-300" />
            <span>AI Exam Quiz Generator</span>
          </h3>
          <p className="text-indigo-100 text-xs mt-1">Generate dynamic multiple-choice exams directly from your analyzed notes with AI explanations.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            disabled={isLoading || (questions.length > 0 && !isQuizCompleted)}
            className="bg-white/10 border border-white/30 rounded-xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white max-w-[240px]"
          >
            {materials.map(m => (
              <option key={m.id} value={m.id} className="bg-indigo-950 text-white">
                {m.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleStartQuiz}
            disabled={isLoading || materials.length === 0}
            className="px-5 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs shadow-xl transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{questions.length > 0 ? 'New Quiz' : 'Start Quiz'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/30 border border-rose-300/40 rounded-2xl text-rose-100 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Active Quiz Area */}
        <div className="lg:col-span-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          {questions.length === 0 && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/20 rounded-2xl">
              <HelpCircle className="w-12 h-12 text-white/40 mb-3 animate-bounce" />
              <h4 className="font-bold text-lg text-white">Ready to test your mastery?</h4>
              <p className="text-white/70 text-xs max-w-sm mt-1">Select a note topic above and hit &quot;Start Quiz&quot; to prompt Gemini to construct targeted test questions.</p>
            </div>
          )}

          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
              <h4 className="font-bold text-base text-white">Synthesizing Exam Questions...</h4>
              <p className="text-white/60 text-xs mt-1">Analyzing &quot;{activeMaterial?.title}&quot; for high-yield traps.</p>
            </div>
          )}

          {questions.length > 0 && !isQuizCompleted && currentQ && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Progress Bar */}
              <div className="flex items-center justify-between text-xs font-bold text-white/80 pb-2 border-b border-white/20">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>Current Score: {score}</span>
              </div>

              {/* Question */}
              <h4 className="text-lg font-bold leading-relaxed text-white">
                {currentQ.question}
              </h4>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQ.correctAnswer;
                  
                  let optStyle = "bg-white/10 border-white/20 hover:bg-white/20 text-white";
                  if (isSelected && !isAnswerSubmitted) {
                    optStyle = "bg-white/30 border-white text-white ring-2 ring-white";
                  }
                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optStyle = "bg-emerald-500/80 border-emerald-300 text-white font-bold shadow-lg";
                    } else if (isSelected && !isCorrect) {
                      optStyle = "bg-rose-500/80 border-rose-300 text-white line-through";
                    } else {
                      optStyle = "bg-white/5 border-white/10 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />}
                      {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-200 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* AI Explanation Box */}
              {isAnswerSubmitted && (
                <div className="p-4 bg-indigo-950/60 rounded-2xl border border-indigo-300/30 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <p className="text-xs font-bold text-indigo-200 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>AI Tutor Explanation</span>
                  </p>
                  <p className="text-xs leading-relaxed text-indigo-50">{currentQ.explanation}</p>
                </div>
              )}

              {/* Action Footer */}
              <div className="flex justify-end pt-4">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleConfirmAnswer}
                    disabled={!selectedOption}
                    className="px-6 py-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs shadow-xl transition-all disabled:opacity-40"
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs shadow-xl transition-all flex items-center gap-2"
                  >
                    <span>{currentIndex + 1 === questions.length ? 'Finish & Score' : 'Next Question'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quiz Result Screen */}
          {isQuizCompleted && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-3xl flex items-center justify-center text-indigo-950 shadow-2xl mb-4">
                <Trophy className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black">Quiz Completed!</h3>
              <p className="text-indigo-100 text-sm mt-1">You scored <strong className="text-white text-lg font-bold">{score} / {questions.length}</strong> ({Math.round((score/questions.length)*100)}%)</p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleStartQuiz}
                  className="px-5 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Smart Learning Analysis Panel */}
        <div className="bg-indigo-950/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
          <div className="border-b border-white/15 pb-4">
            <h4 className="font-bold text-base flex items-center gap-2 text-white">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>Smart Learning Analysis</span>
            </h4>
            <p className="text-white/60 text-xs mt-0.5">Global Supabase quiz history insights</p>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center gap-3 text-xs text-indigo-200 py-4">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Evaluating weak exam themes...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-4 text-xs">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
                <span className="text-white/60 block mb-1">Cumulative Avg. Score</span>
                <span className="text-2xl font-black text-white">{analysis.averageScore}%</span>
              </div>

              {analysis.weakThemes?.length > 0 && (
                <div className="bg-amber-500/20 border border-amber-300/30 p-4 rounded-2xl">
                  <p className="font-bold text-amber-200 flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Identified Weak Themes</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-amber-100">
                    {analysis.weakThemes.map((th: string, i: number) => (
                      <li key={i}>{th}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recommendations?.length > 0 && (
                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Revision Action Plan</span>
                  </p>
                  <ul className="space-y-1.5 text-white/80">
                    {analysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.encouragement && (
                <p className="italic text-indigo-200 text-[11px] text-center pt-2">{analysis.encouragement}</p>
              )}
            </div>
          ) : (
            <p className="text-white/50 text-xs italic">Complete at least one quiz to unlock targeted AI weakness diagnostics.</p>
          )}
        </div>
      </div>
    </div>
  );
}
