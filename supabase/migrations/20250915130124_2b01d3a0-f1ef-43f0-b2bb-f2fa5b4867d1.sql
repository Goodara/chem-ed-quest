-- Create comments table for module discussions
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
DO $$
BEGIN
  -- Users can insert their own comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'Users can insert their own comments'
  ) THEN
    CREATE POLICY "Users can insert their own comments"
    ON public.comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Authenticated users can view comments (for in-module discussion)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'Authenticated users can view comments'
  ) THEN
    CREATE POLICY "Authenticated users can view comments"
    ON public.comments
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;

  -- Admins can view all comments explicitly (redundant with above but explicit admin path)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' AND policyname = 'Admins can view all comments'
  ) THEN
    CREATE POLICY "Admins can view all comments"
    ON public.comments
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'::user_role
    ));
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_comments_module_id ON public.comments (module_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments (created_at DESC);

-- Add email to profiles to support admin reporting
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    'student',
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to populate profiles on new user signup (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Backfill emails for existing profiles where missing
UPDATE public.profiles p
SET email = u.email,
    updated_at = now()
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.email IS NULL OR p.email = '');