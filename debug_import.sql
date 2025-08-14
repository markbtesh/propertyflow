-- Debug script to check database state
-- Run this in your Supabase SQL Editor

-- Check if tables exist
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('properties', 'units', 'rent_history');

-- Check properties table schema
SELECT 'Properties table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if user_id column exists and has proper foreign key
SELECT 'user_id column check:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN constraint_name LIKE '%fkey%' THEN 'Has Foreign Key'
        ELSE 'No Foreign Key'
    END as fk_status
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name 
    AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE c.table_name = 'properties' 
AND c.column_name = 'user_id'
AND c.table_schema = 'public';

-- Check RLS policies
SELECT 'RLS Policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'units', 'rent_history');

-- Check if RLS is enabled
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'units', 'rent_history');

-- Check indexes
SELECT 'Indexes:' as info;
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'units', 'rent_history');

-- Test insert permissions (this will help identify auth issues)
-- Note: This will only work if you're authenticated
SELECT 'Testing permissions...' as info;

-- Try to insert a test property (this will fail if not authenticated, which is expected)
DO $$
BEGIN
    -- This will fail if not authenticated, which helps us identify the issue
    INSERT INTO properties (
        user_id, 
        property_name, 
        full_address, 
        city, 
        state, 
        zip, 
        property_type,
        external_id
    ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'TEST PROPERTY',
        '123 Test St',
        'Test City',
        'TS',
        '12345',
        'Test',
        'TEST001'
    );
    RAISE NOTICE 'Test insert successful - authentication working';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;

-- Show any existing data
SELECT 'Existing data count:' as info;
SELECT 
    'properties' as table_name,
    COUNT(*) as row_count
FROM properties
UNION ALL
SELECT 
    'units' as table_name,
    COUNT(*) as row_count
FROM units
UNION ALL
SELECT 
    'rent_history' as table_name,
    COUNT(*) as row_count
FROM rent_history;
