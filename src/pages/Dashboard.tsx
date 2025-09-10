import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users,
  BarChart3,
  Award,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (profile?.role === 'admin') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage content and monitor student progress</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalModules}</div>
              <p className="text-xs text-muted-foreground">Active learning modules</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizAttempts.length}</div>
              <p className="text-xs text-muted-foreground">Total student attempts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Student performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Learning actively</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your course content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/modules">
                <Button className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Modules
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Attempts</CardTitle>
              <CardDescription>Latest student submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAttempts.length > 0 ? (
                  recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Quiz Attempt</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attempt.attempt_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={attempt.score >= 80 ? "default" : attempt.score >= 60 ? "secondary" : "destructive"}>
                        {attempt.score.toFixed(1)}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No quiz attempts yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.name}!</h1>
          <p className="text-muted-foreground">Continue your Transport Phenomena journey</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedModules}/{totalModules}</div>
            <p className="text-xs text-muted-foreground">Modules completed</p>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Learning streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attempts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizAttempts.length}</div>
            <p className="text-xs text-muted-foreground">Quiz attempts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                  <Button className="w-full">
                    Start Module
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <CheckCircle className="h-12 w-12 text-accent mx-auto" />
                <h3 className="font-medium">All modules completed!</h3>
                <p className="text-sm text-muted-foreground">
                  Congratulations on finishing all available modules.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Quiz Results</CardTitle>
            <CardDescription>Your latest performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttempts.length > 0 ? (
                recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Quiz Result</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.attempt_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={attempt.score >= 80 ? "default" : attempt.score >= 60 ? "secondary" : "destructive"}>
                      {attempt.score.toFixed(1)}%
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No quiz attempts yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;