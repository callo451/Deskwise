import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as DeskwiseUser } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userDetails, setUserDetails] = useState<DeskwiseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  // Make fetchUserDetails a memoized callback to avoid recreation on each render
  const fetchUserDetails = useCallback(async (userId: string) => {
    console.log('AuthContext: fetchUserDetails called for userId:', userId);
    try {
      setAuthError(null);
      console.log('AuthContext: fetchUserDetails - Attempting to fetch user from Supabase (original query)...');
      const { data, error } = await supabase
        .from('users')
        .select('*') // Restore selecting all columns
        .eq('id', userId)
        .single(); // Restore using single()
      console.log('AuthContext: fetchUserDetails - Supabase query finished.', { data, error });

      if (error) {
        console.error('Error fetching user details:', error);
        setAuthError(error);
        setUserDetails(null);
        console.log('AuthContext: fetchUserDetails - Error branch');
      } else if (data) { // Check if data exists from single()
        setUserDetails(data); // Use the data directly
        console.log('AuthContext: fetchUserDetails - Success branch (using single()), user details set:', data);
      } else {
        // Handle case where no user found (or profile mismatch) with simple query
        console.error('AuthContext: fetchUserDetails - Error: User not found with single()');
        setAuthError(new Error('User profile not found'));
        setUserDetails(null);
        console.log('AuthContext: fetchUserDetails - User not found branch');
      }
    } catch (error) {
      console.error('AuthContext: fetchUserDetails - Caught error during fetch:', error);
      setAuthError(error instanceof Error ? error : new Error('Unknown error'));
      setUserDetails(null);
      console.log('AuthContext: fetchUserDetails - Catch block');
    } finally {
      // Still keep isLoading separate for now
      console.log('AuthContext: fetchUserDetails - Finally block reached');
    }
  }, [supabase]); // Ensure supabase client is a dependency

  useEffect(() => {
    // Get initial session with better error handling
    const initializeAuth = async () => {
      console.log('AuthContext: initializeAuth started');
      try {
        setAuthError(null);
        const { data, error } = await supabase.auth.getSession();
        console.log('AuthContext: initializeAuth - getSession result:', { data, error });

        if (!error && data.session) {
          console.log('AuthContext: initializeAuth - Session retrieved:', data.session);
          setUser(data.session.user);
          console.log('AuthContext: initializeAuth - Session found, fetching user details.');
          fetchUserDetails(data.session.user.id);
        }
        // Always set loading to false after attempting to get session, even if no session
        console.log('AuthContext: initializeAuth - Setting isLoading false after session check.');
        setIsLoading(false);
      } catch (error) {
        console.error('AuthContext: initializeAuth - Error getting session:', error);
        setUser(null);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('AuthContext: onAuthStateChange triggered, event:', _event, 'session:', session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('AuthContext: onAuthStateChange - Session found, fetching user details.');
          fetchUserDetails(session.user.id);
        } else {
          console.log('AuthContext: onAuthStateChange - No session, clearing userDetails');
          setUserDetails(null);
          // Ensure isLoading is false if there's no user to fetch details for
          setIsLoading(false);
          console.log('AuthContext: onAuthStateChange - No session, isLoading set to false');
        }
        // Note: fetchUserDetails handles setting isLoading to false in its finally block
        // We only set it here if there's no session/user.
      }
    );

    return () => {
      console.log('AuthContext: Cleaning up auth listener.');
      subscription?.unsubscribe();
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
