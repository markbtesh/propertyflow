import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          user_id: string;
          property_name: string;
          full_address: string;
          city: string;
          state: string;
          zip: string;
          property_type: string;
          square_footage: number | null;
          acquisition_price: number | null;
          acquisition_date: string | null;
          notes: string | null;
          street_view_image_url: string | null;
          external_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_name: string;
          full_address: string;
          city: string;
          state: string;
          zip: string;
          property_type: string;
          square_footage?: number | null;
          acquisition_price?: number | null;
          acquisition_date?: string | null;
          notes?: string | null;
          street_view_image_url?: string | null;
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_name?: string;
          full_address?: string;
          city?: string;
          state?: string;
          zip?: string;
          property_type?: string;
          square_footage?: number | null;
          acquisition_price?: number | null;
          acquisition_date?: string | null;
          notes?: string | null;
          street_view_image_url?: string | null;
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      units: {
        Row: {
          id: string;
          property_id: string;
          unit_name: string;
          rent_price: number | null;
          tenant_name: string | null;
          unit_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          unit_name: string;
          rent_price?: number | null;
          tenant_name?: string | null;
          unit_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          unit_name?: string;
          rent_price?: number | null;
          tenant_name?: string | null;
          unit_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rent_history: {
        Row: {
          id: string;
          unit_id: string;
          transaction_date: string;
          amount: number;
          transaction_type: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          transaction_date: string;
          amount: number;
          transaction_type: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          transaction_date?: string;
          amount?: number;
          transaction_type?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
};