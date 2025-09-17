import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  User, 
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
}

interface CommentsSectionProps {
  moduleId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ moduleId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [moduleId]);

  // Add real-time updates for comments
  useEffect(() => {
    const channel = supabase
      .channel('comments-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `module_id=eq.${moduleId}` }, 
        () => { fetchComments(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [moduleId]);

  const fetchComments = async () => {
    try {
      // 1) Fetch comments for this module
      const { data: commentRows, error: commentsError } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const rows = commentRows || [];
      const userIds = Array.from(new Set(rows.map((c) => c.user_id)));

      // 2) Fetch profiles for those users (no FK relation available)
      let profilesByUser: Record<string, { name?: string }> = {};
      if (userIds.length > 0) {
        const { data: profileRows, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);
        if (profilesError) throw profilesError;
        profilesByUser = (profileRows || []).reduce((acc: any, p: any) => {
          acc[p.user_id] = { name: p.name };
          return acc;
        }, {});
      }

      const processedComments: Comment[] = rows.map((row: any) => ({
        id: row.id,
        content: row.content,
        created_at: row.created_at,
        user_id: row.user_id,
        user_name: profilesByUser[row.user_id]?.name || 'Anonymous',
      }));

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments(); // Refresh comments
      
      toast({
        title: "Comment Posted! 💬",
        description: "Your comment has been shared with the community."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post comment"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Discussion</span>
          </CardTitle>
          <CardDescription>
            Share your thoughts and questions about this module
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Comment Form */}
          {user && (
            <div className="space-y-3">
              <Textarea
                placeholder="Share your thoughts, questions, or feedback about this module..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-end">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    className="flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Post Comment</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    className="p-4 border rounded-lg hover:shadow-sm transition-all duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{comment.user_name}</span>
                          </div>
                          {comment.user_id === user?.id && (
                            <Badge variant="secondary" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed pl-6 border-l-2 border-muted">
                        {comment.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CommentsSection;