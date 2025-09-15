import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Calendar,
  BookOpen,
  Mail
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  module_id: string;
  user_name: string;
  user_email: string;
  module_title: string;
}

export const StudentComments = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (profile && profile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    if (profile?.role === 'admin') {
      fetchComments();
    }
  }, [profile, navigate]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          module_id,
          profiles!inner(name, email),
          modules!inner(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedComments: Comment[] = (data || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_id: comment.user_id,
        module_id: comment.module_id,
        user_name: (comment.profiles as any)?.name || 'Unknown User',
        user_email: (comment.profiles as any)?.email || 'No email',
        module_title: (comment.modules as any)?.title || 'Unknown Module'
      }));

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <motion.div 
          className="animate-pulse space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6 max-w-6xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Comments</h1>
          <p className="text-muted-foreground">
            Monitor feedback and discussions from students
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{comments.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Comments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {comments.filter(c => 
                  new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(comments.map(c => c.user_id)).size}
              </div>
              <p className="text-xs text-muted-foreground">Participating</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Student Comments</CardTitle>
            <CardDescription>
              Comments and feedback from students on learning modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No comments yet</h3>
                <p className="text-muted-foreground">
                  Students haven't started commenting on modules yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    className="p-4 border rounded-lg hover:shadow-sm transition-all duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="space-y-3">
                      {/* Header with student info and module */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{comment.user_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {comment.user_email}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs">
                              {comment.module_title}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(comment.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Comment content */}
                      <div className="pl-6 border-l-2 border-muted">
                        <p className="text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StudentComments;