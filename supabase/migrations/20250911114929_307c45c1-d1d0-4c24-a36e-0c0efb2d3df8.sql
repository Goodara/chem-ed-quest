-- Fix the handle_new_user function to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    'student'
  );
  RETURN NEW;
END;
$$;

-- Also create the specific user requested
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ojirikag@gmail.com',
  crypt('thankujesus', gen_salt('bf')),
  now(),
  '{"name": "Goodness Ojirika"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;