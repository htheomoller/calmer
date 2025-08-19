-- Add trigger system columns to posts table
ALTER TABLE public.posts 
ADD COLUMN trigger_mode text DEFAULT 'exact_phrase',
ADD COLUMN trigger_list text[] DEFAULT ARRAY['LINK'],
ADD COLUMN typo_tolerance boolean DEFAULT false;

-- Add default trigger settings to accounts table
ALTER TABLE public.accounts 
ADD COLUMN default_trigger_mode text DEFAULT 'exact_phrase',
ADD COLUMN default_trigger_list text[] DEFAULT ARRAY['LINK'], 
ADD COLUMN default_typo_tolerance boolean DEFAULT false;

-- Migrate existing code field to new trigger system
UPDATE public.posts 
SET 
  trigger_mode = 'exact_phrase',
  trigger_list = CASE 
    WHEN code IS NOT NULL AND code != '' THEN ARRAY[code]
    ELSE ARRAY['LINK']
  END,
  typo_tolerance = false
WHERE trigger_list IS NULL;

-- Add indexes for performance
CREATE INDEX idx_posts_trigger_mode ON public.posts(trigger_mode);
CREATE INDEX idx_posts_trigger_list ON public.posts USING GIN(trigger_list);

-- Add check constraints for validation
ALTER TABLE public.posts 
ADD CONSTRAINT check_trigger_mode 
CHECK (trigger_mode IN ('exact_phrase', 'any_keywords', 'all_words'));

ALTER TABLE public.accounts 
ADD CONSTRAINT check_default_trigger_mode 
CHECK (default_trigger_mode IN ('exact_phrase', 'any_keywords', 'all_words'));