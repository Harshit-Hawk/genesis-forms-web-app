'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const DEFAULT_ORGANIZERS: Record<string, { password: string; name: string; role: string }> = {
  'harshitgujjar73@gmail.com': { password: 'admin123', name: 'Harshit Gujjar', role: 'Organizer' },
  'organizer@event.com': { password: 'admin123', name: 'Lead Organizer', role: 'Organizer' }
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('harshitgujjar73@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signin') {
        // 1. Try unified backend API Route /api/auth/login
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password })
          });
          const data = await res.json();
          if (res.ok && data.user) {
            onLogin(data.user);
            return;
          }
        } catch {
          // Fall through
        }

        // 2. Try Supabase Auth if available
        let supabaseUser: User | null = null;
        let supabaseError: string | null = null;

        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password
            });
            if (!error && data?.user) {
              supabaseUser = {
                email: data.user.email || cleanEmail,
                id: data.user.id,
                role: 'Organizer'
              };
            } else if (error) {
              supabaseError = error.message;
            }
          } catch (err: unknown) {
            supabaseError = err instanceof Error ? err.message : 'Supabase error';
          }
        }

        if (supabaseUser) {
          onLogin(supabaseUser);
          return;
        }

        // 3. Check local accounts and preconfigured organizer credentials
        const storedUsers = storage.get<Record<string, { password: string; role?: string }>>('gf_local_users', {});
        const allUsers = { ...DEFAULT_ORGANIZERS, ...storedUsers };
        const matched = allUsers[cleanEmail];

        if (matched) {
          if (matched.password === password) {
            onLogin({
              email: cleanEmail,
              id: 'org_' + cleanEmail.replace(/[^a-z0-9]/g, '_'),
              role: matched.role || 'Organizer'
            });
            return;
          } else {
            setErrorMsg('Invalid password for this account. Please try again.');
            return;
          }
        }

        if (supabaseError) {
          setErrorMsg(supabaseError);
          return;
        }

        setErrorMsg('Account not found. Please create an account or continue as Guest.');

      } else {
        // Sign Up Mode
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          return;
        }

        // 1. Try unified backend API Route /api/auth/signup
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password })
          });
          const data = await res.json();
          if (res.ok && data.user) {
            onLogin(data.user);
            return;
          }
        } catch {
          // Fall through
        }

        // 2. Save local credentials so user can log in without verification blockage
        const storedUsers = storage.get<Record<string, { password: string; role?: string }>>('gf_local_users', {});
        storedUsers[cleanEmail] = { password, role: 'Organizer' };
        storage.set('gf_local_users', storedUsers);

        // 3. Attempt Supabase signup
        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email: cleanEmail,
              password
            });
            if (!error && data?.session?.user) {
              onLogin({
                email: cleanEmail,
                id: data.session.user.id,
                role: 'Organizer'
              });
              return;
            }
          } catch {
            // Ignore
          }
        }

        onLogin({
          email: cleanEmail,
          id: 'user_' + Date.now(),
          role: 'Organizer'
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    if (!supabase) {
      setErrorMsg('Supabase client not initialized.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google OAuth error');
    }
  };

  const handleGuestAccess = () => {
    onLogin({
      email: 'guest@event.desk',
      id: 'guest',
      role: 'Guest'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: 'var(--bg-page)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '28px 24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--accent)',
            color: '#ffffff',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            margin: '0 auto 12px'
          }}>
            G
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Genesis Forms
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Event registration desk and analytics portal
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '18px'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '7px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: authMode === 'signin' ? 'var(--bg-surface)' : 'transparent',
              color: authMode === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: authMode === 'signin' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '7px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: authMode === 'signup' ? 'var(--bg-surface)' : 'transparent',
              color: authMode === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: authMode === 'signup' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div style={{
            padding: '9px 12px',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '9px 12px',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            border: '1px solid var(--success)',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Organizer Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="organizer@event.com"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <Mail size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 34px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <Lock size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '9px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-dim)'
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={16} />
            {loading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0', color: 'var(--text-dim)', fontSize: '11px' }}>
          <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
          <span>OR</span>
          <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          style={{
            width: '100%',
            padding: '9px',
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Continue as Guest */}
        <button
          type="button"
          onClick={handleGuestAccess}
          style={{
            width: '100%',
            padding: '9px',
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

