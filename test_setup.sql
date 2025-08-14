-- Simple test to verify database setup
-- Run this in your Supabase SQL Editor

-- 1. Check if tables exist
SELECT '=== TABLE EXISTENCE CHECK ===' as step;
SELECT 
    schemaname,
    tablename,
    CASE WHEN tablename IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'units', 'rent_history');

-- 2. Check properties table structure
SELECT '=== PROPERTIES TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if user_id column exists
SELECT '=== USER_ID COLUMN CHECK ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- 4. Check RLS status
SELECT '=== RLS STATUS ===' as step;
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'properties';

-- 5. Check RLS policies
SELECT '=== RLS POLICIES ===' as step;
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'properties';

-- 6. Test basic insert (this will fail if not authenticated, which is expected)
SELECT '=== TESTING INSERT ===' as step;
DO $$
BEGIN
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
        gen_random_uuid(), -- Use a random UUID for testing
        'TEST PROPERTY',
        '123 Test Street',
        'Test City',
        'TS',
        '12345',
        'Test',
        'TEST001'
    );
    RAISE NOTICE '✅ Test insert successful - table structure is correct';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
END $$;

-- 7. Show current data count
SELECT '=== CURRENT DATA COUNT ===' as step;
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
