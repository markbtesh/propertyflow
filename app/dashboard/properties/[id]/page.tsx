'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getProperty, updateProperty, updateUnit } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { ArrowLeft, Save, Home, Store, Building, Edit3, Calendar } from 'lucide-react';
import MonthlyRentHistory from '@/components/properties/MonthlyRentHistory';

interface Property {
  id: string;
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
  external_id: string | null;
  street_view_image_url: string | null;
  created_at: string;
  updated_at: string;
  units: Unit[];
}

interface Unit {
  id: string;
  property_id: string;
  unit_name: string;
  rent_price: number | null;
  tenant_name: string | null;
  unit_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProperty, setEditingProperty] = useState(false);

  // Property form state
  const [propertyForm, setPropertyForm] = useState({
    property_name: '',
    full_address: '',
    city: '',
    state: '',
    zip: '',
    property_type: '',
    square_footage: '',
    acquisition_price: '',
    acquisition_date: '',
    notes: '',
    external_id: '',
    street_view_image_url: '',
  });

  // Unit form states
  const [unitForms, setUnitForms] = useState<Record<string, {
    unit_name: string;
    rent_price: string;
    tenant_name: string;
    unit_notes: string;
  }>>({});

  useEffect(() => {
    loadProperty();
  }, [params.id]);

  const loadProperty = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/');
        return;
      }

      const propertyData = await getProperty(params.id as string, user.id);
      if (!propertyData) {
        toast({
          title: 'Property not found',
          description: 'The property you are looking for does not exist.',
          variant: 'destructive',
        });
        router.push('/dashboard/properties');
        return;
      }

      console.log('Loaded property data:', propertyData);
      console.log('Property units:', propertyData.units);
      
      setProperty(propertyData);
      
      // Initialize property form
      setPropertyForm({
        property_name: propertyData.property_name || '',
        full_address: propertyData.full_address || '',
        city: propertyData.city || '',
        state: propertyData.state || '',
        zip: propertyData.zip || '',
        property_type: propertyData.property_type || '',
        square_footage: propertyData.square_footage?.toString() || '',
        acquisition_price: propertyData.acquisition_price?.toString() || '',
        acquisition_date: propertyData.acquisition_date || '',
        notes: propertyData.notes || '',
        external_id: propertyData.external_id || '',
        street_view_image_url: propertyData.street_view_image_url || '',
      });

      // Initialize unit forms
      const unitFormData: Record<string, any> = {};
      propertyData.units?.forEach((unit: Unit) => {
        unitFormData[unit.id] = {
          unit_name: unit.unit_name || '',
          rent_price: unit.rent_price?.toString() || '',
          tenant_name: unit.tenant_name || '',
          unit_notes: unit.unit_notes || '',
        };
      });
      setUnitForms(unitFormData);

    } catch (error) {
      console.error('Error loading property:', error);
      toast({
        title: 'Error',
        description: 'Failed to load property details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySave = async () => {
    if (!property) return;

    setSaving(true);
    try {
      // Save property updates
      const updates = {
        property_name: propertyForm.property_name,
        full_address: propertyForm.full_address,
        city: propertyForm.city,
        state: propertyForm.state,
        zip: propertyForm.zip,
        property_type: propertyForm.property_type,
        square_footage: propertyForm.square_footage ? parseInt(propertyForm.square_footage) : null,
        acquisition_price: propertyForm.acquisition_price ? parseFloat(propertyForm.acquisition_price) : null,
        acquisition_date: propertyForm.acquisition_date || null,
        notes: propertyForm.notes,
        external_id: propertyForm.external_id,
        street_view_image_url: propertyForm.street_view_image_url,
      };

      const updatedProperty = await updateProperty(property.id, updates);
      
      // Save all unit updates
      const unitUpdatePromises = property.units.map(async (unit) => {
        const unitForm = unitForms[unit.id];
        if (unitForm) {
          const unitUpdates = {
            unit_name: unitForm.unit_name,
            rent_price: unitForm.rent_price ? parseFloat(unitForm.rent_price) : null,
            tenant_name: unitForm.tenant_name,
            unit_notes: unitForm.unit_notes,
          };
          return await updateUnit(unit.id, unitUpdates);
        }
        return unit;
      });

      const updatedUnits = await Promise.all(unitUpdatePromises);
      
      // Update the property state with all changes
      setProperty(prev => prev ? { 
        ...prev, 
        ...updatedProperty,
        units: updatedUnits
      } : null);
      
      setEditingProperty(false);

      toast({
        title: 'Success',
        description: 'Property and units updated successfully.',
      });
    } catch (error) {
      console.error('Error updating property and units:', error);
      toast({
        title: 'Error',
        description: 'Failed to update property and units.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnitSave = async (unitId: string) => {
    console.log('Saving unit:', unitId);
    if (!property) {
      console.log('No property found');
      return;
    }

    setSaving(true);
    try {
      const unitForm = unitForms[unitId];
      console.log('Unit form data:', unitForm);
      if (!unitForm) {
        console.log('No unit form found');
        return;
      }

      const updates = {
        unit_name: unitForm.unit_name,
        rent_price: unitForm.rent_price ? parseFloat(unitForm.rent_price) : null,
        tenant_name: unitForm.tenant_name,
        unit_notes: unitForm.unit_notes,
      };
      console.log('Unit updates:', updates);

      const updatedUnit = await updateUnit(unitId, updates);
      console.log('Updated unit response:', updatedUnit);
      
      // Update the property state with the updated unit
      setProperty(prev => {
        if (!prev) return null;
        return {
          ...prev,
          units: prev.units.map(unit => 
            unit.id === unitId ? { ...unit, ...updatedUnit } : unit
          )
        };
      });

      toast({
        title: 'Success',
        description: 'Unit updated successfully.',
      });
    } catch (error) {
      console.error('Error updating unit:', error);
      toast({
        title: 'Error',
        description: 'Failed to update unit.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getPropertyIcon = (propertyType: string) => {
    switch (propertyType.toLowerCase()) {
      case 'single-family':
        return <Home className="h-4 w-4" />;
      case 'multi-family':
        return <Building className="h-4 w-4" />;
      case 'commercial':
        return <Store className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  const getUnitIcon = (unitName: string) => {
    if (unitName.toLowerCase().includes('store') || unitName.toLowerCase().includes('shop')) {
      return <Store className="h-4 w-4" />;
    }
    return <Home className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/properties')}
              className="w-fit border-gray-300 text-gray-700 hover:bg-gray-50 interactive-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{property.property_name}</h1>
              <p className="text-gray-600 truncate">{property.full_address}</p>
            </div>
          </div>
          <Button
            onClick={() => setEditingProperty(!editingProperty)}
            variant={editingProperty ? "outline" : "default"}
            className={`w-fit interactive-button ${
              editingProperty 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                : 'gradient-button text-white border-0'
            }`}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {editingProperty ? 'Cancel Edit' : 'Edit Property'}
          </Button>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 border border-gray-200">
            <TabsTrigger value="details" className="text-gray-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Property Details</TabsTrigger>
            <TabsTrigger value="units" className="text-gray-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Units</TabsTrigger>
            <TabsTrigger value="rent-history" className="text-gray-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Rent History</TabsTrigger>
          </TabsList>
          {editingProperty && (
            <Button 
              onClick={handlePropertySave} 
              disabled={saving} 
              className="w-full gradient-button text-white border-0 interactive-button"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Property'}
            </Button>
          )}
          <TabsContent value="details" className="space-y-4">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    {getPropertyIcon(property.property_type)}
                  </div>
                  <span>Property Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_name" className="text-gray-700 font-medium">Property Name</Label>
                    <Input
                      id="property_name"
                      value={propertyForm.property_name}
                      onChange={(e) => setPropertyForm(prev => ({ ...prev, property_name: e.target.value }))}
                      disabled={!editingProperty}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="property_type" className="text-gray-700 font-medium">Property Type</Label>
                    <Select
                      value={propertyForm.property_type}
                      onValueChange={(value) => setPropertyForm(prev => ({ ...prev, property_type: value }))}
                      disabled={!editingProperty}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single-family">Single-family</SelectItem>
                        <SelectItem value="Multi-family">Multi-family</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Mixed-use">Mixed-use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="full_address" className="text-gray-700 font-medium">Full Address</Label>
                  <Input
                    id="full_address"
                    value={propertyForm.full_address}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, full_address: e.target.value }))}
                    disabled={!editingProperty}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-gray-700 font-medium">City</Label>
                    <Input
                      id="city"
                      value={propertyForm.city}
                      onChange={(e) => setPropertyForm(prev => ({ ...prev, city: e.target.value }))}
                      disabled={!editingProperty}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-gray-700 font-medium">State</Label>
                    <Input
                      id="state"
                      value={propertyForm.state}
                      onChange={(e) => setPropertyForm(prev => ({ ...prev, state: e.target.value }))}
                      disabled={!editingProperty}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip" className="text-gray-700 font-medium">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={propertyForm.zip}
                      onChange={(e) => setPropertyForm(prev => ({ ...prev, zip: e.target.value }))}
                      disabled={!editingProperty}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="square_footage" className="text-gray-700 font-medium">Square Footage</Label>
                    <Input
                      id="square_footage"
                      type="number"
                      value={propertyForm.square_footage}
                      onChange={(e) => setPropertyForm(prev => ({ ...prev, square_footage: e.target.value }))}
                      disabled={!editingProperty}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="acquisition_price" className="text-gray-700 font-medium">Acquisition Price</Label>
                    <Input
                      id="acquisition_price"
                      type="number"
                      value={propertyForm.acquisition_price}
                      onChange={(e) => setPropertyForm(prev => ({ ...prev, acquisition_price: e.target.value }))}
                      disabled={!editingProperty}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="acquisition_date" className="text-gray-700 font-medium">Acquisition Date</Label>
                  <Input
                    id="acquisition_date"
                    type="date"
                    value={propertyForm.acquisition_date}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, acquisition_date: e.target.value }))}
                    disabled={!editingProperty}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="external_id" className="text-gray-700 font-medium">External ID</Label>
                  <Input
                    id="external_id"
                    value={propertyForm.external_id}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, external_id: e.target.value }))}
                    disabled={!editingProperty}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="street_view_image_url" className="text-gray-700 font-medium">Street View Image URL</Label>
                  <Input
                    id="street_view_image_url"
                    value={propertyForm.street_view_image_url}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, street_view_image_url: e.target.value }))}
                    disabled={!editingProperty}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-gray-700 font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    value={propertyForm.notes}
                    onChange={(e) => setPropertyForm(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={!editingProperty}
                    rows={3}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Units ({property.units?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.units && property.units.length > 0 ? (
                  property.units.map((unit) => {
                    const unitForm = unitForms[unit.id] || {};

                    return (
                      <div key={unit.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3 bg-gray-50">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                            {getUnitIcon(unit.unit_name)}
                          </div>
                          <span className="font-medium truncate text-gray-900">{unit.unit_name}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`unit_name_${unit.id}`} className="text-gray-700 font-medium">Unit Name</Label>
                            <Input
                              id={`unit_name_${unit.id}`}
                              value={unitForm.unit_name || ''}
                              onChange={(e) => setUnitForms(prev => ({
                                ...prev,
                                [unit.id]: { ...prev[unit.id], unit_name: e.target.value }
                              }))}
                              disabled={!editingProperty}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`rent_price_${unit.id}`} className="text-gray-700 font-medium">Rent Price</Label>
                            <Input
                              id={`rent_price_${unit.id}`}
                              type="number"
                              value={unitForm.rent_price || ''}
                              onChange={(e) => setUnitForms(prev => ({
                                ...prev,
                                [unit.id]: { ...prev[unit.id], rent_price: e.target.value }
                              }))}
                              disabled={!editingProperty}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`tenant_name_${unit.id}`} className="text-gray-700 font-medium">Tenant Name</Label>
                          <Input
                            id={`tenant_name_${unit.id}`}
                            value={unitForm.tenant_name || ''}
                            onChange={(e) => setUnitForms(prev => ({
                              ...prev,
                              [unit.id]: { ...prev[unit.id], tenant_name: e.target.value }
                            }))}
                            disabled={!editingProperty}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`unit_notes_${unit.id}`} className="text-gray-700 font-medium">Unit Notes</Label>
                          <Textarea
                            id={`unit_notes_${unit.id}`}
                            value={unitForm.unit_notes || ''}
                            onChange={(e) => setUnitForms(prev => ({
                              ...prev,
                              [unit.id]: { ...prev[unit.id], unit_notes: e.target.value }
                            }))}
                            disabled={!editingProperty}
                            rows={2}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No units found for this property.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rent-history" className="space-y-4">
            {property.units && property.units.length > 0 ? (
              property.units.map((unit) => (
                <MonthlyRentHistory
                  key={unit.id}
                  unitId={unit.id}
                  unitName={unit.unit_name}
                  currentYear={new Date().getFullYear()}
                />
              ))
            ) : (
              <Card className="border border-gray-200">
                <CardContent className="text-center text-gray-500 py-8">
                  No units found for this property. Add units to track rent history.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
