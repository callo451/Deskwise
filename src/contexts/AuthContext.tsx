import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as DeskwiseUser } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userDetails: DeskwiseUser | null;
  isLoading: boolean;
  authError: Error | null;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string, userData: Partial<DeskwiseUser>) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
  fetchUserDetails: (userId: string) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<DeskwiseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  // Make fetchUserDetails a memoized callback to avoid recreation on each render
  const fetchUserDetails = useCallback(async (userId: string) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
        setAuthError(error);
        setUserDetails(null);
      } else {
        setUserDetails(data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setAuthError(error instanceof Error ? error : new Error('Unknown error'));
      setUserDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session with better error handling
    const initializeAuth = async () => {
      try {
        setAuthError(null);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          await fetchUserDetails(data.session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error instanceof Error ? error : new Error('Unknown error'));
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserDetails(session.user.id);
        } else {
          setUserDetails(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);



  const signIn = async (email: string, password: string) => {
    const response = await supabase.auth.signInWithPassword({ email, password });
    return {
      error: response.error,
      data: response.data.session
    };
  };

  const signUp = async (
    email: string, 
    password: string, 
    userData: Partial<DeskwiseUser>
  ) => {
    const authResponse = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          tenant_id: userData.tenant_id,
        }
      }
    });

    if (authResponse.error) {
      return {
        error: authResponse.error,
        data: null
      };
    }

    if (authResponse.data.user) {
      // Create user record in the users table
      const { error } = await supabase.from('users').insert({
        id: authResponse.data.user.id,
        tenant_id: userData.tenant_id,
        email,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        role: userData.role || 'user'
      });

      if (error) {
        console.error('Error creating user record:', error);
      }
    }

    return {
      error: null,
      data: authResponse.data.session
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    session,
    user,
    userDetails,
    isLoading,
    authError,
    signIn,
    signUp,
    signOut,
    fetchUserDetails,
    clearAuthError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
