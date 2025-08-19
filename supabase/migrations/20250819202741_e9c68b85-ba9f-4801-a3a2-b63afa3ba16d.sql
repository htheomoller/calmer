-- Create dev_breadcrumbs table for tracking development changes
CREATE TABLE public.dev_breadcrumbs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_email TEXT NOT NULL,
  scope TEXT NOT NULL,
  summary TEXT NOT NULL,
  details TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[]
);

-- Enable Row Level Security
ALTER TABLE public.dev_breadcrumbs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own breadcrumbs"
ON public.dev_breadcrumbs
FOR SELECT
USING (auth.email() = author_email);

CREATE POLICY "Users can insert their own breadcrumbs"
ON public.dev_breadcrumbs
FOR INSERT
WITH CHECK (auth.email() = author_email);

CREATE POLICY "Users can update their own breadcrumbs"
ON public.dev_breadcrumbs
FOR UPDATE
USING (auth.email() = author_email);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
ON public.dev_breadcrumbs
FOR ALL
USING (auth.role() = 'service_role');