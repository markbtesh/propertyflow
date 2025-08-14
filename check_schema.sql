-- Diagnostic script to check current schema and fix issues
-- Run this in your Supabase SQL Editor

-- First, let's see what columns exist in the properties table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if user_id column exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'user_id'
    AND table_schema = 'public'
) as user_id_exists;

-- If user_id doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE properties ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to properties table';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- Check if external_id column exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'external_id'
    AND table_schema = 'public'
) as external_id_exists;

-- If external_id doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'external_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE properties ADD COLUMN external_id TEXT;
        RAISE NOTICE 'Added external_id column to properties table';
    ELSE
        RAISE NOTICE 'external_id column already exists';
    END IF;
END $$;

-- Check if street_view_image_url column exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'street_view_image_url'
    AND table_schema = 'public'
) as street_view_image_url_exists;

-- If street_view_image_url doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'street_view_image_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE properties ADD COLUMN street_view_image_url TEXT;
        RAISE NOTICE 'Added street_view_image_url column to properties table';
    ELSE
        RAISE NOTICE 'street_view_image_url column already exists';
    END IF;
END $$;

-- Show final schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
ORDER BY ordinal_position;
