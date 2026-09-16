'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LogOut, User as UserIcon, Shield, Loader2, Home, Newspaper } from 'lucide-react';
import { LoginFormSchema, RegisterFormSchema } from '@/types/schema';

export function Navbar() {
  const { user, login, register, logout, isLoggingIn, isRegistering, isLoggingOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (authMode === 'login') {
        const validated = LoginFormSchema.safeParse({ email, password });
        if (!validated.success) {
          setError(validated.error.issues[0].message);
          return;
        }
        await login({ email, password });
      } else {
        const validated = RegisterFormSchema.safeParse({ email, name, password });
        if (!validated.success) {
          setError(validated.error.issues[0].message);
          return;
        }
        await register({ email, name, password });
      }
      setIsAuthModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setError(null);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-border/40 bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-6 transition-colors duration-300">
        <div className="flex items-center gap-8">
          <a href="#" className="text-xl font-bold tracking-tight text-primary hover:opacity-80 transition-opacity">
            ONPKG <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1 font-normal">NEXT</span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="#hero" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Home className="w-4 h-4" /> Home
            </a>
            <a href="#posts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Newspaper className="w-4 h-4" /> Feed
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  {user.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-red-500" />}
                  {user.name || 'User'}
                </span>
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="flex items-center gap-2"
              >
                {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => openAuth('register')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal overlay */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground border border-border w-full max-w-md p-8 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => { setIsAuthModalOpen(false); resetForm(); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl font-semibold w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-2">
              {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {authMode === 'login' 
                ? 'Sign in to access database seeding, posts, and server actions.' 
                : 'Sign up to create your profile and share posts in the feed.'
              }
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium">
                  {error}
                </div>
              )}

              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Aswin Dev"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 font-semibold text-base mt-2" disabled={isLoggingIn || isRegistering}>
                {isLoggingIn || isRegistering ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => openAuth('register')} 
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => openAuth('login')} 
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
