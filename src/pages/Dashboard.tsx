import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users,
  BarChart3,
  Award,
  Target,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Module {
  id: string;
  title: string;
  created_at: string;
}

interface Progress {
  module_id: string;
  completed: boolean;
}

interface QuizAttempt {
  id: string;
  score: number;
  attempt_date: string;
  quiz_id: string;
}

export const Dashboard = () => {
  const { profile } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title, created_at')
        .order('created_at', { ascending: true });

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('progress')
        .select('module_id, completed');

      // Fetch quiz attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('id, score, attempt_date, quiz_id')
        .order('attempt_date', { ascending: false })
        .limit(10);

      setModules(modulesData || []);
      setProgress(progressData || []);
      setQuizAttempts(attemptsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedModules = progress.filter(p => p.completed).length;
  const totalModules = modules.length;
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  
  const averageScore = quizAttempts.length > 0 
    ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
    : 0;

  const recentAttempts = quizAttempts.slice(0, 5);
  
  const getNextModule = () => {
    const completedModuleIds = progress.filter(p => p.completed).map(p => p.module_id);
    return modules.find(module => !completedModuleIds.includes(module.id));
  };

  const nextModule = getNextModule();

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <motion.div 
                key={i} 
                className="h-32 bg-muted rounded"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (profile?.role === 'admin') {
    const chartData = recentAttempts.slice(0, 5).reverse().map((attempt, index) => ({
      name: `#${index + 1}`,
      score: attempt.score,
      date: new Date(attempt.attempt_date).toLocaleDateString()
    }));

    return (
      <motion.div 
        className="container mx-auto p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage content and monitor student progress</p>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  {totalModules}
                </motion.div>
                <p className="text-xs text-muted-foreground">Active learning modules</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {quizAttempts.length}
                </motion.div>
                <p className="text-xs text-muted-foreground">Total student attempts</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  {averageScore.toFixed(1)}%
                </motion.div>
                <p className="text-xs text-muted-foreground">Student performance</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  -
                </motion.div>
                <p className="text-xs text-muted-foreground">Learning actively</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your course content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link to="/modules">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage Modules
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/admin/analytics">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </motion.div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Quiz Attempts</CardTitle>
                <CardDescription>Latest student submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAttempts.length > 0 ? (
                    recentAttempts.map((attempt, index) => (
                      <motion.div 
                        key={attempt.id} 
                        className="flex items-center justify-between p-3 border rounded hover:shadow-sm transition-all duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Quiz Attempt</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(attempt.attempt_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={attempt.score >= 80 ? "default" : attempt.score >= 60 ? "secondary" : "destructive"}>
                          {attempt.score.toFixed(1)}%
                        </Badge>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No quiz attempts yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Student Dashboard
  const chartData = recentAttempts.slice(0, 5).reverse().map((attempt, index) => ({
    name: `#${index + 1}`,
    score: attempt.score,
    date: new Date(attempt.attempt_date).toLocaleDateString()
  }));

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.name}!</h1>
          <p className="text-muted-foreground">Continue your Transport Phenomena journey</p>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <Link to="/modules">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  {completedModules}/{totalModules}
                </motion.div>
                <p className="text-xs text-muted-foreground mb-2">Modules completed</p>
                <Progress value={progressPercentage} className="w-full" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
        >
          <Link to="/quiz-results">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quiz Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {averageScore.toFixed(1)}%
                </motion.div>
                <p className="text-xs text-muted-foreground">Average performance</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
              >
                <TrendingUp className="h-4 w-4 text-accent" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div 
                className="text-2xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {completedModules > 0 ? completedModules : '-'}
              </motion.div>
              <p className="text-xs text-muted-foreground">Learning streak</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <Link to="/quiz-results">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attempts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {quizAttempts.length}
                </motion.div>
                <p className="text-xs text-muted-foreground">Quiz attempts</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextModule ? (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{nextModule.title}</h3>
                      <p className="text-sm text-muted-foreground">Next module</p>
                    </div>
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <Link to={`/modules/${nextModule.id}`}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full">
                        Start Module
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              ) : (
                <motion.div 
                  className="text-center p-6 space-y-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1] 
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity 
                    }}
                  >
                    <CheckCircle className="h-12 w-12 text-accent mx-auto" />
                  </motion.div>
                  <h3 className="font-medium">All modules completed!</h3>
                  <p className="text-sm text-muted-foreground">
                    Congratulations on finishing all available modules.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Quiz Results</CardTitle>
                <CardDescription>Your latest performance</CardDescription>
              </div>
              <Link to="/quiz-results">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAttempts.length > 0 && chartData.length > 1 && (
                <div className="h-32 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="space-y-3">
                {recentAttempts.length > 0 ? (
                  recentAttempts.slice(0, 3).map((attempt, index) => (
                    <motion.div 
                      key={attempt.id} 
                      className="flex items-center justify-between p-3 border rounded hover:shadow-sm transition-all duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Quiz Result</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attempt.attempt_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={attempt.score >= 80 ? "default" : attempt.score >= 60 ? "secondary" : "destructive"}>
                        {attempt.score.toFixed(1)}%
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No quiz attempts yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;