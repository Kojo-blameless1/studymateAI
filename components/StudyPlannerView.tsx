'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, AlertCircle, CheckCircle2, Bookmark, Loader2, ArrowRight } from 'lucide-react';
import { db } from '@/lib/supabaseClient';
import { generateStudyPlanAI } from '@/lib/gemini';
import { StudyPlan, StudyPlanItem } from '@/types';

interface StudyPlannerViewProps {
  onPlanCreated: () => void;
  existingPlans: StudyPlan[];
}

export default function StudyPlannerView({ onPlanCreated, existingPlans }: StudyPlannerViewProps) {
  const [subjects, setSubjects] = useState('Biology, European History, Psychology');
  const [examDates, setExamDates] = useState('Midterms in 2 weeks (Oct 24 - Oct 28)');
  const [hoursPerDay, setHoursPerDay] = useState<number>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(existingPlans[0] || null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjects.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const schedule = await generateStudyPlanAI(subjects, examDates, hoursPerDay);
      const newPlan: StudyPlan = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `plan_${Date.now()}`,
        schedule,
        created_at: new Date().toISOString()
      };
      await db.saveStudyPlan(newPlan);
      setActivePlan(newPlan);
      onPlanCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI timetable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 text-white min-h-0 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-emerald-300" />
            <span>AI Study Planner & Revision Scheduler</span>
          </h3>
          <p className="text-indigo-100 text-xs mt-1">Input your upcoming deadlines to prompt Gemini for a structured daily timetable & high-yield priorities.</p>
        </div>

        {existingPlans.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/70">Saved Plans:</span>
            <select
              value={activePlan?.id || ''}
              onChange={(e) => {
                const found = existingPlans.find(p => p.id === e.target.value);
                if (found) setActivePlan(found);
              }}
              className="bg-white/10 border border-white/30 rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              {existingPlans.map((p, idx) => (
                <option key={p.id} value={p.id} className="bg-indigo-950 text-white">
                  Plan #{existingPlans.length - idx} ({p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/30 border border-rose-300/40 rounded-2xl text-rose-100 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Form Column */}
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Configure New Roadmap</span>
            </h4>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1.5 text-white/90">Target Subjects / Modules</label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="e.g. Calculus II, Physics, Organic Chemistry"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-white/90">Upcoming Exam Dates / Deadlines</label>
                <input
                  type="text"
                  value={examDates}
                  onChange={(e) => setExamDates(e.target.value)}
                  placeholder="e.g. Final exam Nov 15th"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-white/90">Available Study Hours per Day: <strong className="text-white text-sm">{hoursPerDay}h</strong></label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[10px] text-white/50 mt-1">
                  <span>1 hour (Light)</span>
                  <span>6 hours (Moderate)</span>
                  <span>12 hours (Intense)</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading || !subjects.trim()}
                  className="w-full py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Timetable...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Timetable</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 p-4 bg-indigo-950/40 rounded-2xl border border-white/10 text-[11px] text-indigo-100 leading-relaxed">
            💡 <strong>Pro-Tip:</strong> Gemini optimizes cognitive load by placing challenging analytical problem-solving early in your daily schedule when willpower is highest.
          </div>
        </div>

        {/* Timetable Display Column */}
        <div className="lg:col-span-2 bg-indigo-950/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto">
          {activePlan ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Daily Timetable */}
              <div>
                <h4 className="font-bold text-base flex items-center gap-2 mb-3 text-white">
                  <Clock className="w-4 h-4 text-emerald-300" />
                  <span>Structured Daily Timetable</span>
                </h4>
                <div className="space-y-2.5">
                  {activePlan.schedule?.dailyTimetable?.map((item: StudyPlanItem, i: number) => {
                    let badgeCol = "bg-emerald-400/20 text-emerald-200 border-emerald-300/30";
                    if (item.priority === 'High') badgeCol = "bg-rose-400/20 text-rose-200 border-rose-300/30";
                    if (item.priority === 'Medium') badgeCol = "bg-amber-400/20 text-amber-200 border-amber-300/30";

                    return (
                      <div key={i} className="bg-white/10 p-4 rounded-2xl border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-indigo-300 bg-black/30 px-2.5 py-1 rounded-lg shrink-0">{item.time}</span>
                          <div>
                            <p className="font-bold text-sm text-white">{item.subject}</p>
                            <p className="text-white/70 text-xs mt-0.5">{item.activity}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider shrink-0 self-start sm:self-auto ${badgeCol}`}>
                          {item.priority} Priority
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priorities & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Revision Priorities */}
                <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-yellow-300 mb-2.5 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Core Revision Priorities</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-white/80">
                    {activePlan.schedule?.revisionPriorities?.map((rp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                        <span>{rp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Topic Recommendations */}
                <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-300 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Targeted Topic Focus</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-white/80">
                    {activePlan.schedule?.topicRecommendations?.map((tr: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{tr}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <Calendar className="w-12 h-12 text-white/30 mb-3" />
              <h4 className="font-bold text-base text-white">No Timetable Active</h4>
              <p className="text-white/60 text-xs max-w-xs mt-1">Fill out your target classes and exam dates on the left to generate an instant AI revision schedule.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
