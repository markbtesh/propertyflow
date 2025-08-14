-- PropertyFlow Database Schema
-- This script creates all necessary tables, indexes, triggers, and RLS policies
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Properties table
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

-- Units table
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

-- Rent history table (for future use)
CREATE TABLE IF NOT EXISTS rent_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    rent_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_external_id ON properties(external_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_history_unit_id ON rent_history(unit_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at 
    BEFORE UPDATE ON units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties table
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for units table
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

-- RLS Policies for rent_history table
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

-- Create a view for dashboard stats (optional)
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

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON dashboard_stats TO authenticated;

-- Insert some sample data (optional - remove if not needed)
-- INSERT INTO properties (user_id, property_name, full_address, city, state, zip, property_type, external_id)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000001', 'Sample Property', '123 Main St', 'Brooklyn', 'NY', '11201', 'Multi-family', 'SAMPLE001');

-- INSERT INTO units (property_id, unit_name, rent_price, tenant_name, unit_notes)
-- VALUES 
--     ((SELECT id FROM properties WHERE external_id = 'SAMPLE001'), 'Unit 1A', 1800.00, 'John Doe', '2BR/1BA apartment');

COMMIT;
