import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock,
  PlayCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Module {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  pdf_url?: string;
  video_link?: string;
  created_at: string;
}

interface Progress {
  module_id: string;
  completed: boolean;
}

export const Modules = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModule, setDeleteModule] = useState<Module | null>(null);

  useEffect(() => {
    fetchModules();
    fetchProgress();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load modules"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('module_id, completed');

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModule) return;

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', deleteModule.id);

      if (error) throw error;

      setModules(modules.filter(m => m.id !== deleteModule.id));
      setDeleteModule(null);
      
      toast({
        title: "Module Deleted",
        description: "Module has been successfully deleted."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message
      });
    }
  };

  const isCompleted = (moduleId: string) => {
    return progress.some(p => p.module_id === moduleId && p.completed);
  };

  const getModuleResources = (module: Module) => {
    const resources = [];
    if (module.image_url) resources.push({ type: 'image', icon: ImageIcon });
    if (module.pdf_url) resources.push({ type: 'pdf', icon: FileText });
    if (module.video_link) resources.push({ type: 'video', icon: PlayCircle });
    return resources;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Learning Modules</h1>
          <p className="text-muted-foreground">
            Explore Transport Phenomena concepts through structured learning
          </p>
        </div>
        
        {profile?.role === 'admin' && (
          <Link to="/admin/modules/new">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Module
              </Button>
            </motion.div>
          </Link>
        )}
      </motion.div>

      {modules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No modules available</h3>
              <p className="text-muted-foreground mb-4">
                {profile?.role === 'admin' 
                  ? "Create your first module to get started" 
                  : "Check back later for new content"}
              </p>
              {profile?.role === 'admin' && (
                <Link to="/admin/modules/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Module
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {['Momentum Transfer', 'Heat Transfer', 'Mass Transfer'].map((category) => {
            const categoryModules = modules.filter(module => module.category === category);
            
            if (categoryModules.length === 0) return null;
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-primary mb-2">{category}</h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
                </div>
                
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryModules.map((module, index) => {
            const completed = isCompleted(module.id);
            const resources = getModuleResources(module);

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="group hover:shadow-xl transition-all duration-500 cursor-pointer border-2 hover:border-primary/20">
                  <CardHeader className="space-y-3 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-base sm:text-lg leading-tight group-hover:text-primary transition-colors">
                          {module.title}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Added {new Date(module.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center space-x-2 shrink-0">
                        {completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Badge variant="default" className="shrink-0 animate-pulse">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          </motion.div>
                        )}
                        
                        {!completed && (
                          <Badge variant="secondary" className="shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    {resources.length > 0 && (
                      <div className="flex items-center space-x-3 pt-2">
                        <span className="text-xs text-muted-foreground">Resources:</span>
                        <div className="flex items-center space-x-2">
                          {resources.map((resource, idx) => {
                            const Icon = resource.icon;
                            return (
                              <motion.div 
                                key={idx} 
                                className="flex items-center"
                                whileHover={{ scale: 1.2 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <Icon className="h-3 w-3 text-primary" />
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                      {module.content.substring(0, 120)}...
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Link to={`/modules/${module.id}`} className="flex-1">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className="w-full group-hover:shadow-lg transition-all duration-300 text-xs sm:text-sm">
                            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            {completed ? 'Review' : 'Start Module'}
                          </Button>
                        </motion.div>
                      </Link>
                      
                      {profile?.role === 'admin' && (
                        <div className="flex space-x-2">
                          <Link to={`/admin/modules/${module.id}/edit`}>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="outline" size="icon" className="hover:bg-primary/10 h-8 w-8 sm:h-10 sm:w-10">
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </motion.div>
                          </Link>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="hover:bg-destructive/10 h-8 w-8 sm:h-10 sm:w-10"
                              onClick={() => setDeleteModule(module)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteModule} onOpenChange={() => setDeleteModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteModule?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Modules;