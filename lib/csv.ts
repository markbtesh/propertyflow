import Papa from 'papaparse';

export interface CSVProperty {
  // Property fields
  property_name?: string;
  full_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  property_type?: string;
  square_footage?: string;
  acquisition_price?: string;
  acquisition_date?: string;
  notes?: string;
  external_id?: string;
  image_url?: string;
  
  // Unit fields
  unit_name?: string;
  rent_price?: string;
  tenant_name?: string;
  unit_notes?: string;
  
  // Monthly Rent History fields
  'Year'?: string;
  'Month'?: string;
  'Rent Date'?: string;
  'Rent Amount'?: string;
  'Payment Method'?: string;
  'Rent Notes'?: string;
  
  // User's specific format fields
  property_id?: string;
  address?: string;
  unit?: string;
  bed?: string;
  bath?: string;
  sq_ft?: string;
  primary_tenant_name?: string;
  primary_tenant_phone?: string;
  primary_tenant_email?: string;
  market_rent?: string;
  rent?: string;
  deposit?: string;
  move_in?: string;
  lease_start?: string;
  lease_expires?: string;
  tenancy_notes?: string;
  
  // Exact column names from user's CSV (with spaces)
  'Property Id'?: string;
  'Address'?: string;
  'Unit'?: string;
  'Bed'?: string;
  'Bath'?: string;
  'Sq Ft'?: string;
  'Primary Tenant Name'?: string;
  'Primary Tenant Phone'?: string;
  'Primary Tenant Email'?: string;
  'Market Rent'?: string;
  'Rent'?: string;
  'Deposit'?: string;
  'Move-In'?: string;
  'Lease Start'?: string;
  'Lease Expires'?: string;
  'Unit Notes'?: string;
  'Tenancy Notes'?: string;
}

// New interface specifically for properties and units export (no rent history)
export interface CSVPropertyUnit {
  property_name?: string;
  full_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  property_type?: string;
  square_footage?: string;
  acquisition_price?: string;
  acquisition_date?: string;
  notes?: string;
  external_id?: string;
  image_url?: string;
  unit_name?: string;
  rent_price?: string;
  tenant_name?: string;
  unit_notes?: string;
}

// New interface specifically for rent history export
export interface CSVRentHistory {
  property_name?: string;
  full_address?: string;
  unit_name?: string;
  'Year'?: string;
  'Month'?: string;
  'Rent Date'?: string;
  'Rent Amount'?: string;
  'Payment Method'?: string;
  'Rent Notes'?: string;
}

export const generateCSVTemplate = (): string => {
  const template: CSVProperty[] = [
    {
      property_id: '405-mother-gaston-blvd',
      address: '405 Mother Gaston Blvd',
      unit: 'store',
      bed: '2',
      bath: '2',
      sq_ft: '1000',
      primary_tenant_name: '',
      primary_tenant_phone: '',
      primary_tenant_email: '',
      market_rent: '3934',
      rent: '3934',
      deposit: '',
      move_in: '',
      lease_start: '',
      lease_expires: '',
      unit_notes: 'Commercial space',
      tenancy_notes: '',
      'Year': '2024',
      'Month': '1',
      'Rent Date': '2024-01-01',
      'Rent Amount': '3934',
      'Payment Method': 'Bank Transfer',
      'Rent Notes': 'On time payment'
    },
    {
      property_id: '405-mother-gaston-blvd',
      address: '405 Mother Gaston Blvd',
      unit: '2F',
      bed: '2',
      bath: '2',
      sq_ft: '1000',
      primary_tenant_name: '',
      primary_tenant_phone: '',
      primary_tenant_email: '',
      market_rent: '3560',
      rent: '3560',
      deposit: '',
      move_in: '',
      lease_start: '',
      lease_expires: '',
      unit_notes: '2nd floor apartment',
      tenancy_notes: '',
      'Year': '2024',
      'Month': '1',
      'Rent Date': '2024-01-01',
      'Rent Amount': '3560',
      'Payment Method': 'Check',
      'Rent Notes': 'On time payment'
    },
    {
      property_id: '642-flatbush-ave',
      address: '642 Flatbush Ave',
      unit: 'Store',
      bed: '0',
      bath: '0',
      sq_ft: '',
      primary_tenant_name: '',
      primary_tenant_phone: '',
      primary_tenant_email: '',
      market_rent: '5715',
      rent: '5715',
      deposit: '',
      move_in: '',
      lease_start: '',
      lease_expires: '',
      unit_notes: 'Ground floor commercial',
      tenancy_notes: '',
      'Year': '2024',
      'Month': '1',
      'Rent Date': '2024-01-01',
      'Rent Amount': '5715',
      'Payment Method': 'Cash',
      'Rent Notes': 'On time payment'
    }
  ];

  return Papa.unparse(template);
};

export const parseCSV = (csvContent: string): Promise<CSVProperty[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
        } else {
          resolve(results.data as CSVProperty[]);
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

export const validateCSVData = (data: CSVProperty[]): { valid: CSVProperty[], errors: string[] } => {
  const valid: CSVProperty[] = [];
  const errors: string[] = [];

  console.log('Starting validation of', data.length, 'rows');

  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index starts at 0 and CSV has header row
    
    console.log(`Row ${rowNumber} data:`, {
      propertyId: row.property_id || row['Property Id'],
      address: row.address || row['Address'],
      propertyName: row.property_name,
      fullAddress: row.full_address
    });
    
    // Check for user's format first (handle both exact column names and normalized names)
    if ((row.property_id || row['Property Id']) && (row.address || row['Address'])) {
      // User's format - validate required fields
      const propertyId = row.property_id || row['Property Id'];
      const address = row.address || row['Address'];
      
      console.log(`Row ${rowNumber}: Found user format - Property Id: "${propertyId}", Address: "${address}"`);
      
      if (!propertyId?.trim()) {
        errors.push(`Row ${rowNumber}: Property Id is required`);
        return;
      }
      
      if (!address?.trim()) {
        errors.push(`Row ${rowNumber}: Address is required`);
        return;
      }
      
      // Validate numeric fields
      if (row.bed && isNaN(Number(row.bed))) {
        errors.push(`Row ${rowNumber}: Bed must be a number`);
        return;
      }
      
      if (row.bath && isNaN(Number(row.bath))) {
        errors.push(`Row ${rowNumber}: Bath must be a number`);
        return;
      }
      
      if (row.sq_ft && isNaN(Number(row.sq_ft))) {
        errors.push(`Row ${rowNumber}: Sq Ft must be a number`);
        return;
      }
      
      if (row.market_rent && isNaN(Number(row.market_rent.replace(/[$,]/g, '')))) {
        errors.push(`Row ${rowNumber}: Market Rent must be a number`);
        return;
      }
      
      if (row.rent && isNaN(Number(row.rent.replace(/[$,]/g, '')))) {
        errors.push(`Row ${rowNumber}: Rent must be a number`);
        return;
      }

      // Validate rent history fields if present
      if (row['Year'] && isNaN(Number(row['Year']))) {
        errors.push(`Row ${rowNumber}: Year must be a number`);
        return;
      }

      if (row['Month'] && (isNaN(Number(row['Month'])) || Number(row['Month']) < 1 || Number(row['Month']) > 12)) {
        errors.push(`Row ${rowNumber}: Month must be a number between 1 and 12`);
        return;
      }

      if (row['Rent Amount'] && isNaN(Number(row['Rent Amount'].replace(/[$,]/g, '')))) {
        errors.push(`Row ${rowNumber}: Rent Amount must be a number`);
        return;
      }

      if (row['Rent Date'] && isNaN(Date.parse(row['Rent Date']))) {
        errors.push(`Row ${rowNumber}: Rent Date must be a valid date`);
        return;
      }
      
      valid.push(row);
    } else if (row.property_name && row.full_address) {
      console.log(`Row ${rowNumber}: Found original format`);
      // Original format - validate required fields
      if (!row.property_name.trim()) {
        errors.push(`Row ${rowNumber}: Property name is required`);
        return;
      }
      
      if (!row.full_address.trim()) {
        errors.push(`Row ${rowNumber}: Full address is required`);
        return;
      }
      
      if (!row.city || !row.city.trim()) {
        errors.push(`Row ${rowNumber}: City is required`);
        return;
      }
      
      if (!row.state || !row.state.trim()) {
        errors.push(`Row ${rowNumber}: State is required`);
        return;
      }
      
      // ZIP is optional - no validation needed
      
      if (!row.property_type || !row.property_type.trim()) {
        errors.push(`Row ${rowNumber}: Property type is required`);
        return;
      }
      
      // Validate numeric fields
      if (row.square_footage && isNaN(Number(row.square_footage))) {
        errors.push(`Row ${rowNumber}: Square footage must be a number`);
        return;
      }
      
      if (row.acquisition_price && isNaN(Number(row.acquisition_price))) {
        errors.push(`Row ${rowNumber}: Acquisition price must be a number`);
        return;
      }
      
      if (row.rent_price && isNaN(Number(row.rent_price))) {
        errors.push(`Row ${rowNumber}: Rent price must be a number`);
        return;
      }
      
      // Validate date format
      if (row.acquisition_date && isNaN(Date.parse(row.acquisition_date))) {
        errors.push(`Row ${rowNumber}: Acquisition date must be a valid date`);
        return;
      }

      // Validate rent history fields if present
      if (row['Year'] && isNaN(Number(row['Year']))) {
        errors.push(`Row ${rowNumber}: Year must be a number`);
        return;
      }

      if (row['Month'] && (isNaN(Number(row['Month'])) || Number(row['Month']) < 1 || Number(row['Month']) > 12)) {
        errors.push(`Row ${rowNumber}: Month must be a number between 1 and 12`);
        return;
      }

      if (row['Rent Amount'] && isNaN(Number(row['Rent Amount'].replace(/[$,]/g, '')))) {
        errors.push(`Row ${rowNumber}: Rent Amount must be a number`);
        return;
      }

      if (row['Rent Date'] && isNaN(Date.parse(row['Rent Date']))) {
        errors.push(`Row ${rowNumber}: Rent Date must be a valid date`);
        return;
      }
      
      valid.push(row);
    } else {
      console.log(`Row ${rowNumber}: Invalid format - missing required fields`);
      console.log('Available fields:', Object.keys(row));
      errors.push(`Row ${rowNumber}: Invalid format - must have either Property ID + Address OR Property Name + Full Address`);
      return;
    }
  });

  console.log('Validation complete. Valid:', valid.length, 'Errors:', errors.length);
  return { valid, errors };
};

// Helper function to parse address into components
export const parseAddress = (address: string): { city: string; state: string; zip: string } => {
  // Simple parsing - you might want to use a more robust address parsing library
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    const city = parts[parts.length - 2] || '';
    const stateZip = parts[parts.length - 1] || '';
    const stateZipParts = stateZip.split(' ').filter(part => part.trim());
    
    if (stateZipParts.length >= 2) {
      const state = stateZipParts[0] || '';
      const zip = stateZipParts[stateZipParts.length - 1] || '';
      return { city, state, zip };
    }
  }
  
  return { city: '', state: '', zip: '' };
};

// Helper function to clean currency values
export const cleanCurrency = (value: string): string => {
  if (!value) return '';
  return value.replace(/[$,]/g, '');
};

export const exportPropertiesToCSV = (properties: any[]): string => {
  const csvData: CSVProperty[] = [];
  
  properties.forEach(property => {
    if (property.units && property.units.length > 0) {
      property.units.forEach((unit: any) => {
        // If unit has rent history, create a row for each rent history record
        if (unit.monthly_rent_history && unit.monthly_rent_history.length > 0) {
          unit.monthly_rent_history.forEach((rentRecord: any) => {
            csvData.push({
              property_name: property.property_name,
              full_address: property.full_address,
              city: property.city,
              state: property.state,
              zip: property.zip,
              property_type: property.property_type,
              square_footage: property.square_footage?.toString() || '',
              acquisition_price: property.acquisition_price?.toString() || '',
              acquisition_date: property.acquisition_date || '',
              notes: property.notes || '',
              external_id: property.external_id || '',
              image_url: property.street_view_image_url || '',
              unit_name: unit.unit_name,
              rent_price: unit.rent_price?.toString() || '',
              tenant_name: unit.tenant_name || '',
              unit_notes: unit.unit_notes || '',
              'Year': rentRecord.year?.toString() || '',
              'Month': rentRecord.month?.toString() || '',
              'Rent Date': rentRecord.rent_date || '',
              'Rent Amount': rentRecord.amount?.toString() || '',
              'Payment Method': rentRecord.method || '',
              'Rent Notes': rentRecord.notes || ''
            });
          });
        } else {
          // Unit exists but no rent history
          csvData.push({
            property_name: property.property_name,
            full_address: property.full_address,
            city: property.city,
            state: property.state,
            zip: property.zip,
            property_type: property.property_type,
            square_footage: property.square_footage?.toString() || '',
            acquisition_price: property.acquisition_price?.toString() || '',
            acquisition_date: property.acquisition_date || '',
            notes: property.notes || '',
            external_id: property.external_id || '',
            image_url: property.street_view_image_url || '',
            unit_name: unit.unit_name,
            rent_price: unit.rent_price?.toString() || '',
            tenant_name: unit.tenant_name || '',
            unit_notes: unit.unit_notes || '',
            'Year': '',
            'Month': '',
            'Rent Date': '',
            'Rent Amount': '',
            'Payment Method': '',
            'Rent Notes': ''
          });
        }
      });
    } else {
      // Property exists but no units
      csvData.push({
        property_name: property.property_name,
        full_address: property.full_address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        property_type: property.property_type,
        square_footage: property.square_footage?.toString() || '',
        acquisition_price: property.acquisition_price?.toString() || '',
        acquisition_date: property.acquisition_date || '',
        notes: property.notes || '',
        external_id: property.external_id || '',
        image_url: property.street_view_image_url || '',
        'Year': '',
        'Month': '',
        'Rent Date': '',
        'Rent Amount': '',
        'Payment Method': '',
        'Rent Notes': ''
      });
    }
  });

  return Papa.unparse(csvData);
};

// New function: Export only properties and units (no rent history)
export const exportPropertiesAndUnitsToCSV = (properties: any[]): string => {
  const csvData: CSVPropertyUnit[] = [];
  
  properties.forEach(property => {
    if (property.units && property.units.length > 0) {
      property.units.forEach((unit: any) => {
        const row = {
          property_name: property.property_name,
          full_address: property.full_address,
          city: property.city,
          state: property.state,
          zip: property.zip,
          property_type: property.property_type,
          square_footage: property.square_footage?.toString() || '',
          acquisition_price: property.acquisition_price?.toString() || '',
          acquisition_date: property.acquisition_date || '',
          notes: property.notes || '',
          external_id: property.external_id || '',
          image_url: property.street_view_image_url || '',
          unit_name: unit.unit_name,
          rent_price: unit.rent_price?.toString() || '',
          tenant_name: unit.tenant_name || '',
          unit_notes: unit.unit_notes || ''
        };
        csvData.push(row);
      });
    } else {
      // Property exists but no units
      const row = {
        property_name: property.property_name,
        full_address: property.full_address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        property_type: property.property_type,
        square_footage: property.square_footage?.toString() || '',
        acquisition_price: property.acquisition_price?.toString() || '',
        acquisition_date: property.acquisition_date || '',
        notes: property.notes || '',
        external_id: property.external_id || '',
        image_url: property.street_view_image_url || ''
      };
      csvData.push(row);
    }
  });

  return Papa.unparse(csvData);
};

// New function: Export only rent history
export const exportRentHistoryToCSV = (properties: any[]): string => {
  const csvData: CSVRentHistory[] = [];
  
  properties.forEach(property => {
    if (property.units && property.units.length > 0) {
      property.units.forEach((unit: any) => {
        if (unit.monthly_rent_history && unit.monthly_rent_history.length > 0) {
          unit.monthly_rent_history.forEach((rentRecord: any) => {
            csvData.push({
              property_name: property.property_name,
              full_address: property.full_address,
              unit_name: unit.unit_name,
              'Year': rentRecord.year?.toString() || '',
              'Month': rentRecord.month?.toString() || '',
              'Rent Date': rentRecord.rent_date || '',
              'Rent Amount': rentRecord.amount?.toString() || '',
              'Payment Method': rentRecord.method || '',
              'Rent Notes': rentRecord.notes || ''
            });
          });
        }
      });
    }
  });

  return Papa.unparse(csvData);
};

export const generateRentHistoryTemplate = (): string => {
  const template = [
    {
      'Property Id': '405-mother-gaston-blvd',
      'Address': '405 Mother Gaston Blvd',
      'Unit': 'store',
      'Year': '2024',
      'Month': '1',
      'Rent Date': '2024-01-01',
      'Rent Amount': '3934',
      'Payment Method': 'Bank Transfer',
      'Rent Notes': 'On time payment'
    },
    {
      'Property Id': '405-mother-gaston-blvd',
      'Address': '405 Mother Gaston Blvd',
      'Unit': 'store',
      'Year': '2024',
      'Month': '2',
      'Rent Date': '2024-02-01',
      'Rent Amount': '3934',
      'Payment Method': 'Bank Transfer',
      'Rent Notes': 'On time payment'
    },
    {
      'Property Id': '405-mother-gaston-blvd',
      'Address': '405 Mother Gaston Blvd',
      'Unit': '2F',
      'Year': '2024',
      'Month': '1',
      'Rent Date': '2024-01-01',
      'Rent Amount': '3560',
      'Payment Method': 'Check',
      'Rent Notes': 'On time payment'
    },
    {
      'Property Id': '405-mother-gaston-blvd',
      'Address': '405 Mother Gaston Blvd',
      'Unit': '2F',
      'Year': '2024',
      'Month': '2',
      'Rent Date': '2024-02-01',
      'Rent Amount': '3560',
      'Payment Method': 'Check',
      'Rent Notes': 'On time payment'
    }
  ];

  return Papa.unparse(template);
};

// New function to process CSV data and create monthly rent history
export const processCSVForMonthlyRentHistory = async (
  csvData: CSVProperty[], 
  createProperty: Function, 
  upsertProperty: Function, 
  createUnit: Function, 
  upsertUnit: Function,
  upsertMonthlyRentHistory: Function
) => {
  const results = {
    propertiesCreated: 0,
    propertiesUpdated: 0,
    unitsCreated: 0,
    unitsUpdated: 0,
    rentHistoryCreated: 0,
    errors: [] as string[]
  };

  // Group data by property
  const propertyGroups = new Map<string, CSVProperty[]>();
  
  csvData.forEach((row, index) => {
    const propertyKey = row.property_id || row['Property Id'] || `${row.property_name}-${row.full_address}`;
    if (!propertyGroups.has(propertyKey)) {
      propertyGroups.set(propertyKey, []);
    }
    propertyGroups.get(propertyKey)!.push(row);
  });

  // Process each property group
  propertyGroups.forEach((rows, propertyKey) => {
    (async () => {
      try {
        const firstRow = rows[0];
        
        // Create or update property
        const propertyData = {
          property_name: firstRow.property_name || firstRow.address || `Property ${propertyKey}`,
          full_address: firstRow.full_address || firstRow.address || '',
          city: firstRow.city || parseAddress(firstRow.address || '').city,
          state: firstRow.state || parseAddress(firstRow.address || '').state,
          zip: firstRow.zip || parseAddress(firstRow.address || '').zip,
          property_type: firstRow.property_type || 'Multi-family',
          square_footage: firstRow.square_footage || firstRow.sq_ft ? parseInt(firstRow.square_footage || firstRow.sq_ft || '0') : null,
          acquisition_price: firstRow.acquisition_price ? parseFloat(cleanCurrency(firstRow.acquisition_price)) : null,
          acquisition_date: firstRow.acquisition_date || null,
          notes: firstRow.notes || '',
          external_id: firstRow.external_id || firstRow.property_id || firstRow['Property Id'] || null,
          street_view_image_url: firstRow.image_url || null,
        };

        let property;
        if (propertyData.external_id) {
          property = await upsertProperty(propertyData);
          results.propertiesUpdated++;
        } else {
          property = await createProperty(propertyData);
          results.propertiesCreated++;
        }

        // Process units for this property
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.unit_name || row.unit || row['Unit']) {
            const unitData = {
              property_id: property.id,
              unit_name: row.unit_name || row.unit || row['Unit'] || '',
              rent_price: row.rent_price || row.rent || row.market_rent ? parseFloat(cleanCurrency(row.rent_price || row.rent || row.market_rent || '0')) : null,
              tenant_name: row.tenant_name || row.primary_tenant_name || row['Primary Tenant Name'] || null,
              unit_notes: row.unit_notes || row['Unit Notes'] || null,
            };

            let unit;
            if (unitData.unit_name) {
              unit = await upsertUnit(unitData);
              if (unit.id) {
                results.unitsUpdated++;
              } else {
                results.unitsCreated++;
              }

              // Process rent history if available
              if (row['Year'] && row['Month'] && (row['Rent Amount'] || row.rent || row.market_rent)) {
                try {
                  await upsertMonthlyRentHistory({
                    unit_id: unit.id,
                    year: parseInt(row['Year']),
                    month: parseInt(row['Month']),
                    rent_date: row['Rent Date'] || null,
                    amount: row['Rent Amount'] || row.rent || row.market_rent ? parseFloat(cleanCurrency(row['Rent Amount'] || row.rent || row.market_rent || '0')) : null,
                    method: row['Payment Method'] || 'CSV Import',
                    notes: row['Rent Notes'] || null,
                  });
                  results.rentHistoryCreated++;
                } catch (error) {
                  console.error('Error creating rent history:', error);
                  results.errors.push(`Row ${i + 1}: Failed to create rent history - ${error}`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing property group:', error);
        results.errors.push(`Property ${propertyKey}: ${error}`);
      }
    })();
  });

  return results;
};