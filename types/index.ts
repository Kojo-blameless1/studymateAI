export interface Material {
  id: string;
  title: string;
  content: string;
  summary?: {
    overview: string;
    keyPoints: string[];
    definitions: { term: string; definition: string }[];
    examTips: string[];
    flashcards?: { topic: string; front: string; back: string }[];
  };
  created_at?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  material_id: string;
  questions: QuizQuestion[];
  score: number;
  created_at?: string;
}

export interface StudyPlanItem {
  time: string;
  subject: string;
  activity: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface StudyPlan {
  id: string;
  schedule: {
    dailyTimetable: StudyPlanItem[];
    revisionPriorities: string[];
    topicRecommendations: string[];
  };
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
