-- ============================================
-- FitBot Database Setup Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    age INTEGER,
    height NUMERIC,
    weight NUMERIC,
    bmi NUMERIC,
    fitness_goal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ============================================
-- 2. EXERCISE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.exercise_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    duration INTEGER, -- in minutes
    calories_burned INTEGER,
    sets INTEGER,
    reps INTEGER,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.exercise_history ENABLE ROW LEVEL SECURITY;

-- Exercise history policies
CREATE POLICY "Users can view own exercise history" 
    ON public.exercise_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise history" 
    ON public.exercise_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise history" 
    ON public.exercise_history FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise history" 
    ON public.exercise_history FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- 3. CHAT MESSAGES TABLE (Optional - for AI Chat history)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" 
    ON public.chat_messages FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" 
    ON public.chat_messages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" 
    ON public.chat_messages FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_exercise_history_user_id ON public.exercise_history(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_history_completed_at ON public.exercise_history(completed_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- ============================================
-- 5. CREATE FUNCTION TO AUTO-CREATE PROFILE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. CREATE TRIGGER FOR AUTO-PROFILE CREATION
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- You can now:
-- 1. Sign up new users
-- 2. Store exercise history
-- 3. Save chat messages
-- 4. Track user profiles
-- ============================================
