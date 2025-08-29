'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProperty, updateProperty } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface PropertyFormProps {
  property?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PropertyForm({ property, onSuccess, onCancel }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    property_name: property?.property_name || '',
    full_address: property?.full_address || '',
    city: property?.city || '',
    state: property?.state || '',
    zip: property?.zip || '',
    property_type: property?.property_type || '',
    square_footage: property?.square_footage?.toString() || '',
    acquisition_price: property?.acquisition_price?.toString() || '',
    acquisition_date: property?.acquisition_date || '',
    notes: property?.notes || '',
    external_id: property?.external_id || '',
    image_url: property?.street_view_image_url || '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const propertyData = {
        ...formData,
        user_id: user.id,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        acquisition_price: formData.acquisition_price ? parseFloat(formData.acquisition_price) : null,
        acquisition_date: formData.acquisition_date || null,
        notes: formData.notes || null,
        external_id: formData.external_id || null,
        street_view_image_url: formData.image_url || null,
      };

      if (property) {
        await updateProperty(property.id, propertyData);
        toast({
          title: 'Property updated',
          description: 'Property has been successfully updated.',
        });
      } else {
        await createProperty(propertyData);
        toast({
          title: 'Property created',
          description: 'Property has been successfully created.',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    'Single-family',
    'Multi-family',
    'Duplex',
    'Triplex',
    'Quadplex',
    'Apartment Building',
    'Commercial',
    'Mixed Use',
    'Condo',
    'Townhouse',
    'Land',
    'Other'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {property ? 'Edit Property' : 'Add New Property'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property_name" className="text-gray-700 font-medium">Property Name *</Label>
              <Input
                id="property_name"
                type="text"
                value={formData.property_name}
                onChange={(e) => handleInputChange('property_name', e.target.value)}
                placeholder="Enter property name"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_type" className="text-gray-700 font-medium">Property Type *</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) => handleInputChange('property_type', value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_address" className="text-gray-700 font-medium">Full Address *</Label>
            <Input
              id="full_address"
              type="text"
              value={formData.full_address}
              onChange={(e) => handleInputChange('full_address', e.target.value)}
              placeholder="Enter full street address"
              required
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-gray-700 font-medium">City *</Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-gray-700 font-medium">State *</Label>
              <Input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Enter state"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip" className="text-gray-700 font-medium">ZIP Code *</Label>
              <Input
                id="zip"
                type="text"
                value={formData.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                placeholder="Enter ZIP code"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="square_footage" className="text-gray-700 font-medium">Square Footage</Label>
              <Input
                id="square_footage"
                type="number"
                value={formData.square_footage}
                onChange={(e) => handleInputChange('square_footage', e.target.value)}
                placeholder="Enter square footage"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisition_price" className="text-gray-700 font-medium">Acquisition Price</Label>
              <Input
                id="acquisition_price"
                type="number"
                step="0.01"
                value={formData.acquisition_price}
                onChange={(e) => handleInputChange('acquisition_price', e.target.value)}
                placeholder="Enter acquisition price"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acquisition_date" className="text-gray-700 font-medium">Acquisition Date</Label>
              <Input
                id="acquisition_date"
                type="date"
                value={formData.acquisition_date}
                onChange={(e) => handleInputChange('acquisition_date', e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="external_id" className="text-gray-700 font-medium">External ID</Label>
              <Input
                id="external_id"
                type="text"
                value={formData.external_id}
                onChange={(e) => handleInputChange('external_id', e.target.value)}
                placeholder="Enter external ID"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url" className="text-gray-700 font-medium">Property Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              placeholder="Enter image URL (optional)"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500">
              You can use any image URL, or try a placeholder service like: https://picsum.photos/400/300
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-700 font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any notes about this property"
              rows={3}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 gradient-button text-white border-0 interactive-button"
            >
              {loading ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 interactive-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}