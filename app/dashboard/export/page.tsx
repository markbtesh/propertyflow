'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Database } from 'lucide-react';
import { exportPropertiesToCSV } from '@/lib/csv';
import { getProperties } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const propertiesData = await getProperties(user.id);
          setProperties(propertiesData);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: 'Error loading data',
          description: 'Failed to load your properties for export.',
          variant: 'destructive',
        });
      }
    };

    fetchProperties();
  }, [toast]);

  const handleExport = async () => {
    if (properties.length === 0) {
      toast({
        title: 'No data to export',
        description: 'You don\'t have any properties to export yet.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const csvContent = exportPropertiesToCSV(properties);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `propertyflow_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Exported ${properties.length} properties to CSV file.`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting your data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalUnits = () => {
    return properties.reduce((total, property) => {
      return total + (property.units?.length || 0);
    }, 0);
  };

  const getOccupiedUnits = () => {
    return properties.reduce((total, property) => {
      if (!property.units) return total;
      return total + property.units.filter((unit: any) => unit.tenant_name && unit.tenant_name.trim()).length;
    }, 0);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Data</h1>
          <p className="text-gray-600">Export your property and unit data to CSV format</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export to CSV
              </CardTitle>
              <CardDescription>
                Download all your property and unit data in CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Database className="w-4 h-4" />
                {properties.length} properties, {getTotalUnits()} units
              </div>
              
              <Button 
                onClick={handleExport} 
                disabled={loading || properties.length === 0}
                className="w-full"
              >
                {loading ? 'Generating CSV...' : 'Export Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Export Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Export Information
              </CardTitle>
              <CardDescription>
                What's included in your export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Properties:</span>
                  <span className="font-medium">{properties.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Units:</span>
                  <span className="font-medium">{getTotalUnits()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupied Units:</span>
                  <span className="font-medium">{getOccupiedUnits()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupancy Rate:</span>
                  <span className="font-medium">
                    {getTotalUnits() > 0 ? Math.round((getOccupiedUnits() / getTotalUnits()) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Details */}
        <Card>
          <CardHeader>
            <CardTitle>Export Details</CardTitle>
            <CardDescription>
              Your CSV export will include the following information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Property Information:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Property name and address</li>
                  <li>• City, state, and ZIP code</li>
                  <li>• Property type</li>
                  <li>• Square footage</li>
                  <li>• Acquisition price and date</li>
                  <li>• Notes and external ID</li>
                  <li>• Street view image URL</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Unit Information:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Unit name/number</li>
                  <li>• Rent price</li>
                  <li>• Tenant name</li>
                  <li>• Unit notes</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Each row in the CSV represents a property-unit combination. 
                Properties without units will appear as single rows, while properties with multiple 
                units will have multiple rows (one for each unit).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
