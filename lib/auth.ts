import { supabase } from './supabase';

// Simple password-based authentication
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || 'kairy123';
const MASTER_USER_EMAIL = 'markbtesh@gmail.com';

// Use a fixed master user ID - you'll need to create this user in Supabase
// Run this SQL in your Supabase SQL Editor to get/create the user ID:
// SELECT id FROM auth.users WHERE email = 'markbtesh@gmail.com';
// If no user exists, create one manually in Authentication > Users
const MASTER_USER_ID = 'b26ad0b2-e683-4382-84e0-411d7d7ca9a4'; // Real user ID from Supabase

export const signIn = async (password: string) => {
  if (password === APP_PASSWORD) {
    try {
      // Store authentication state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', MASTER_USER_ID);
      
      return { 
        data: { 
          user: { 
            id: MASTER_USER_ID, 
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

// Function to clear authentication and force re-login
export const clearAuth = () => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userId');
};

// Keep the signUp function for compatibility but make it a no-op
export const signUp = async (email: string, password: string) => {
  return { data: null, error: { message: 'Sign up is not available' } };
};