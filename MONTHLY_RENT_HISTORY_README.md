# Monthly Rent History Feature

## Overview

The PropertyFlow application now includes a comprehensive monthly rent history tracking system that allows you to manage rent payments for each unit on a month-by-month basis. This feature provides a structured way to track rent collection, payment methods, and maintain historical records.

## Features

### Monthly Rent History Structure
Each unit now has a monthly rent history that includes:
- **Month**: January through December (1-12)
- **Year**: Calendar year for the rent period
- **Rent Date**: The actual date when rent was received
- **Amount**: The rent amount collected
- **Method**: Payment method used (Bank Transfer, Check, Cash, etc.)
- **Notes**: Optional notes about the payment

### Key Benefits
1. **12-Month Grid View**: Visual representation of all months in a year
2. **Payment Tracking**: Track when and how rent was collected
3. **Historical Records**: Maintain complete payment history
4. **CSV Import/Export**: Bulk import rent history data
5. **Year Navigation**: Switch between different years
6. **Payment Status**: Clear indicators for paid vs unpaid months

## Database Schema

### New Table: `monthly_rent_history`
```sql
CREATE TABLE monthly_rent_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    rent_date DATE,
    amount DECIMAL(10,2),
    method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(unit_id, year, month)
);
```

### Key Constraints
- One record per unit per month per year (UNIQUE constraint)
- Month must be between 1-12
- Cascading delete when unit is removed

## Setup Instructions

### 1. Update Database Schema
Run the SQL script in your Supabase SQL Editor:
```sql
-- Run the contents of update_rent_history_schema.sql
```

### 2. Deploy Application Changes
The following files have been updated:
- `supabase_schema.sql` - Updated with new table structure
- `lib/api.ts` - New API functions for monthly rent history
- `lib/csv.ts` - Enhanced CSV processing for rent history
- `components/properties/MonthlyRentHistory.tsx` - New component
- `app/dashboard/properties/[id]/page.tsx` - Updated with tabs and rent history

### 3. Verify Installation
1. Navigate to any property with units
2. Click on the "Rent History" tab
3. You should see a 12-month grid for each unit

## Usage

### Adding Rent History Manually
1. Navigate to a property detail page
2. Click the "Rent History" tab
3. For each unit, click "Add" on any month
4. Fill in the details:
   - **Rent Date**: When the payment was received
   - **Amount**: The rent amount
   - **Method**: How the payment was made
   - **Notes**: Any additional information
5. Click "Save"

### Editing Existing Records
1. Click "Edit" on any month with existing data
2. Modify the fields as needed
3. Click "Save" to update

### Deleting Records
1. Click the trash icon next to any existing record
2. Confirm the deletion

### Year Navigation
1. Use the year dropdown in the top-right of each unit's rent history
2. Switch between different years to view historical data
3. Years are limited to the last 5 years for performance

## CSV Import/Export

### CSV Format for Rent History
Your CSV can now include rent history columns:
```csv
Property Id,Address,Unit,Year,Month,Rent Date,Rent Amount,Payment Method,Rent Notes
405-mother-gaston-blvd,405 Mother Gaston Blvd,store,2024,1,2024-01-01,3934,Bank Transfer,On time payment
405-mother-gaston-blvd,405 Mother Gaston Blvd,2F,2024,1,2024-01-01,3560,Check,On time payment
```

### Required Columns for Rent History
- `Year`: The year of the rent payment (e.g., 2024)
- `Month`: The month number (1-12)
- `Rent Date`: Date when rent was received (YYYY-MM-DD format)
- `Rent Amount`: The amount collected
- `Payment Method`: How the payment was made
- `Rent Notes`: Optional notes about the payment

### Import Process
1. Prepare your CSV with the required columns
2. Go to Dashboard → Import
3. Upload your CSV file
4. The system will automatically create properties, units, and monthly rent history records
5. Check the import results for any errors
6. Navigate to the property detail page to view the imported rent history

## API Functions

### New API Functions Added
```typescript
// Get monthly rent history for a unit
getMonthlyRentHistory(unitId: string, year?: number)

// Create a new monthly rent record
createMonthlyRentHistory(rentHistory: MonthlyRentHistoryInsert)

// Update or insert a monthly rent record
upsertMonthlyRentHistory(rentHistory: MonthlyRentHistoryInsert)

// Update an existing monthly rent record
updateMonthlyRentHistory(id: string, updates: MonthlyRentHistoryUpdate)

// Delete a monthly rent record
deleteMonthlyRentHistory(id: string)

// Get unit with its monthly rent history
getUnitWithMonthlyRentHistory(unitId: string, year?: number)
```

## UI Components

### MonthlyRentHistory Component
- **Location**: `components/properties/MonthlyRentHistory.tsx`
- **Features**:
  - 12-month grid layout
  - Year navigation
  - Inline editing
  - Payment status indicators
  - Total calculations
  - Responsive design

### Payment Methods Available
- Bank Transfer
- Check
- Cash
- Credit Card
- Debit Card
- Venmo
- PayPal
- Zelle
- Other

## Migration from Legacy Data

If you have existing rent history data in the old `rent_history` table, you can migrate it using the SQL script provided in `update_rent_history_schema.sql`. Uncomment the migration section to automatically convert existing data to the new format.

## Troubleshooting

### Common Issues
1. **"No units found" message**: Make sure the property has units assigned
2. **Year not showing**: Check that the year is within the last 5 years
3. **Save not working**: Verify all required fields are filled
4. **CSV import errors**: Check column names and data formats

### Performance Considerations
- Large datasets are paginated
- Year filtering reduces data load
- Indexes are created for optimal query performance

## Future Enhancements

Potential improvements for future versions:
1. Bulk operations (add/edit multiple months)
2. Rent payment reminders
3. Late payment tracking
4. Payment method analytics
5. Export to accounting software
6. Automated rent collection tracking

## Support

For issues or questions about the monthly rent history feature:
1. Check the console for error messages
2. Verify database schema is properly updated
3. Ensure all required dependencies are installed
4. Review the CSV format if importing data

