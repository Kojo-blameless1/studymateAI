'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Layers, HelpCircle, Calendar, Bot, Sparkles, Plus, Trophy, 
  Flame, CheckCircle2, ArrowRight, ExternalLink, RefreshCw, ChevronRight,
  Database, Rocket, Menu, X, FileText
} from 'lucide-react';
import { db, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Material, Quiz, StudyPlan } from '@/types';
import MaterialUpload from '@/components/MaterialUpload';
import AITutorChat from '@/components/AITutorChat';
import AIQuizView from '@/components/AIQuizView';
import FlashcardsView from '@/components/FlashcardsView';
import StudyPlannerView from '@/components/StudyPlannerView';
import MaterialDetailModal from '@/components/MaterialDetailModal';

type NavTab = 'dashboard' | 'materials' | 'flashcards' | 'quizzes' | 'planner' | 'chat' | 'deploy';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Modals & Active Items
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [activeChatMaterial, setActiveChatMaterial] = useState<Material | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoadingData(true);
    try {
      const [matData, qzData, planData] = await Promise.all([
        db.getMaterials(),
        db.getQuizzes(),
        db.getStudyPlans()
      ]);
      setMaterials(matData);
      setQuizzes(qzData);
      setPlans(planData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Stats calculations
  const totalMaterials = materials.length;
  const avgScore = quizzes.length > 0 
    ? Math.round(quizzes.reduce((acc, q) => acc + (q.score / (q.questions?.length || 5)) * 100, 0) / quizzes.length) 
    : 88;
  const activePlansCount = plans.length || 1;

  const handleMaterialCreated = (newMat: Material) => {
    setMaterials(prev => [newMat, ...prev]);
    setIsUploadOpen(false);
    setSelectedMaterial(newMat);
  };

  const NAV_ITEMS: { id: NavTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'materials', label: 'Materials Library', icon: FileText },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'quizzes', label: 'AI Quizzes', icon: HelpCircle },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'chat', label: 'AI Tutor Chat', icon: Bot },
    { id: 'deploy', label: 'Vercel Guide', icon: Rocket },
  ];

  const BADGE_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-fuchsia-500', 'bg-cyan-500'];

  return (
    <div className="w-full h-screen bg-gradient-to-br from-indigo-600 via-violet-500 to-fuchsia-500 flex flex-col md:flex-row p-3 md:p-6 overflow-hidden font-sans text-slate-800 select-none">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-white/20 backdrop-blur-xl border border-white/30 px-5 py-3.5 rounded-2xl mb-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-md text-indigo-600 font-black">
            S
          </div>
          <span className="font-bold tracking-tight text-lg">StudyMate AI</span>
        </div>
        <button 
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 bg-white/20 rounded-xl text-white"
        >
          {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Navigation Sidebar (Frosted Glass Template) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/20 backdrop-blur-2xl md:backdrop-blur-xl border border-white/30 md:rounded-3xl flex flex-col p-6 shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${
        isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="hidden md:flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg text-indigo-600 font-extrabold text-xl">
            🎓
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">StudyMate AI</h1>
            <span className="text-[10px] text-indigo-200 uppercase tracking-widest font-extrabold">No-Auth MVP</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 mt-8 md:mt-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileNavOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                  isActive 
                    ? 'bg-white/40 text-indigo-950 shadow-md font-bold scale-[1.02]' 
                    : 'text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-700' : 'text-white/80'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Database Mode Pill */}
        <div className="mb-4 px-3.5 py-2.5 bg-black/20 rounded-xl border border-white/10 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-[11px]">Database</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${isSupabaseConfigured ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-indigo-950'}`}>
            {isSupabaseConfigured ? 'Supabase Live' : 'Demo Memory'}
          </span>
        </div>

        {/* Weekly Goal Progress Box */}
        <div className="p-4 bg-white/10 rounded-2xl border border-white/20 text-white">
          <p className="text-xs text-white/70 mb-2 uppercase tracking-wider font-bold">MVP Revision Goal</p>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-white w-3/4 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
          </div>
          <p className="text-xs font-medium text-right">75% Complete</p>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-6 flex flex-col gap-6 min-w-0 min-h-0 overflow-hidden">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/10 backdrop-blur-md px-6 md:px-8 py-4 rounded-3xl border border-white/20 gap-4 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span>Welcome to StudyMate AI</span>
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse hidden sm:inline" />
            </h2>
            <p className="text-indigo-100 text-xs md:text-sm">Your all-in-one generative study hub. Powered by Next.js, Supabase & Gemini.</p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-xs md:text-sm shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>
            <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-gradient-to-br from-yellow-300 to-orange-400 shadow-md shrink-0 flex items-center justify-center text-indigo-950 font-black text-sm">
              AI
            </div>
          </div>
        </header>

        {/* View Routing */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pr-1">
            
            {/* Stats Row */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 shrink-0">
              <div className="bg-white/30 backdrop-blur-lg border border-white/40 p-5 rounded-3xl shadow-lg transition-transform hover:-translate-y-1">
                <p className="text-white/80 text-xs md:text-sm font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-200" />
                  <span>Total Materials Analyzed</span>
                </p>
                <h3 className="text-3xl md:text-4xl font-black text-white mt-1">{totalMaterials}</h3>
              </div>

              <div className="bg-white/30 backdrop-blur-lg border border-white/40 p-5 rounded-3xl shadow-lg transition-transform hover:-translate-y-1">
                <p className="text-white/80 text-xs md:text-sm font-semibold flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-200" />
                  <span>Average Quiz Score</span>
                </p>
                <h3 className="text-3xl md:text-4xl font-black text-white mt-1">{avgScore}<span className="text-xl font-normal">%</span></h3>
              </div>

              <div className="bg-white/30 backdrop-blur-lg border border-white/40 p-5 rounded-3xl shadow-lg transition-transform hover:-translate-y-1">
                <p className="text-white/80 text-xs md:text-sm font-semibold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-200" />
                  <span>Active Study Plans</span>
                </p>
                <h3 className="text-3xl md:text-4xl font-black text-white mt-1">{activePlansCount} <span className="text-base font-normal">active</span></h3>
              </div>
            </section>

            {/* Main Workspace Grid (Frosted Glass Template) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[420px]">
              
              {/* Recent Materials */}
              <section className="lg:col-span-3 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden text-white">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-200" />
                      <span>Recent Study Materials</span>
                    </h4>
                    <button 
                      onClick={() => setActiveTab('materials')}
                      className="text-white/70 text-xs font-bold hover:text-white flex items-center gap-1"
                    >
                      <span>View All ({materials.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                    {materials.slice(0, 4).map((mat, idx) => {
                      const badgeBg = BADGE_COLORS[idx % BADGE_COLORS.length];
                      return (
                        <div 
                          key={mat.id}
                          onClick={() => setSelectedMaterial(mat)}
                          className="bg-white/30 hover:bg-white/45 p-4 rounded-2xl flex items-center gap-4 border border-white/20 cursor-pointer transition-all group shadow-sm"
                        >
                          <div className={`w-12 h-12 ${badgeBg} rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shrink-0`}>
                            {mat.title.slice(0, 3).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className="text-indigo-950 font-bold text-sm truncate">{mat.title}</h5>
                            <p className="text-indigo-900/70 text-xs truncate mt-0.5">
                              {mat.summary?.definitions?.length || 3} Definitions • {mat.summary?.flashcards?.length || 4} Flashcards
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveChatMaterial(mat);
                                setActiveTab('chat');
                              }}
                              className="px-3 py-1.5 bg-white/40 hover:bg-white text-indigo-950 text-xs rounded-xl font-bold transition-colors"
                            >
                              Tutor
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMaterial(mat);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl font-bold shadow-md transition-colors"
                            >
                              Study
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {materials.length === 0 && (
                      <div className="text-center py-10 text-white/60 text-xs border border-dashed border-white/20 rounded-2xl">
                        No materials uploaded yet. Click &quot;Upload Notes&quot; above to start!
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <div className="bg-indigo-950/40 rounded-2xl p-4 border border-indigo-200/20 flex items-center justify-between">
                    <div>
                      <h6 className="text-white font-bold text-xs flex items-center gap-1.5 mb-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>AI Tip: Spaced Repetition</span>
                      </h6>
                      <p className="text-indigo-100 text-xs leading-relaxed max-w-md">
                        Reviewing notes within 24 hours of lecture boosts recall by over 60%. Try a quick quiz!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('quizzes')}
                      className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-extrabold text-xs shadow-md hover:bg-indigo-50 transition-colors shrink-0"
                    >
                      Quiz Now
                    </button>
                  </div>
                </div>
              </section>

              {/* AI Tutor Sidebar Widget */}
              <section className="lg:col-span-2 bg-indigo-950/40 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl flex flex-col min-h-[360px] overflow-hidden text-white">
                <div className="bg-white/10 p-4 border-b border-white/10 flex justify-between items-center shrink-0">
                  <div>
                    <h4 className="font-bold text-sm md:text-base">AI Tutor Quick Chat</h4>
                    <p className="text-white/50 text-[11px] truncate max-w-[200px]">
                      Context: {activeChatMaterial?.title || materials[0]?.title || 'Biology & General'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold"
                  >
                    Open Full
                  </button>
                </div>

                <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs font-sans">
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-white p-3 rounded-2xl rounded-tl-none max-w-[88%] border border-white/10 shadow-md">
                      Hello! I have analyzed your uploaded notes. Want me to break down difficult terms into simple 12-year-old analogies?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[88%] shadow-lg font-medium">
                      Yes, simplify the main Krebs cycle concept first.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-white p-3 rounded-2xl rounded-tl-none max-w-[88%] border border-white/10 shadow-md leading-relaxed">
                      Think of it like a spinning water wheel! You input glucose energy fuel, and every turn generates ATP rechargeable batteries.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/30 border-t border-white/10 shrink-0">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="w-full py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-white/15"
                  >
                    <Bot className="w-4 h-4 text-indigo-300" />
                    <span>Continue in Tutor Chat Room</span>
                  </button>
                </div>
              </section>

            </div>

          </div>
        )}

        {/* Dedicated Views */}
        {activeTab === 'materials' && (
          <div className="flex-1 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-2xl flex flex-col min-h-0 overflow-hidden text-white">
            <div className="flex justify-between items-center pb-4 border-b border-white/20 shrink-0">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Study Materials Library</h3>
                <p className="text-indigo-100 text-xs mt-0.5">All uploaded lecture notes stored in public Supabase PostgreSQL table.</p>
              </div>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-xl text-xs shadow-lg hover:bg-indigo-50 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 space-y-3 min-h-0 pr-1">
              {materials.map((mat, idx) => (
                <div 
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat)}
                  className="bg-white/25 hover:bg-white/35 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/20 cursor-pointer transition-all shadow-md"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
                      {mat.title.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">{mat.title}</h4>
                      <p className="text-indigo-100 text-xs line-clamp-1 mt-0.5 font-sans">{mat.summary?.overview || mat.content?.slice(0, 100)}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-white/70 font-semibold">
                        <span>{mat.summary?.keyPoints?.length || 3} Key Points</span>
                        <span>•</span>
                        <span>{mat.summary?.definitions?.length || 3} Definitions</span>
                        <span>•</span>
                        <span>{mat.created_at ? new Date(mat.created_at).toLocaleDateString() : 'Active'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChatMaterial(mat);
                        setActiveTab('chat');
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-all border border-white/20"
                    >
                      AI Tutor
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMaterial(mat);
                      }}
                      className="px-5 py-2 bg-white text-indigo-700 text-xs font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-all"
                    >
                      Inspect Summary
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView materials={materials} />
        )}

        {activeTab === 'quizzes' && (
          <AIQuizView materials={materials} onScoreUpdated={fetchAllData} />
        )}

        {activeTab === 'planner' && (
          <StudyPlannerView existingPlans={plans} onPlanCreated={fetchAllData} />
        )}

        {activeTab === 'chat' && (
          <AITutorChat activeMaterial={activeChatMaterial || materials[0]} />
        )}

        {activeTab === 'deploy' && (
          <div className="flex-1 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto text-white">
            <div className="max-w-3xl mx-auto space-y-8">
              
              <div className="flex items-center gap-4 border-b border-white/20 pb-6">
                <div className="w-14 h-14 bg-white text-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shrink-0">
                  <Rocket className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">Vercel Deployment Guide</h3>
                  <p className="text-indigo-100 text-xs md:text-sm mt-1">Zero-cost production deployment blueprint for StudyMate AI MVP.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm">
                <div className="bg-indigo-950/50 p-5 rounded-2xl border border-white/15 space-y-2">
                  <h4 className="font-bold text-yellow-300 flex items-center gap-2 text-sm md:text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Step 1: Initialize Supabase SQL Schema</span>
                  </h4>
                  <p className="text-white/80 leading-relaxed">
                    Open your Supabase project dashboard, navigate to the <strong>SQL Editor</strong> tab, copy the contents of <code className="bg-black/30 px-2 py-0.5 rounded text-indigo-300 font-mono">/supabase_schema.sql</code> from this repository, and click <strong>Run</strong>. This creates the public <code className="bg-black/30 px-1 rounded">materials</code>, <code className="bg-black/30 px-1 rounded">quizzes</code>, and <code className="bg-black/30 px-1 rounded">study_plans</code> flat tables.
                  </p>
                </div>

                <div className="bg-indigo-950/50 p-5 rounded-2xl border border-white/15 space-y-2">
                  <h4 className="font-bold text-yellow-300 flex items-center gap-2 text-sm md:text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Step 2: Push Repository to GitHub</span>
                  </h4>
                  <p className="text-white/80 leading-relaxed">
                    Export or clone this AI Studio workspace to your local machine or directly export to GitHub repository. Ensure <code className="bg-black/30 px-2 py-0.5 rounded text-indigo-300 font-mono">package.json</code> and <code className="bg-black/30 px-2 py-0.5 rounded text-indigo-300 font-mono">next.config.ts</code> are intact at the project root.
                  </p>
                </div>

                <div className="bg-indigo-950/50 p-5 rounded-2xl border border-white/15 space-y-3">
                  <h4 className="font-bold text-yellow-300 flex items-center gap-2 text-sm md:text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Step 3: Import into Vercel & Set Environment Variables</span>
                  </h4>
                  <p className="text-white/80 leading-relaxed">
                    Go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="underline font-bold text-indigo-300">vercel.com/new</a>, import your GitHub repository, and add the exact following environment variables in the <strong>Environment Variables</strong> configuration section:
                  </p>
                  
                  <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-indigo-200 space-y-1 overflow-x-auto border border-white/10">
                    <p><strong className="text-white">GEMINI_API_KEY</strong> = &quot;AIzaSy...your_gemini_api_key&quot;</p>
                    <p><strong className="text-white">NEXT_PUBLIC_SUPABASE_URL</strong> = &quot;https://yourproject.supabase.co&quot;</p>
                    <p><strong className="text-white">NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> = &quot;eyJhbG...your_anon_key&quot;</p>
                  </div>
                </div>

                <div className="bg-emerald-500/20 border border-emerald-300/40 p-5 rounded-2xl text-emerald-100 text-xs md:text-sm leading-relaxed">
                  🚀 <strong>Buildathon Ready:</strong> Once deployed, Vercel automatically compiles server actions in <code className="bg-black/20 px-1 rounded">lib/gemini.ts</code> securely without exposing your Google AI Studio secret key to client browsers!
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Upload Modal */}
      {isUploadOpen && (
        <MaterialUpload
          onSuccess={handleMaterialCreated}
          onCancel={() => setIsUploadOpen(false)}
        />
      )}

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onStartQuiz={(matId) => {
            setActiveTab('quizzes');
          }}
          onViewFlashcards={(matId) => {
            setActiveTab('flashcards');
          }}
        />
      )}

    </div>
  );
}
