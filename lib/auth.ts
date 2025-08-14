import { supabase } from './supabase';

// Simple password-based authentication
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || 'kairy123';
const MASTER_USER_EMAIL = 'markbtesh@gmail.com';
const MASTER_USER_PASSWORD = 'master123456';

// Get the master user ID from the database or use a default
let MASTER_USER_ID: string | null = null;

const getMasterUserId = async (): Promise<string> => {
  if (MASTER_USER_ID) return MASTER_USER_ID;
  
  try {
    // Try to get the existing master user
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', MASTER_USER_EMAIL)
      .single();
    
    if (data?.id) {
      MASTER_USER_ID = data.id;
      return data.id;
    }
  } catch (error) {
    console.log('No existing master user found, will create one');
  }
  
  // If no user exists, create one
  try {
    const { data, error } = await supabase.auth.signUp({
      email: MASTER_USER_EMAIL,
      password: MASTER_USER_PASSWORD,
    });
    
    if (data.user?.id) {
      MASTER_USER_ID = data.user.id;
      return data.user.id;
    }
  } catch (error) {
    console.error('Error creating master user:', error);
  }
  
  // Fallback: use a fixed UUID (you'll need to create this user manually)
  return '00000000-0000-0000-0000-000000000001';
};

export const signIn = async (password: string) => {
  if (password === APP_PASSWORD) {
    try {
      const userId = await getMasterUserId();
      
      // Store authentication state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', userId);
      
      return { 
        data: { 
          user: { 
            id: userId, 
            email: MASTER_USER_EMAIL 
          } 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { data: null, error: { message: 'Authentication failed' } };
    }
  } else {
    return { 
      data: null, 
      error: { message: 'Invalid password. Please try again.' } 
    };
  }
};

export const signOut = async () => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userId');
  return { error: null };
};

export const getCurrentUser = async () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userId = localStorage.getItem('userId');
  
  if (isAuthenticated && userId) {
    return { 
      id: userId, 
      email: MASTER_USER_EMAIL 
    };
  }
  return null;
};

// Keep the signUp function for compatibility but make it a no-op
export const signUp = async (email: string, password: string) => {
  return { data: null, error: { message: 'Sign up is not available' } };
};