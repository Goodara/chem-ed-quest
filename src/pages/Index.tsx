import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, Users, Trophy, ArrowRight, CheckCircle, BarChart3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
const Index = () => {
  const {
    user,
    profile
  } = useAuth();
  const features = [{
    icon: BookOpen,
    title: "Interactive Modules",
    description: "Learn Transport Phenomena through bite-sized, engaging content with visual aids and real-world examples."
  }, {
    icon: Target,
    title: "Adaptive Quizzes",
    description: "Test your understanding with multiple choice, numerical, and short answer questions with instant feedback."
  }, {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your learning journey with detailed analytics and personalized recommendations."
  }, {
    icon: Trophy,
    title: "Achievement System",
    description: "Earn badges and track your mastery of key concepts in momentum, heat, and mass transfer."
  }];
  const benefits = ["Master complex engineering concepts through microlearning", "Get instant feedback on your understanding", "Track your progress with detailed analytics", "Access content anywhere, anytime", "Learn at your own pace with adaptive content"];
  if (user) {
    return <div className="space-y-16">
        {/* Welcome Back Section */}
        <section className="container mx-auto px-6 py-12 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Welcome Back, {profile?.name || user.email}!
            </h1>
            <p className="text-xl text-muted-foreground">
              Continue your Transport Phenomena journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  View Dashboard
                </Button>
              </Link>
              <Link to="/modules">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Modules
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>;
  }
  return <div className="space-y-16">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Master Transport Phenomena
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Interactive microlearning platform designed for Chemical Engineering students
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <BookOpen className="h-5 w-5 mr-2" />
              Learn More
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground pt-8">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-accent" />
              <span>Instant Feedback</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-secondary" />
              <span>Expert Content</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span>Track Progress</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Why Choose TransportEd?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Modern learning tools designed specifically for Transport Phenomena education
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
          const Icon = feature.icon;
          return <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur">
                <CardHeader className="space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>;
        })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Learn Transport Phenomena 
              <span className="text-primary"> Your Way</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform adapts to your learning style, providing personalized content 
              and feedback to help you master complex engineering concepts efficiently.
            </p>
            
            <ul className="space-y-3">
              {benefits.map((benefit, index) => <li key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                  <span>{benefit}</span>
                </li>)}
            </ul>
            
            <Link to="/auth">
              <Button size="lg">
                Start Learning Today
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>

          <Card className="p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-0 shadow-2xl">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Course Coverage</h3>
                <p className="text-muted-foreground">Complete Transport Phenomena curriculum</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="font-medium">Momentum Transfer</span>
                  <Badge variant="secondary">8 Modules</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="font-medium">Heat Transfer</span>
                  <Badge variant="secondary">5 Modules</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="font-medium">Mass Transfer</span>
                  <Badge variant="secondary">10 Modules</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <Card className="text-center p-12 bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 border-0">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-muted-foreground">Join students already mastering Transport Phenomena with TransportEd</p>
            <Link to="/auth">
              <Button size="lg">
                Create Free Account
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              No credit card required • Instant access • Mobile friendly
            </p>
          </div>
        </Card>
      </section>
    </div>;
};
export default Index;