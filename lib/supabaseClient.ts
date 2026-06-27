import { createClient } from '@supabase/supabase-js';
import { Material, Quiz, StudyPlan } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured =
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey.length > 10;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// In-memory / LocalStorage fallback for zero-config preview buildathon MVP
const STORAGE_KEYS = {
  materials: 'studymate_materials_v1',
  quizzes: 'studymate_quizzes_v1',
  study_plans: 'studymate_plans_v1',
};

const getLocal = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

// Initial Sample Demo Material so Dashboard isn't empty on launch
const DEMO_MATERIAL: Material = {
  id: 'demo-bio-101',
  title: 'Cellular Respiration & Krebs Cycle',
  content: `Cellular respiration is a set of metabolic reactions and processes that take place in the cells of organisms to convert biochemical energy from nutrients into adenosine triphosphate (ATP), and then release waste products. The reactions involved in respiration are catabolic reactions, which break large molecules into smaller ones, releasing energy.

Glycolysis occurs in the cytoplasm and breaks down glucose into pyruvate, yielding 2 ATP.
The Krebs cycle (Citric Acid cycle) takes place in the matrix of the mitochondria. Acetyl-CoA enters the cycle and combines with oxaloacetate. For every turn, it produces high-energy electron carriers (NADH and FADH2) and carbon dioxide (CO2).
Finally, the Electron Transport Chain (ETC) on the inner mitochondrial membrane creates a proton gradient that drives ATP synthase, generating roughly 30-32 ATP molecules.`,
  summary: {
    overview: 'Cellular respiration converts glucose and oxygen into ATP energy, water, and carbon dioxide through three main stages: Glycolysis, Krebs Cycle, and ETC.',
    keyPoints: [
      'Glycolysis occurs in the cytoplasm and produces 2 net ATP.',
      'Krebs Cycle takes place in the mitochondrial matrix, generating NADH, FADH2, and releasing CO2.',
      'Electron Transport Chain (ETC) generates the vast majority of ATP (~30-32 ATP) via oxidative phosphorylation.'
    ],
    definitions: [
      { term: 'ATP (Adenosine Triphosphate)', definition: 'The primary universal energy currency of cellular processes.' },
      { term: 'Glycolysis', definition: 'The anaerobic breakdown of glucose into pyruvate in the cell cytoplasm.' },
      { term: 'Krebs Cycle', definition: 'A series of chemical reactions used by all aerobic organisms to release stored energy through the oxidation of acetyl-CoA.' }
    ],
    examTips: [
      'Remember the exact locations: Glycolysis in cytoplasm, Krebs in mitochondrial matrix, ETC on inner mitochondrial membrane.',
      'Be ready to explain the role of oxygen as the final electron acceptor in the ETC.'
    ],
    flashcards: [
      { topic: 'Biology', front: 'Where does Glycolysis take place?', back: 'In the cell cytoplasm.' },
      { topic: 'Biology', front: 'What is the primary function of the Krebs cycle?', back: 'To oxidize Acetyl-CoA and produce NADH/FADH2 for the electron transport chain.' },
      { topic: 'Biology', front: 'How many net ATP molecules are produced during Glycolysis?', back: '2 ATP.' }
    ]
  },
  created_at: new Date().toISOString()
};

export const db = {
  async getMaterials(): Promise<Material[]> {
    if (supabase) {
      const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (!error && data) return data.map(item => ({
        ...item,
        summary: typeof item.summary === 'string' ? JSON.parse(item.summary) : item.summary
      }));
    }
    const items = getLocal<Material>(STORAGE_KEYS.materials);
    if (items.length === 0) {
      setLocal(STORAGE_KEYS.materials, [DEMO_MATERIAL]);
      return [DEMO_MATERIAL];
    }
    return items;
  },

  async saveMaterial(material: Material): Promise<Material> {
    if (supabase) {
      const payload = {
        id: material.id,
        title: material.title,
        content: material.content,
        summary: material.summary,
        created_at: material.created_at || new Date().toISOString()
      };
      await supabase.from('materials').insert(payload);
    }
    const items = getLocal<Material>(STORAGE_KEYS.materials);
    const updated = [material, ...items.filter(m => m.id !== material.id)];
    setLocal(STORAGE_KEYS.materials, updated);
    return material;
  },

  async getQuizzes(): Promise<Quiz[]> {
    if (supabase) {
      const { data, error } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
      if (!error && data) return data.map(item => ({
        ...item,
        questions: typeof item.questions === 'string' ? JSON.parse(item.questions) : item.questions
      }));
    }
    return getLocal<Quiz>(STORAGE_KEYS.quizzes);
  },

  async saveQuiz(quiz: Quiz): Promise<Quiz> {
    if (supabase) {
      const payload = {
        id: quiz.id,
        material_id: quiz.material_id,
        questions: quiz.questions,
        score: quiz.score,
        created_at: quiz.created_at || new Date().toISOString()
      };
      await supabase.from('quizzes').insert(payload);
    }
    const items = getLocal<Quiz>(STORAGE_KEYS.quizzes);
    const updated = [quiz, ...items.filter(q => q.id !== quiz.id)];
    setLocal(STORAGE_KEYS.quizzes, updated);
    return quiz;
  },

  async getStudyPlans(): Promise<StudyPlan[]> {
    if (supabase) {
      const { data, error } = await supabase.from('study_plans').select('*').order('created_at', { ascending: false });
      if (!error && data) return data.map(item => ({
        ...item,
        schedule: typeof item.schedule === 'string' ? JSON.parse(item.schedule) : item.schedule
      }));
    }
    return getLocal<StudyPlan>(STORAGE_KEYS.study_plans);
  },

  async saveStudyPlan(plan: StudyPlan): Promise<StudyPlan> {
    if (supabase) {
      const payload = {
        id: plan.id,
        schedule: plan.schedule,
        created_at: plan.created_at || new Date().toISOString()
      };
      await supabase.from('study_plans').insert(payload);
    }
    const items = getLocal<StudyPlan>(STORAGE_KEYS.study_plans);
    const updated = [plan, ...items.filter(p => p.id !== plan.id)];
    setLocal(STORAGE_KEYS.study_plans, updated);
    return plan;
  }
};
