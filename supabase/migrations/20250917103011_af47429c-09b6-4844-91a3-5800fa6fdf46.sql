-- Enable realtime for analytics and comments functionality
ALTER TABLE public.progress REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_attempts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;