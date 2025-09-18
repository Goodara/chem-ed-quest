import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  pdf_url?: string;
  video_link?: string;
}

interface Quiz {
  id?: string;
  question: string;
  type: 'mcq' | 'numeric' | 'short';
  options: string[];
  correct_answer: string;
  explanation?: string;
}

export const CreateModule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [module, setModule] = useState({
    title: '',
    content: '',
    category: 'Heat Transfer',
    image_url: '',
    pdf_url: '',
    video_link: ''
  });
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const isEditing = !!id;

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    if (isEditing) {
      fetchModule();
    }
  }, [id, profile]);

  const fetchModule = async () => {
    try {
      // Fetch module
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();

      if (moduleError) throw moduleError;

      setModule({
        title: moduleData.title,
        content: moduleData.content,
        category: moduleData.category || 'Heat Transfer',
        image_url: moduleData.image_url || '',
        pdf_url: moduleData.pdf_url || '',
        video_link: moduleData.video_link || ''
      });

      // Fetch quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', id)
        .order('created_at');

      if (quizzesError) throw quizzesError;

      // Process the quiz data to ensure options is properly parsed
      const processedQuizzes = (quizzesData || []).map(quiz => ({
        ...quiz,
        options: Array.isArray(quiz.options) ? quiz.options : JSON.parse(quiz.options as string || '["","","",""]')
      }));
      setQuizzes(processedQuizzes);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load module data"
      });
      navigate('/modules');
    } finally {
      setLoading(false);
    }
  };

  const addQuiz = () => {
    setQuizzes([...quizzes, {
      question: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: ''
    }]);
  };

  const removeQuiz = (index: number) => {
    setQuizzes(quizzes.filter((_, i) => i !== index));
  };

  const updateQuiz = (index: number, field: string, value: any) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[index] = { ...updatedQuizzes[index], [field]: value };
    setQuizzes(updatedQuizzes);
  };

  const updateQuizOption = (quizIndex: number, optionIndex: number, value: string) => {
    const updatedQuizzes = [...quizzes];
    const newOptions = [...updatedQuizzes[quizIndex].options];
    newOptions[optionIndex] = value;
    updatedQuizzes[quizIndex].options = newOptions;
    setQuizzes(updatedQuizzes);
  };

  const saveModule = async () => {
    if (!module.title.trim() || !module.content.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and content are required"
      });
      return;
    }

    setSaving(true);
    try {
      let moduleId = id;

      // Save module
      if (isEditing) {
        const { error } = await supabase
          .from('modules')
          .update({
            title: module.title,
            content: module.content,
            category: module.category,
            image_url: module.image_url || null,
            pdf_url: module.pdf_url || null,
            video_link: module.video_link || null
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('modules')
          .insert([{
            title: module.title,
            content: module.content,
            category: module.category,
            image_url: module.image_url || null,
            pdf_url: module.pdf_url || null,
            video_link: module.video_link || null
          }])
          .select()
          .single();

        if (error) throw error;
        moduleId = data.id;
      }

      // Save quizzes
      if (quizzes.length > 0) {
        // Delete existing quizzes if editing
        if (isEditing) {
          await supabase
            .from('quizzes')
            .delete()
            .eq('module_id', moduleId);
        }

        // Insert new quizzes
        const validQuizzes = quizzes.filter(q => 
          q.question.trim() && 
          q.options.some(o => o.trim()) &&
          q.correct_answer.trim()
        );

        if (validQuizzes.length > 0) {
          const { error } = await supabase
            .from('quizzes')
            .insert(validQuizzes.map(quiz => ({
              module_id: moduleId,
              question: quiz.question,
              type: quiz.type as 'mcq' | 'numeric' | 'short',
              options: JSON.stringify(quiz.options.filter(o => o.trim())) as any,
              correct_answer: quiz.correct_answer,
              explanation: quiz.explanation || null
            })));

          if (error) throw error;
        }
      }

      toast({
        title: isEditing ? "Module Updated!" : "Module Created!",
        description: "Your changes have been saved successfully."
      });

      navigate('/modules');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save module"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6 max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Module' : 'Create New Module'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update module content and quizzes' : 'Create engaging learning content'}
          </p>
        </div>
        <Link to="/modules">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
        </Link>
      </div>

      {/* Module Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Module Information</CardTitle>
            <CardDescription>Basic module details and content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">Module Title</Label>
                <Input
                  id="title"
                  value={module.title}
                  onChange={(e) => setModule({...module, title: e.target.value})}
                  placeholder="Enter module title..."
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={module.category} onValueChange={(value) => setModule({...module, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Momentum Transfer">Momentum Transfer</SelectItem>
                    <SelectItem value="Heat Transfer">Heat Transfer</SelectItem>
                    <SelectItem value="Mass Transfer">Mass Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="content">Module Content</Label>
              <Textarea
                id="content"
                value={module.content}
                onChange={(e) => setModule({...module, content: e.target.value})}
                placeholder="Enter the main learning content for this module..."
                rows={8}
              />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="image_url">Image URL (Optional)</Label>
                <Input
                  id="image_url"
                  value={module.image_url}
                  onChange={(e) => setModule({...module, image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="pdf_url">PDF URL (Optional)</Label>
                <Input
                  id="pdf_url"
                  value={module.pdf_url}
                  onChange={(e) => setModule({...module, pdf_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="video_link">Video URL (Optional)</Label>
                <Input
                  id="video_link"
                  value={module.video_link}
                  onChange={(e) => setModule({...module, video_link: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiz Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quiz Questions</CardTitle>
                <CardDescription>Add quiz questions to test knowledge</CardDescription>
              </div>
              <Button onClick={addQuiz} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={index}
                className="p-4 border rounded-lg space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeQuiz(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label>Question</Label>
                  <Textarea
                    value={quiz.question}
                    onChange={(e) => updateQuiz(index, 'question', e.target.value)}
                    placeholder="Enter your question..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  {quiz.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) => updateQuizOption(index, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}...`}
                      />
                      <Button
                        variant={quiz.correct_answer === option ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateQuiz(index, 'correct_answer', option)}
                        disabled={!option.trim()}
                      >
                        Correct
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={quiz.explanation}
                    onChange={(e) => updateQuiz(index, 'explanation', e.target.value)}
                    placeholder="Explain why this is the correct answer..."
                    rows={2}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Button 
          onClick={saveModule} 
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <motion.div
                className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Module' : 'Create Module'}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CreateModule;