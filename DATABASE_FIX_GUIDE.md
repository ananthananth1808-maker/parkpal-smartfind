# Database Error Resolution Guide

## Issues Fixed

### 1. **Schema Type Mismatch (CRITICAL)**
- **Problem**: `parking_lot_id` was defined as TEXT in first migration, UUID in second
- **Fix**: Consolidated migration now correctly defines it as UUID with foreign key reference

### 2. **Missing `customer_name` Field (CRITICAL)**
- **Problem**: Database has `customer_name` field but TypeScript types didn't include it
- **Fix**: Updated `src/integrations/supabase/types.ts` to include `customer_name: string | null`

### 3. **Incorrect `user_id` Constraint**
- **Problem**: First migration required `user_id NOT NULL`, but schema allows nullable for anonymous bookings
- **Fix**: Changed to `user_id UUID REFERENCES auth.users(id)` (nullable by default)

### 4. **RLS Policy Name Conflicts**
- **Problem**: Policies named "Public Read Access" existed in multiple migrations causing conflicts
- **Fix**: Renamed policies with unique identifiers: `parking_lots_public_view`, `parking_slots_public_view`, etc.

### 5. **Fragmented Migrations**
- **Problem**: Schema distributed across 3 different migration files with conflicting definitions
- **Fix**: Created consolidated migration `20260129000000_consolidated_schema.sql` with complete, idempotent schema

## How to Apply Fixes

### Option 1: Fresh Database (Recommended)
If you haven't deployed to production yet, reset your Supabase database:

1. In Supabase Dashboard → Project Settings → Danger Zone
2. Click "Reset Database"
3. Run the new consolidated migration
4. The app will automatically apply the correct schema

### Option 2: Apply Migration Without Reset
If you have existing data:

1. In Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20260129000000_consolidated_schema.sql`
3. Execute it
4. The script uses `IF NOT EXISTS` and `ON CONFLICT` clauses to handle existing data

### Option 3: Via CLI (if you have supabase CLI installed)
```bash
supabase db push
```

## Verification

After applying the migration, verify:

1. ✅ All tables exist with correct schemas
2. ✅ Type definitions in `src/integrations/supabase/types.ts` match database
3. ✅ RLS policies are enabled and named uniquely
4. ✅ Test booking creation with `customer_name` field

## Files Changed

- ✅ `src/integrations/supabase/types.ts` - Updated bookings type definition
- ✅ `supabase/migrations/20260129000000_consolidated_schema.sql` - New consolidated migration
- ℹ️ Previous migrations (20260121... and 20260126...) kept for reference only

## What the Old Migrations Did

- `20260121132903_dfed14a8-74a9-4e5a-9841-11210498f6f7.sql` - Initial schema (now superseded)
- `20260126000000_create_parking_tables.sql` - Added parking tables (now superseded)
- `full_database_setup.sql` - Reference schema (now consolidated)

The new consolidated migration is idempotent and will correctly initialize your database schema.
