import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  PlayCircle,
  FileText,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  pdf_url?: string;
  video_link?: string;
  created_at: string;
}

interface Quiz {
  id: string;
  question: string;
  type: string;
  options?: any;
  correct_answer: string;
}

export const ModuleContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [module, setModule] = useState<Module | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completingModule, setCompletingModule] = useState(false);

  useEffect(() => {
    if (id) {
      fetchModuleData();
      fetchProgress();
    }
  }, [id]);

  const fetchModuleData = async () => {
    try {
      // Fetch module
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();

      if (moduleError) throw moduleError;

      // Fetch quizzes for this module
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', id)
        .order('created_at');

      if (quizzesError) throw quizzesError;

      setModule(moduleData);
      setQuizzes(quizzesData || []);
    } catch (error: any) {
      console.error('Error fetching module:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load module content"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const markAsComplete = async () => {
    if (!user || !id) return;
    
    setCompletingModule(true);
    try {
      const { error } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          module_id: id,
          completed: true
        });

      if (error) throw error;
      
      setProgress({ ...progress, completed: true });
      toast({
        title: "Module Completed! 🎉",
        description: "Great job! You've completed this module."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update progress"
      });
    } finally {
      setCompletingModule(false);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => (
      <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
        {paragraph}
      </p>
    ));
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
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </motion.div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Module not found</h3>
            <p className="text-muted-foreground mb-4">
              The requested module could not be found.
            </p>
            <Link to="/modules">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Modules
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = progress?.completed || false;

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6 max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/modules">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
        </Link>
        
        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <Badge variant="default" className="animate-bounce">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          )}
        </div>
      </div>

      {/* Module Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{module.title}</CardTitle>
            <CardDescription>
              Created on {new Date(module.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Resources */}
      {(module.image_url || module.pdf_url || module.video_link) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resources</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {module.image_url && (
                <motion.div 
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => window.open(module.image_url, '_blank')}
                >
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">View Image</span>
                </motion.div>
              )}
              
              {module.pdf_url && (
                <motion.div 
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => window.open(module.pdf_url, '_blank')}
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Download PDF</span>
                </motion.div>
              )}
              
              {module.video_link && (
                <motion.div 
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => window.open(module.video_link, '_blank')}
                >
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Watch Video</span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Module Content</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            {renderContent(module.content)}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiz Section */}
      {quizzes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Knowledge Check</CardTitle>
              <CardDescription>
                Test your understanding with {quizzes.length} question{quizzes.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={`/quiz/${module.id}`}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full">
                    Start Quiz
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Completion Section */}
      {!isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complete Module</CardTitle>
              <CardDescription>
                Mark this module as complete when you've finished studying
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  className="w-full" 
                  onClick={markAsComplete}
                  disabled={completingModule}
                >
                  {completingModule ? (
                    <>
                      <motion.div
                        className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ModuleContent;