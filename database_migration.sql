-- Calmer Database Schema
-- Tables for users, chat messages, daily plans, and progress tracking

-- User profiles table (public data about users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  business_name TEXT,
  business_type TEXT,
  social_media_platforms TEXT[],
  current_posting_frequency TEXT,
  biggest_challenge TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily plans table (template plans)
CREATE TABLE public.daily_plan_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- Array of step objects
  business_type TEXT,
  platform_focus TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's personalized daily plans
CREATE TABLE public.user_daily_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_date DATE NOT NULL,
  steps JSONB NOT NULL, -- Array of step objects with completion status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

-- User progress tracking
CREATE TABLE public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_id TEXT NOT NULL,
  plan_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_id, plan_date)
);

-- Waitlist for landing pages
CREATE TABLE public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT, -- 'problem-first' or 'story-first'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User daily plans
ALTER TABLE public.user_daily_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plans" ON public.user_daily_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.user_daily_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.user_daily_plans FOR UPDATE USING (auth.uid() = user_id);

-- User progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily plan templates (read-only for users)
ALTER TABLE public.daily_plan_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read plan templates" ON public.daily_plan_templates FOR SELECT TO public USING (true);

-- Waitlist (insert only)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO public WITH CHECK (true);

-- Insert some sample daily plan templates
INSERT INTO public.daily_plan_templates (name, description, steps, business_type, platform_focus) VALUES
(
  'Mindful Social Media for Service Businesses',
  'A gentle approach to social media for service-based businesses',
  '[
    {
      "id": "morning_intention",
      "title": "Set Your Daily Intention",
      "description": "Before opening any social app, take 2 minutes to write down what you want to accomplish today.",
      "time_estimate": "2 min",
      "category": "mindfulness"
    },
    {
      "id": "single_platform_check",
      "title": "Check One Platform Only",
      "description": "Choose one platform to check for messages and engagement. Avoid the scroll trap.",
      "time_estimate": "10 min",
      "category": "engagement"
    },
    {
      "id": "value_first_content",
      "title": "Share One Helpful Tip",
      "description": "Post something that helps your audience solve a small problem.",
      "time_estimate": "15 min",
      "category": "content"
    },
    {
      "id": "evening_reflection",
      "title": "Reflect on Your Day",
      "description": "Did your social media use align with your business goals today?",
      "time_estimate": "3 min",
      "category": "reflection"
    }
  ]'::jsonb,
  'service',
  ARRAY['instagram', 'facebook', 'linkedin']
),
(
  'Content Creator Mindful Framework',
  'For creators who want to stay consistent without burning out',
  '[
    {
      "id": "content_planning",
      "title": "Plan Tomorrow Content",
      "description": "Spend 10 minutes planning what you will share tomorrow. No last-minute pressure.",
      "time_estimate": "10 min",
      "category": "planning"
    },
    {
      "id": "authentic_check_in",
      "title": "Authentic Check-in",
      "description": "Share something real about your day or process. Your audience loves authenticity.",
      "time_estimate": "5 min",
      "category": "content"
    },
    {
      "id": "community_time",
      "title": "Community Engagement",
      "description": "Spend focused time responding to comments and engaging with your community.",
      "time_estimate": "15 min",
      "category": "engagement"
    },
    {
      "id": "social_media_boundary",
      "title": "Set Tomorrow Boundary",
      "description": "Decide when you will and won not check social media tomorrow.",
      "time_estimate": "2 min",
      "category": "boundaries"
    }
  ]'::jsonb,
  'creative',
  ARRAY['instagram', 'tiktok', 'youtube']
);

-- Function to handle user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to clean up old chat messages (30-day limit for free plan)
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.chat_messages 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily plan for user
CREATE OR REPLACE FUNCTION public.generate_daily_plan_for_user(user_id_param UUID, business_type_param TEXT DEFAULT 'service')
RETURNS void AS $$
DECLARE
  template_steps JSONB;
  plan_date_param DATE := CURRENT_DATE;
BEGIN
  -- Get template steps based on business type
  SELECT steps INTO template_steps
  FROM public.daily_plan_templates
  WHERE business_type = business_type_param
  LIMIT 1;

  -- If no specific template found, use default service template
  IF template_steps IS NULL THEN
    SELECT steps INTO template_steps
    FROM public.daily_plan_templates
    WHERE business_type = 'service'
    LIMIT 1;
  END IF;

  -- Add completion status to each step
  SELECT jsonb_agg(
    step_obj || jsonb_build_object('completed', false)
  ) INTO template_steps
  FROM jsonb_array_elements(template_steps) as step_obj;

  -- Insert or update the daily plan
  INSERT INTO public.user_daily_plans (user_id, plan_date, steps)
  VALUES (user_id_param, plan_date_param, template_steps)
  ON CONFLICT (user_id, plan_date)
  DO UPDATE SET steps = EXCLUDED.steps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;