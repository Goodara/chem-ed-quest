import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight,
  Check,
  X,
  Award,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  question: string;
  type: 'mcq' | 'numeric' | 'short';
  options?: any;
  correct_answer: string;
  explanation?: string;
}

interface QuizAttempt {
  quiz_id: string;
  user_answer: string;
  is_correct: boolean;
}

export const Quiz = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (moduleId) {
      fetchQuizzes();
    }
  }, [moduleId]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at');

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "No Quiz Available",
          description: "This module doesn't have any quiz questions yet."
        });
        navigate(`/modules/${moduleId}`);
        return;
      }

      // Process the quiz data to ensure options is properly parsed
      const processedQuizzes = data.map(quiz => ({
        ...quiz,
        options: Array.isArray(quiz.options) ? quiz.options : JSON.parse(quiz.options as string || '[]')
      }));
      setQuizzes(processedQuizzes);
    } catch (error: any) {
      console.error('Error fetching quizzes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load quiz questions"
      });
      navigate(`/modules/${moduleId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQuiz = quizzes[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuiz.id]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizzes.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowFeedback(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowFeedback(false);
    }
  };

  const showAnswerFeedback = () => {
    setShowFeedback(true);
  };

  const submitQuiz = async () => {
    if (!user || !moduleId) return;

    setSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      const attempts: QuizAttempt[] = [];

      quizzes.forEach(quiz => {
        const userAnswer = answers[quiz.id];
        const isCorrect = userAnswer === quiz.correct_answer;
        if (isCorrect) correctAnswers++;
        
        attempts.push({
          quiz_id: quiz.id,
          user_answer: userAnswer || '',
          is_correct: isCorrect
        });
      });

      const finalScore = Math.round((correctAnswers / quizzes.length) * 100);

      // Save to database
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: moduleId, // Using module_id as quiz_id for grouping
          score: finalScore,
          answers: attempts as any
        });

      if (error) throw error;

      setScore(finalScore);
      setQuizCompleted(true);

      toast({
        title: "Quiz Submitted! 🎯",
        description: `You scored ${finalScore}% - ${finalScore >= 80 ? 'Excellent!' : finalScore >= 60 ? 'Good job!' : 'Keep practicing!'}`
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit quiz"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const restartQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowFeedback(false);
    setQuizCompleted(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
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

  if (quizCompleted) {
    return (
      <motion.div 
        className="container mx-auto p-6 space-y-6 max-w-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Award className={`h-16 w-16 mb-4 ${score >= 80 ? 'text-accent' : score >= 60 ? 'text-secondary' : 'text-muted-foreground'}`} />
            </motion.div>
            
            <motion.h2 
              className="text-2xl font-bold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Quiz Complete!
            </motion.h2>
            
            <motion.div 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {score}%
            </motion.div>
            
            <motion.p 
              className="text-muted-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              You got {quizzes.filter(q => answers[q.id] === q.correct_answer).length} out of {quizzes.length} questions correct
            </motion.p>
            
            <motion.div 
              className="flex space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Button onClick={restartQuiz} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Link to={`/modules/${moduleId}`}>
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Module
                </Button>
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const currentQuiz = quizzes[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizzes.length) * 100;
  const selectedAnswer = answers[currentQuiz?.id];
  const isCorrect = selectedAnswer === currentQuiz?.correct_answer;

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6 max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to={`/modules/${moduleId}`}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Module
          </Button>
        </Link>
        
        <Badge variant="outline">
          Question {currentQuestionIndex + 1} of {quizzes.length}
        </Badge>
      </div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuiz?.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuiz?.options?.map((option: string, index: number) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    variant={selectedAnswer === option ? "default" : "outline"}
                    className={`w-full justify-start text-left h-auto p-4 ${
                      showFeedback && selectedAnswer === option
                        ? isCorrect
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-destructive bg-destructive/10 text-destructive'
                        : ''
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showFeedback}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option}</span>
                      {showFeedback && selectedAnswer === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isCorrect ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <X className="h-5 w-5" />
                          )}
                        </motion.div>
                      )}
                      {showFeedback && option === currentQuiz.correct_answer && selectedAnswer !== option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="text-accent"
                        >
                          <Check className="h-5 w-5" />
                        </motion.div>
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Explanation */}
      {showFeedback && currentQuiz?.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{currentQuiz.explanation}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-3">
          {!showFeedback && selectedAnswer && (
            <Button onClick={showAnswerFeedback}>
              Check Answer
            </Button>
          )}

          {showFeedback && (
            <>
              {currentQuestionIndex < quizzes.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={submitQuiz}
                  disabled={submitting}
                  className="bg-accent hover:bg-accent/90"
                >
                  {submitting ? (
                    <>
                      <motion.div
                        className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Quiz
                      <Award className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Quiz;