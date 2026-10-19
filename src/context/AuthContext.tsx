import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '@/types/database';
import { StorageDB } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<{ success: boolean; error?: string }>;
  isCloudConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    async function initSession() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser({
                id: profile.id,
                email: session.user.email || profile.email,
                full_name: profile.full_name,
                role: profile.role,
                timezone: profile.timezone || 'Asia/Kolkata',
                theme_preference: profile.theme_preference || 'light',
                created_at: profile.created_at,
                updated_at: profile.updated_at,
              });
              setLoading(false);
              return;
            }
          }
        }

        // Local persistent session restore
        const localUser = StorageDB.getCurrentUser();
        if (localUser) {
          setUser(localUser);
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  const login = async (email: string, passwordHash: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: passwordHash,
        });

        if (error) return { success: false, error: error.message };

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: profile?.full_name || 'Teacher',
            role: profile?.role || 'teacher',
            timezone: profile?.timezone || 'Asia/Kolkata',
            theme_preference: profile?.theme_preference || 'light',
            created_at: data.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUser(u);
          StorageDB.setCurrentUser(u);
          return { success: true };
        }
      }

      // Local persistent authentication
      const users = StorageDB.getUsers();
      const matched = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === passwordHash
      );

      if (!matched) {
        return { success: false, error: 'Invalid email address or password.' };
      }

      const u: UserProfile = {
        id: matched.id,
        email: matched.email,
        full_name: matched.full_name,
        role: matched.role,
        timezone: matched.timezone,
        theme_preference: matched.theme_preference,
        created_at: matched.created_at,
        updated_at: matched.updated_at,
      };

      setUser(u);
      StorageDB.setCurrentUser(u);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during sign in.' };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    passwordHash: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Role is ALWAYS 'teacher' upon public registration for strict privacy and role security
      const defaultRole: UserRole = 'teacher';

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: passwordHash,
          options: {
            data: {
              full_name: fullName,
              role: defaultRole,
            },
          },
        });

        if (error) return { success: false, error: error.message };

        if (data.user) {
          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: fullName,
            role: defaultRole,
            timezone: 'Asia/Kolkata',
            theme_preference: 'light',
            created_at: data.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Also upsert profile row
          await supabase.from('profiles').upsert([u]);
          setUser(u);
          StorageDB.setCurrentUser(u);
          return { success: true };
        }
      }

      // Local persistent registration
      const users = StorageDB.getUsers();
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: 'An account with this email already exists.' };
      }

      const newUser: UserProfile & { passwordHash: string } = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        email,
        full_name: fullName,
        role: defaultRole,
        timezone: 'Asia/Kolkata',
        theme_preference: 'light',
        passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      StorageDB.saveUser(newUser);

      const u: UserProfile = {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        timezone: newUser.timezone,
        theme_preference: newUser.theme_preference,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
      };

      setUser(u);
      StorageDB.setCurrentUser(u);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during account creation.' };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      setUser(null);
      StorageDB.setCurrentUser(null);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }

    setUser(updated);
    StorageDB.setCurrentUser(updated);

    // Update in local users list
    const users = StorageDB.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updated };
      localStorage.setItem('campusflow_users', JSON.stringify(users));
    }
  };

  const resetPasswordRequest = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    // Local flow feedback
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        resetPasswordRequest,
        isCloudConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
