'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Search, MapPin, DollarSign, Users, Building, ChevronDown, ChevronRight, Home, Store } from 'lucide-react';
import { getProperties } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';

interface PropertyListProps {
  onCreateNew: () => void;
  refreshTrigger?: number;
}

export default function PropertyList({ onCreateNew, refreshTrigger }: PropertyListProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const user = await getCurrentUser();
        console.log('Current user:', user);
        if (user) {
          const propertiesData = await getProperties(user.id);
          console.log('Properties data:', propertiesData);
          setProperties(propertiesData);
          setFilteredProperties(propertiesData);
        } else {
          console.log('No user found');
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(property =>
        property.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.full_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.units?.some((unit: any) => 
          unit.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.unit_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getOccupancyInfo = (units: any[]) => {
    if (!units || units.length === 0) return { occupied: 0, total: 0, rate: 0 };
    const occupied = units.filter(unit => unit.tenant_name && unit.tenant_name.trim()).length;
    const total = units.length;
    const rate = total > 0 ? (occupied / total) * 100 : 0;
    return { occupied, total, rate };
  };

  const getTotalRent = (units: any[]) => {
    if (!units || units.length === 0) return 0;
    return units.reduce((sum, unit) => sum + (unit.rent_price || 0), 0);
  };

  const togglePropertyExpansion = (propertyId: string) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
  };

  const getUnitIcon = (unitName: string) => {
    const lowerName = unitName.toLowerCase();
    if (lowerName.includes('store') || lowerName.includes('shop') || lowerName.includes('retail')) {
      return <Store className="w-4 h-4" />;
    }
    return <Home className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search properties, addresses, or units..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No properties found' : 'No properties yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms.'
              : 'Get started by adding your first property.'
            }
          </p>
          {!searchTerm && (
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Property
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => {
            const occupancyInfo = getOccupancyInfo(property.units);
            const totalRent = getTotalRent(property.units);
            const isExpanded = expandedProperties.has(property.id);

            return (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <Collapsible open={isExpanded} onOpenChange={() => togglePropertyExpansion(property.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-2">
                              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                                {property.property_name}
                              </CardTitle>
                              <Badge variant="secondary" className="w-fit flex-shrink-0">{property.property_type}</Badge>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{property.full_address}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 text-sm">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">{property.units?.length || 0}</div>
                              <div className="text-gray-600 text-xs">Units</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-green-600 text-sm">{formatCurrency(totalRent)}</div>
                              <div className="text-gray-600 text-xs">Monthly</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-blue-600">{occupancyInfo.occupied}/{occupancyInfo.total}</div>
                              <div className="text-gray-600 text-xs">Occupied</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-medium ${
                                occupancyInfo.rate >= 80 
                                  ? 'text-green-600' 
                                  : occupancyInfo.rate >= 50 
                                  ? 'text-yellow-600' 
                                  : 'text-red-600'
                              }`}>
                                {occupancyInfo.rate.toFixed(0)}%
                              </div>
                              <div className="text-gray-600 text-xs">Rate</div>
                            </div>
                          </div>
                          <Link href={`/dashboard/properties/${property.id}`} className="w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {property.units && property.units.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mb-3">Units</div>
                          {property.units.map((unit: any) => (
                            <div
                              key={unit.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
                            >
                              <div className="flex items-start space-x-3 min-w-0 flex-1">
                                {getUnitIcon(unit.unit_name)}
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900 truncate">{unit.unit_name}</div>
                                  {unit.tenant_name && (
                                    <div className="text-sm text-gray-600 truncate">Tenant: {unit.tenant_name}</div>
                                  )}
                                  {unit.unit_notes && (
                                    <div className="text-sm text-gray-500 truncate">{unit.unit_notes}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-medium text-green-600">
                                  {formatCurrency(unit.rent_price)}
                                </div>
                                <div className="text-sm text-gray-600">per month</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Home className="w-8 h-8 mx-auto mb-2" />
                          <p>No units added yet</p>
                        </div>
                      )}
                      
                      <div className="flex justify-end mt-4 pt-4 border-t">
                        <Link href={`/dashboard/properties/${property.id}`} className="w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}