-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(), -- Linked to Supabase Auth
    name TEXT NOT NULL,
    gender TEXT,
    password TEXT, -- Encrypted or plain? App seems to use it for local lock
    theme TEXT DEFAULT 'light',
    accent_color TEXT DEFAULT '#2E7D32',
    goals JSONB DEFAULT '{}'::jsonb,
    memorizations JSONB DEFAULT '{"surahParts": [], "hizbs": [], "juzz": []}'::jsonb,
    evaluation_history JSONB DEFAULT '[]'::jsonb,
    badges JSONB DEFAULT '[]'::jsonb,
    hadith_progress JSONB DEFAULT '{}'::jsonb,
    hadith_history JSONB DEFAULT '[]'::jsonb,
    evaluation_plans JSONB DEFAULT '[]'::jsonb,
    difficulties JSONB DEFAULT '[]'::jsonb,
    progress JSONB DEFAULT '{}'::jsonb,
    plans JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY DEFAULT auth.uid(),
    lang TEXT DEFAULT 'fr',
    enable_notifications BOOLEAN DEFAULT true,
    notification_time TEXT DEFAULT '09:00',
    active_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Users can only see their own profiles" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" 
ON public.profiles FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for User Settings
CREATE POLICY "Users can manage their own settings" 
ON public.user_settings FOR ALL 
USING (auth.uid() = user_id);

-- Function to handle timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
