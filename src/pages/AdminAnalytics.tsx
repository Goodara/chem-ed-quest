import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Users, 
  BarChart3, 
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Student {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface QuizAttempt {
  user_id: string;
  quiz_id: string;
  score: number;
  attempt_date: string;
  quizzes?: {
    modules?: {
      title: string;
    };
  };
}

interface StudentProgress {
  student_id: string;
  student_name: string;
  student_email: string;
  total_modules: number;
  completed_modules: number;
  progress_percentage: number;
  average_score: number;
  total_attempts: number;
  last_activity: string;
}

interface ModuleStats {
  module_id: string;
  module_title: string;
  total_completions: number;
  average_score: number;
  total_attempts: number;
}

export const AdminAnalytics = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [attemptsData, setAttemptsData] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (profile && profile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    if (profile?.role === 'admin') {
      fetchAnalyticsData();
    }
  }, [profile, navigate]);

  // Add real-time updates
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    // Set up real-time subscriptions for data updates
    const progressChannel = supabase
      .channel('progress-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, () => {
        fetchAnalyticsData();
      })
      .subscribe();

    const attemptsChannel = supabase
      .channel('attempts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_attempts' }, () => {
        fetchAnalyticsData();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchAnalyticsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(attemptsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [profile]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch all students
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('user_id, name, email, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      // Fetch modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title');

      // Fetch quizzes (for mapping quiz_id -> module_id)
      const { data: quizzesMapData } = await supabase
        .from('quizzes')
        .select('id, module_id');

      // Fetch all progress
      const { data: progressData } = await supabase
        .from('progress')
        .select(`
          user_id,
          module_id,
          completed,
          updated_at
        `);

      // Fetch all quiz attempts with detailed info
      const { data: attemptsDataRaw } = await supabase
        .from('quiz_attempts')
        .select(`
          user_id,
          quiz_id,
          score,
          attempt_date,
          quizzes!inner(module_id, modules!inner(title))
        `);

      setAttemptsData(attemptsDataRaw || []);

      // Transform students data to match interface
      const transformedStudents: Student[] = (studentsData || []).map(s => ({
        id: s.user_id,
        name: s.name,
        email: s.email,
        created_at: s.created_at
      }));

      setStudents(transformedStudents);

      // Process student progress
      const studentsMap = new Map(transformedStudents.map(s => [s.id, s]));
      const progressMap = new Map();
      
      // Group progress by user
      (progressData || []).forEach(p => {
        if (!progressMap.has(p.user_id)) {
          progressMap.set(p.user_id, []);
        }
        progressMap.get(p.user_id).push(p);
      });

      // Group attempts by user
      const attemptsMap = new Map();
      (attemptsDataRaw || []).forEach(a => {
        if (!attemptsMap.has(a.user_id)) {
          attemptsMap.set(a.user_id, []);
        }
        attemptsMap.get(a.user_id).push(a);
      });

      const processedProgress: StudentProgress[] = transformedStudents.map(student => {
        const userProgress = progressMap.get(student.id) || [];
        const userAttempts = attemptsMap.get(student.id) || [];
        
        const completedModules = userProgress.filter(p => p.completed).length;
        const totalModules = modulesData?.length || 0;
        const averageScore = userAttempts.length > 0 
          ? userAttempts.reduce((sum, a) => sum + a.score, 0) / userAttempts.length 
          : 0;
        
        const lastActivity = userProgress.length > 0 
          ? Math.max(...userProgress.map(p => new Date(p.updated_at).getTime()))
          : new Date(student.created_at).getTime();

        return {
          student_id: student.id,
          student_name: student.name,
          student_email: student.email,
          total_modules: totalModules,
          completed_modules: completedModules,
          progress_percentage: totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
          average_score: averageScore,
          total_attempts: userAttempts.length,
          last_activity: new Date(lastActivity).toISOString()
        };
      });

      setStudentProgress(processedProgress);

      // Process module stats
      const moduleStatsMap = new Map();
      (modulesData || []).forEach(module => {
        moduleStatsMap.set(module.id, {
          module_id: module.id,
          module_title: module.title,
          total_completions: 0,
          total_attempts: 0,
          scores: []
        });
      });

      (progressData || []).forEach(p => {
        if (p.completed && moduleStatsMap.has(p.module_id)) {
          moduleStatsMap.get(p.module_id).total_completions++;
        }
      });

      const quizToModule = new Map((quizzesMapData || []).map((q: any) => [q.id, q.module_id]));

      (attemptsDataRaw || []).forEach(a => {
        const modId = quizToModule.get(a.quiz_id);
        if (modId && moduleStatsMap.has(modId)) {
          const stat = moduleStatsMap.get(modId);
          stat.total_attempts++;
          stat.scores.push(a.score);
        }
      });

      const processedModuleStats: ModuleStats[] = Array.from(moduleStatsMap.values()).map(stat => ({
        module_id: stat.module_id,
        module_title: stat.module_title,
        total_completions: stat.total_completions,
        average_score: stat.scores.length > 0 
          ? stat.scores.reduce((sum, s) => sum + s, 0) / stat.scores.length 
          : 0,
        total_attempts: stat.total_attempts
      }));

      setModuleStats(processedModuleStats);

    } catch (error) {
      console.error('Error fetching analytics:', error);
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const totalStudents = students.length;
  const studentsMap = new Map(students.map(s => [s.id, s]));
  const activeStudents = studentProgress.filter(s => {
    const lastActivity = new Date(s.last_activity);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastActivity > oneWeekAgo;
  }).length;
  const averageProgress = studentProgress.length > 0 
    ? studentProgress.reduce((sum, s) => sum + s.progress_percentage, 0) / studentProgress.length 
    : 0;
  const totalAttempts = studentProgress.reduce((sum, s) => sum + s.total_attempts, 0);

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6 max-w-7xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor student performance and engagement</p>
        </div>
        <Link to="/dashboard">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
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
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStudents}</div>
              <p className="text-xs text-muted-foreground">Active this week</p>
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
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageProgress.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Course completion</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAttempts}</div>
              <p className="text-xs text-muted-foreground">Quiz submissions</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">Student Performance</TabsTrigger>
            <TabsTrigger value="modules">Module Analytics</TabsTrigger>
            <TabsTrigger value="attempts">Quiz Attempts</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Individual Student Performance</CardTitle>
                <CardDescription>Detailed breakdown of each student's progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentProgress.map((student, index) => (
                    <motion.div
                      key={student.student_id}
                      className="p-4 border rounded-lg hover:shadow-sm transition-all duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{student.student_name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {student.student_email}
                            </Badge>
                          </div>
                           <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                             <span className="flex items-center">
                               <BookOpen className="h-3 w-3 mr-1" />
                               {student.completed_modules}/{student.total_modules} modules
                             </span>
                             <span className="flex items-center">
                               <Award className="h-3 w-3 mr-1" />
                               {student.average_score.toFixed(1)}% avg score
                             </span>
                             <span className="flex items-center">
                               <BarChart3 className="h-3 w-3 mr-1" />
                               {student.total_attempts} attempts
                             </span>
                             <span className="flex items-center">
                               <Clock className="h-3 w-3 mr-1" />
                               Last: {new Date(student.last_activity).toLocaleDateString()}
                             </span>
                           </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {student.progress_percentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Progress
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Performance</CardTitle>
                <CardDescription>Analytics for each learning module</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moduleStats.map((module, index) => (
                    <motion.div
                      key={module.module_id}
                      className="p-4 border rounded-lg hover:shadow-sm transition-all duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{module.module_title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {module.total_completions} completions
                            </span>
                            <span className="flex items-center">
                              <Award className="h-3 w-3 mr-1" />
                              {module.average_score.toFixed(1)}% avg score
                            </span>
                            <span className="flex items-center">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              {module.total_attempts} quiz attempts
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              module.average_score >= 80 ? "default" : 
                              module.average_score >= 60 ? "secondary" : 
                              "destructive"
                            }
                          >
                            {module.average_score.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attempts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quiz Attempts</CardTitle>
                <CardDescription>All quiz submissions with student and module information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attemptsData && attemptsData.length > 0 ? (
                    attemptsData
                      .sort((a, b) => new Date(b.attempt_date).getTime() - new Date(a.attempt_date).getTime())
                      .map((attempt, index) => {
                        const student = studentsMap.get(attempt.user_id);
                        const moduleTitle = attempt.quizzes?.modules?.title || 'Unknown Module';
                        
                        return (
                          <motion.div
                            key={`${attempt.user_id}-${attempt.quiz_id}-${attempt.attempt_date}`}
                            className="p-4 border rounded-lg hover:shadow-sm transition-all duration-200"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-3">
                                  <h4 className="font-medium">{student?.name || 'Unknown Student'}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {student?.email || 'No email'}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {moduleTitle}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(attempt.attempt_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold">
                                  {attempt.score.toFixed(1)}%
                                </div>
                                <Badge 
                                  variant={attempt.score >= 80 ? "default" : attempt.score >= 60 ? "secondary" : "destructive"}
                                  className="text-xs"
                                >
                                  {attempt.score >= 80 ? "Excellent" : attempt.score >= 60 ? "Good" : "Needs Improvement"}
                                </Badge>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No quiz attempts yet</h3>
                      <p className="text-muted-foreground">
                        Students haven't taken any quizzes yet.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AdminAnalytics;