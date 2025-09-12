-- Make the current user an admin for testing
UPDATE profiles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT id FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1
);