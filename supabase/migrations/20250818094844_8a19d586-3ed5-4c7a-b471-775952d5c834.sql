-- Fix security warning by updating the function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.accounts (id, default_link, reply_to_comments, comment_limit, dm_template, created_at)
  VALUES (NEW.id, NULL, true, 200, 'Thanks! Here''s the link: {link}', now());
  RETURN NEW;
END;
$$;