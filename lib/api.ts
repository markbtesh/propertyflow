import { supabase } from './supabase';
import type { Database } from './supabase';

type Property = Database['public']['Tables']['properties']['Row'];
type Unit = Database['public']['Tables']['units']['Row'];
type RentHistory = Database['public']['Tables']['rent_history']['Row'];

export const getProperties = async (userId: string) => {
  console.log('Fetching properties for user ID:', userId);
  
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      units (
        *,
        rent_history (*)
      )
    `)
    // Temporarily remove user_id filter to see all properties
    // .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }

  console.log('Found properties:', data?.length || 0);
  return data || [];
};

export const getProperty = async (propertyId: string, userId: string) => {
  console.log('Fetching property with ID:', propertyId, 'for user ID:', userId);
  
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      units (
        *,
        rent_history (*)
      )
    `)
    .eq('id', propertyId)
    // Temporarily remove user_id filter to see all properties
    // .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    return null;
  }

  console.log('Found property:', data);
  return data;
};

export const createProperty = async (property: Database['public']['Tables']['properties']['Insert']) => {
  console.log('Creating property with data:', property);
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase
    .from('properties')
    .insert([property])
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log('Property created successfully:', data);
  return data;
};

export const upsertProperty = async (property: Database['public']['Tables']['properties']['Insert']) => {
  // Check if property exists by external_id or address
  let existingProperty = null;
  
  if (property.external_id) {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('external_id', property.external_id)
      .eq('user_id', property.user_id)
      .single();
    existingProperty = data;
  }
  
  // If not found by external_id, try by address
  if (!existingProperty && property.full_address) {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('full_address', property.full_address)
      .eq('user_id', property.user_id)
      .single();
    existingProperty = data;
  }

  if (existingProperty) {
    // Update existing property
    console.log('Updating existing property:', existingProperty.id);
    return await updateProperty(existingProperty.id, property);
  } else {
    // Create new property
    console.log('Creating new property');
    return await createProperty(property);
  }
};

export const updateProperty = async (
  propertyId: string, 
  updates: Database['public']['Tables']['properties']['Update']
) => {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', propertyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating property:', error);
    throw error;
  }

  return data;
};

export const deleteProperty = async (propertyId: string) => {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId);

  if (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
};

export const createUnit = async (unit: Database['public']['Tables']['units']['Insert']) => {
  const { data, error } = await supabase
    .from('units')
    .insert([unit])
    .select()
    .single();

  if (error) {
    console.error('Error creating unit:', error);
    throw error;
  }

  return data;
};

export const upsertUnit = async (unit: Database['public']['Tables']['units']['Insert']) => {
  // Check if unit exists by property_id and unit_name
  const { data: existingUnit } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', unit.property_id)
    .eq('unit_name', unit.unit_name)
    .single();

  if (existingUnit) {
    // Update existing unit
    console.log('Updating existing unit:', existingUnit.id);
    return await updateUnit(existingUnit.id, unit);
  } else {
    // Create new unit
    console.log('Creating new unit');
    return await createUnit(unit);
  }
};

export const updateUnit = async (
  unitId: string, 
  updates: Database['public']['Tables']['units']['Update']
) => {
  console.log('Updating unit with ID:', unitId);
  console.log('Updates:', updates);
  
  const { data, error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', unitId)
    .select()
    .single();

  if (error) {
    console.error('Error updating unit:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  console.log('Unit updated successfully:', data);
  return data;
};

export const deleteUnit = async (unitId: string) => {
  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId);

  if (error) {
    console.error('Error deleting unit:', error);
    throw error;
  }
};

export const createRentHistory = async (rentHistory: Database['public']['Tables']['rent_history']['Insert']) => {
  const { data, error } = await supabase
    .from('rent_history')
    .insert([rentHistory])
    .select()
    .single();

  if (error) {
    console.error('Error creating rent history:', error);
    throw error;
  }

  return data;
};

export const getDashboardStats = async (userId: string) => {
  const properties = await getProperties(userId);
  
  const totalProperties = properties.length;
  let totalUnits = 0;
  let occupiedUnits = 0;
  let totalMonthlyRent = 0;

  properties.forEach((property: any) => {
    if (property.units) {
      totalUnits += property.units.length;
      property.units.forEach((unit: any) => {
        if (unit.tenant_name && unit.tenant_name.trim()) {
          occupiedUnits++;
        }
        if (unit.rent_price) {
          totalMonthlyRent += unit.rent_price;
        }
      });
    }
  });

  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  const averageRent = totalUnits > 0 ? totalMonthlyRent / totalUnits : 0;

  return {
    totalProperties,
    totalUnits,
    occupiedUnits,
    totalMonthlyRent,
    occupancyRate,
    averageRent,
  };
};