-- StudyMate AI - Supabase PostgreSQL DDL Schema (No Auth MVP)
-- Copy and paste this script into your Supabase SQL Editor and click 'Run'.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Materials table: stores uploaded notes, titles, raw text, and generated AI summaries
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Quizzes table: stores AI generated question sets and student score history
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Study Plans table: stores AI generated study timetables and revision roadmaps
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) and allow public read/write for No-Auth MVP buildathon simplicity
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to quizzes" ON public.quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to study_plans" ON public.study_plans FOR ALL USING (true) WITH CHECK (true);
