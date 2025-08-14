-- Complete schema fix script
-- Run this in your Supabase SQL Editor to fix any missing columns and policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (WARNING: This will delete all data)
-- Uncomment the next 3 lines if you want to start fresh
-- DROP TABLE IF EXISTS rent_history CASCADE;
-- DROP TABLE IF EXISTS units CASCADE;
-- DROP TABLE IF EXISTS properties CASCADE;

-- Create properties table with all required columns
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_name TEXT NOT NULL,
    full_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    property_type TEXT NOT NULL,
    square_footage INTEGER,
    acquisition_price DECIMAL(12,2),
    acquisition_date DATE,
    notes TEXT,
    street_view_image_url TEXT,
    external_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create units table
CREATE TABLE IF NOT EXISTS units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    unit_name TEXT NOT NULL,
    rent_price DECIMAL(10,2),
    tenant_name TEXT,
    unit_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create rent_history table
CREATE TABLE IF NOT EXISTS rent_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    rent_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add user_id to properties if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE properties ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to properties';
    END IF;
    
    -- Add external_id to properties if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'external_id'
    ) THEN
        ALTER TABLE properties ADD COLUMN external_id TEXT;
        RAISE NOTICE 'Added external_id column to properties';
    END IF;
    
    -- Add street_view_image_url to properties if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'street_view_image_url'
    ) THEN
        ALTER TABLE properties ADD COLUMN street_view_image_url TEXT;
        RAISE NOTICE 'Added street_view_image_url column to properties';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_external_id ON properties(external_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_history_unit_id ON rent_history(unit_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_units_updated_at ON units;
CREATE TRIGGER update_units_updated_at 
    BEFORE UPDATE ON units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;

DROP POLICY IF EXISTS "Users can view units of their properties" ON units;
DROP POLICY IF EXISTS "Users can insert units for their properties" ON units;
DROP POLICY IF EXISTS "Users can update units of their properties" ON units;
DROP POLICY IF EXISTS "Users can delete units of their properties" ON units;

DROP POLICY IF EXISTS "Users can view rent history of their units" ON rent_history;
DROP POLICY IF EXISTS "Users can insert rent history for their units" ON rent_history;
DROP POLICY IF EXISTS "Users can update rent history of their units" ON rent_history;
DROP POLICY IF EXISTS "Users can delete rent history of their units" ON rent_history;

-- Create new policies
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view units of their properties" ON units
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = units.property_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert units for their properties" ON units
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = units.property_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update units of their properties" ON units
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = units.property_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete units of their properties" ON units
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = units.property_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view rent history of their units" ON rent_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM units 
            JOIN properties ON units.property_id = properties.id 
            WHERE units.id = rent_history.unit_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert rent history for their units" ON rent_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM units 
            JOIN properties ON units.property_id = properties.id 
            WHERE units.id = rent_history.unit_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update rent history of their units" ON rent_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM units 
            JOIN properties ON units.property_id = properties.id 
            WHERE units.id = rent_history.unit_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete rent history of their units" ON rent_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM units 
            JOIN properties ON units.property_id = properties.id 
            WHERE units.id = rent_history.unit_id 
            AND properties.user_id = auth.uid()
        )
    );

-- Create dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    p.user_id,
    COUNT(DISTINCT p.id) as total_properties,
    COUNT(u.id) as total_units,
    COUNT(CASE WHEN u.tenant_name IS NOT NULL AND u.tenant_name != '' THEN 1 END) as occupied_units,
    COALESCE(SUM(u.rent_price), 0) as total_monthly_rent
FROM properties p
LEFT JOIN units u ON p.id = u.property_id
GROUP BY p.user_id;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON dashboard_stats TO authenticated;

-- Show final schema
SELECT 'Properties table schema:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Units table schema:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'units' 
AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;
