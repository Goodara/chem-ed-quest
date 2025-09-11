import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Home, BarChart3, User, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
export const Layout: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  const navigation = [{
    name: 'Home',
    href: '/',
    icon: Home
  }, {
    name: 'Modules',
    href: '/modules',
    icon: BookOpen
  }, {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3
  }];
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };
  if (!user) {
    return <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">TransportEd</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </header>
        
        <main className="flex-1">
          {children}
        </main>
        
        <footer className="border-t bg-background">
          <div className="container flex h-16 items-center justify-center text-sm text-muted-foreground">© 2025 TransportEd. All rights reserved.</div>
        </footer>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">TransportEd</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map(item => {
              const Icon = item.icon;
              return <Link key={item.name} to={item.href} className={cn("flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", isActivePath(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>;
            })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span>{profile?.name || user.email}</span>
                {profile?.role === 'admin' && <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs font-medium">
                    Admin
                  </span>}
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && <div className="md:hidden border-t bg-background">
            <div className="container py-4 space-y-2">
              {navigation.map(item => {
            const Icon = item.icon;
            return <Link key={item.name} to={item.href} className={cn("flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full", isActivePath(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")} onClick={() => setIsMobileMenuOpen(false)}>
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>;
          })}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center space-x-2 px-3 py-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{profile?.name || user.email}</span>
                  {profile?.role === 'admin' && <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs font-medium">
                      Admin
                    </span>}
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start px-3">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>}
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t bg-background">
        <div className="container flex h-16 items-center justify-center text-sm text-muted-foreground">© 2025
 TransportEd. All rights reserved.</div>
      </footer>
    </div>;
};