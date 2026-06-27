'use server';

import { GoogleGenAI } from '@google/genai';
import { QuizQuestion, StudyPlanItem } from '@/types';

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // If running in sandbox without user API key, return mock generator so MVP is testable
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateMaterialSummary(title: string, content: string) {
  const ai = getAIClient();
  if (!ai) {
    // Graceful fallback demo response
    return {
      overview: `Summary of "${title}": This document covers foundational principles and essential concepts relevant to academic coursework.`,
      keyPoints: [
        'Core conceptual framework identified within the provided lecture notes.',
        'Primary relationships between theoretical definitions and practical applications.',
        'High-yield topics frequently tested in standard assessments.'
      ],
      definitions: [
        { term: 'Primary Concept', definition: 'The central subject matter explored in this reading.' },
        { term: 'Analytical Methodology', definition: 'Systematic approach to evaluating study material.' }
      ],
      examTips: [
        'Review the key definitions carefully and test yourself without looking at notes.',
        'Focus on comparing and contrasting the main concepts.'
      ],
      flashcards: [
        { topic: title, front: `What is the core focus of ${title}?`, back: 'Understanding key principles and relationships.' },
        { topic: title, front: 'How should you prepare for questions on this topic?', back: 'By reviewing definitions and practicing active recall.' }
      ]
    };
  }

  const prompt = `You are an expert AI Study Mate and academic tutor. Analyze the following study material / lecture notes titled "${title}".
Content:
${content.slice(0, 15000)}

Generate a comprehensive, structured study guide in strictly valid JSON format conforming to this schema:
{
  "overview": "A concise 2-3 sentence executive summary of the text",
  "keyPoints": ["bullet point 1", "bullet point 2", "bullet point 3", "bullet point 4"],
  "definitions": [{"term": "Term Name", "definition": "Clear simple explanation"}],
  "examTips": ["High-yield exam focus area 1", "Tip 2"],
  "flashcards": [{"topic": "${title}", "front": "Question on front of card", "back": "Answer on back of card"}]
}
Return ONLY pure JSON without any markdown code block wrapper or preamble.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = res.text || '{}';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini Summarizer Error:', err);
    throw new Error('Failed to generate summary from AI.');
  }
}

export async function generateAIQuiz(title: string, content: string, questionCount: number = 5): Promise<QuizQuestion[]> {
  const ai = getAIClient();
  if (!ai) {
    return [
      {
        question: `According to the notes on "${title}", what is the primary objective of studying this material?`,
        options: [
          'To master foundational academic concepts and pass exams',
          'To memorize random numbers without context',
          'To skip lectures and rely solely on luck',
          'To avoid active recall techniques'
        ],
        correctAnswer: 'To master foundational academic concepts and pass exams',
        explanation: 'Active engagement with study materials is essential for long-term retention and academic success.'
      },
      {
        question: 'Which study method is most effective for exam preparation?',
        options: [
          'Active recall and spaced repetition flashcards',
          'Passive re-reading once the night before',
          'Highlighting entire pages in fluorescent yellow',
          'Listening to music while skimming headings'
        ],
        correctAnswer: 'Active recall and spaced repetition flashcards',
        explanation: 'Cognitive science consistently proves that active recall forces neural strengthening.'
      }
    ];
  }

  const prompt = `You are an expert exam question writer. Create ${questionCount} multiple-choice quiz questions based strictly on the provided study material titled "${title}".
Content:
${content.slice(0, 12000)}

Output strictly valid JSON array of objects with this exact schema:
[
  {
    "question": "Clear test question string",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Exact matching string of the correct option",
    "explanation": "Brief encouraging explanation of why this answer is correct"
  }
]
Ensure options are plausible and correctAnswer exactly matches one of the options. Return ONLY pure JSON.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = res.text || '[]';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini Quiz Error:', err);
    throw new Error('Failed to generate quiz from AI.');
  }
}

export async function sendTutorChatMessage(history: { role: string; content: string }[], newMessage: string, activeContext?: string) {
  const ai = getAIClient();
  if (!ai) {
    return `That's a great question about "${activeContext || 'your study material'}"! Think of it like building blocks: first we understand the core definition, then we connect it to real-world examples. Let me know if you want me to quiz you on this specific step!`;
  }

  const systemInstruction = `You are StudyMate AI, an encouraging, patient, and brilliant personal tutor for students. 
Your goal is to explain complex subjects simply using analogies, step-by-step breakdowns, and Socratic questioning.
${activeContext ? `Active Study Context:\n${activeContext.slice(0, 6000)}` : ''}`;

  const conversation = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  conversation.push({
    role: 'user',
    parts: [{ text: newMessage }]
  });

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemInstruction}\n\nConversation History:\n${JSON.stringify(conversation)}\n\nStudent asks: ${newMessage}`,
    });
    return res.text || 'I am here to help you study!';
  } catch (err) {
    console.error('Gemini Tutor Chat Error:', err);
    return "I'm having a slight moment connecting to my neural network. Could you repeat that question?";
  }
}

export async function generateStudyPlanAI(subjects: string, examDates: string, hoursPerDay: number) {
  const ai = getAIClient();
  if (!ai) {
    return {
      dailyTimetable: [
        { time: '09:00 - 10:30', subject: subjects || 'Major Subject', activity: 'Deep Work: Concept Review & Active Recall', priority: 'High' },
        { time: '11:00 - 12:00', subject: subjects || 'Major Subject', activity: 'Practice Problems & Quiz Testing', priority: 'High' },
        { time: '14:00 - 15:30', subject: 'General Revision', activity: 'Flashcard Spaced Repetition Review', priority: 'Medium' }
      ] as StudyPlanItem[],
      revisionPriorities: [
        `Master foundational definitions for ${subjects || 'your core classes'}`,
        'Complete at least 2 timed mock quizzes per week',
        'Review weak flashcard topics every morning'
      ],
      topicRecommendations: [
        'High-yield core theories & formulas',
        'Frequently missed multiple choice conceptual traps',
        'Essay outline structuring & argument flow'
      ]
    };
  }

  const prompt = `Create an optimized, student-friendly daily study plan and exam revision roadmap.
Input Parameters:
- Subjects to study: "${subjects}"
- Upcoming Exam Dates / Deadlines: "${examDates}"
- Available Study Hours per day: ${hoursPerDay} hours

Output strictly valid JSON object with this exact structure:
{
  "dailyTimetable": [
    { "time": "e.g. 09:00 - 10:30", "subject": "Subject Name", "activity": "Specific actionable study technique", "priority": "High" }
  ],
  "revisionPriorities": ["Priority 1", "Priority 2", "Priority 3"],
  "topicRecommendations": ["Recommended Topic 1", "Topic 2", "Topic 3"]
}
Return ONLY pure JSON.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = res.text || '{}';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini Study Plan Error:', err);
    throw new Error('Failed to generate study plan.');
  }
}

export async function analyzeQuizPerformance(quizHistory: { title?: string; score: number; total: number }[]) {
  const ai = getAIClient();
  const avg = quizHistory.length ? Math.round(quizHistory.reduce((acc, q) => acc + (q.score / q.total) * 100, 0) / quizHistory.length) : 0;
  
  if (!ai || quizHistory.length === 0) {
    return {
      averageScore: avg || 88,
      weakThemes: ['Electromagnetism formulas', 'Cellular Respiration enzyme steps'],
      recommendations: [
        'Spend 15 minutes reviewing flashcards before attempting new quizzes.',
        'Focus on understanding why incorrect options are wrong during quiz review.'
      ],
      encouragement: "You're making solid progress! Consistent daily review is building your long-term memory."
    };
  }

  const prompt = `Analyze this student's recent quiz score history across analyzed materials:
${JSON.stringify(quizHistory)}

Output strictly valid JSON object:
{
  "averageScore": ${avg},
  "weakThemes": ["Theme 1", "Theme 2"],
  "recommendations": ["Actionable tip 1", "Actionable tip 2"],
  "encouragement": "Encouraging closing sentence"
}
Return ONLY pure JSON.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = res.text || '{}';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      averageScore: avg,
      weakThemes: ['Complex analytical questions'],
      recommendations: ['Continue taking practice quizzes to build speed and accuracy.'],
      encouragement: 'Keep up the great effort!'
    };
  }
}
