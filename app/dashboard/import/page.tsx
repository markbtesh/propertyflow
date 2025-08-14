'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { parseCSV, validateCSVData, generateCSVTemplate, CSVProperty, parseAddress, cleanCurrency } from '@/lib/csv';
import { upsertProperty, upsertUnit } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVProperty[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setCsvData([]);
    setValidationErrors([]);

    try {
      const text = await selectedFile.text();
      console.log('Raw CSV text (first 500 chars):', text.substring(0, 500));
      
      const parsedData = await parseCSV(text);
      console.log('Parsed CSV data (first 3 rows):', parsedData.slice(0, 3));
      console.log('CSV column names:', Object.keys(parsedData[0] || {}));
      
      setCsvData(parsedData);
      
      const { valid, errors } = validateCSVData(parsedData);
      console.log('Validation errors:', errors);
      console.log('Valid records:', valid.length);
      
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        toast({
          title: 'Validation errors found',
          description: `Found ${errors.length} errors in your CSV file. Please fix them before importing.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'CSV file loaded successfully',
          description: `Found ${valid.length} valid records ready for import.`,
        });
      }
    } catch (error) {
      console.error('CSV parsing error:', error);
      toast({
        title: 'Error reading CSV file',
        description: error instanceof Error ? error.message : 'Please check your file format.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'propertyflow_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast({
        title: 'No data to import',
        description: 'Please upload a CSV file first.',
        variant: 'destructive',
      });
      return;
    }

    if (validationErrors.length > 0) {
      toast({
        title: 'Please fix validation errors',
        description: 'There are errors in your CSV file that need to be fixed before importing.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Group rows by property to avoid creating duplicate properties
      const propertyGroups = new Map<string, CSVProperty[]>();
      
      csvData.forEach(row => {
        let propertyKey: string;
        
        // Handle user's format (property_id + address) - check both formats
        const propertyId = row.property_id || row['Property Id'];
        const address = row.address || row['Address'];
        
        if (propertyId && address) {
          propertyKey = `${propertyId}|${address}`;
        } else if (row.property_name && row.full_address) {
          // Handle original format
          propertyKey = `${row.property_name}|${row.full_address}|${row.external_id || ''}`;
        } else {
          return; // Skip invalid rows
        }
        
        if (!propertyGroups.has(propertyKey)) {
          propertyGroups.set(propertyKey, []);
        }
        propertyGroups.get(propertyKey)!.push(row);
      });

      let successCount = 0;
      let errorCount = 0;
      let propertyCount = 0;
      let unitCount = 0;

      const propertyGroupsArray = Array.from(propertyGroups.entries());
      
      for (let i = 0; i < propertyGroupsArray.length; i++) {
        const [propertyKey, rows] = propertyGroupsArray[i];
        setImportProgress(((i + 1) / propertyGroupsArray.length) * 100);

        try {
          // Use the first row for property data (all rows in a group should have same property data)
          const firstRow = rows[0];
          
          let propertyData: any;
          
          // Handle user's format
          const propertyId = firstRow.property_id || firstRow['Property Id'];
          const address = firstRow.address || firstRow['Address'];
          
          if (propertyId && address) {
            const { city, state, zip } = parseAddress(address);
            
            propertyData = {
              user_id: user.id,
              property_name: address, // Use address as property name
              full_address: address,
              city: city || 'Brooklyn', // Default to Brooklyn if parsing fails
              state: state || 'NY',
              zip: zip || '',
              property_type: 'Multi-family', // Default based on your data
              square_footage: null,
              acquisition_price: null,
              acquisition_date: null,
              notes: null,
              external_id: propertyId,
              street_view_image_url: null,
            };
          } else {
            // Handle original format
            propertyData = {
              user_id: user.id,
              property_name: firstRow.property_name,
              full_address: firstRow.full_address,
              city: firstRow.city,
              state: firstRow.state,
              zip: firstRow.zip,
              property_type: firstRow.property_type,
              square_footage: firstRow.square_footage ? parseInt(firstRow.square_footage) : null,
              acquisition_price: firstRow.acquisition_price ? parseFloat(firstRow.acquisition_price) : null,
              acquisition_date: firstRow.acquisition_date || null,
              notes: firstRow.notes || null,
              external_id: firstRow.external_id || null,
              street_view_image_url: firstRow.image_url || null,
            };
          }

          console.log(`Upserting property for group ${i + 1}:`, propertyData);
          const property = await upsertProperty(propertyData);
          console.log(`Property upserted successfully:`, property);
          propertyCount++;

          // Create units for this property
          for (const row of rows) {
            let unitName: string | null = null;
            let rentPrice: number | null = null;
            let tenantName: string | null = null;
            let unitNotes: string | null = null;
            
            // Handle user's format
            const unit = row.unit || row['Unit'];
            const rent = row.rent || row['Rent'];
            const primaryTenantName = row.primary_tenant_name || row['Primary Tenant Name'];
            const rowUnitNotes = row.unit_notes || row['Unit Notes'];
            const tenancyNotes = row.tenancy_notes || row['Tenancy Notes'];
            const bed = row.bed || row['Bed'];
            const bath = row.bath || row['Bath'];
            const sqFt = row.sq_ft || row['Sq Ft'];
            
            if (unit) {
              unitName = unit;
              rentPrice = rent ? parseFloat(cleanCurrency(rent)) : null;
              tenantName = primaryTenantName || null;
              
              // Combine unit notes and tenancy notes
              const notes = [];
              if (rowUnitNotes) notes.push(rowUnitNotes);
              if (tenancyNotes) notes.push(tenancyNotes);
              if (bed && bed !== '0') notes.push(`${bed} bed`);
              if (bath && bath !== '0') notes.push(`${bath} bath`);
              if (sqFt && sqFt !== '0') notes.push(`${sqFt} sq ft`);
              
              unitNotes = notes.length > 0 ? notes.join(', ') : null;
            } else if (row.unit_name) {
              // Handle original format
              unitName = row.unit_name;
              rentPrice = row.rent_price ? parseFloat(row.rent_price) : null;
              tenantName = row.tenant_name || null;
              unitNotes = row.unit_notes || null;
            }
            
            if (unitName) {
              const unitData = {
                property_id: property.id,
                unit_name: unitName,
                rent_price: rentPrice,
                tenant_name: tenantName,
                unit_notes: unitNotes,
              };

              await upsertUnit(unitData);
              unitCount++;
            }
          }

          successCount++;
        } catch (error) {
          console.error(`Error importing property group ${i + 1}:`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Import completed',
        description: `Successfully imported ${propertyCount} properties with ${unitCount} units. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      // Reset form
      setFile(null);
      setCsvData([]);
      setValidationErrors([]);
      setImportProgress(0);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'An error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import</h1>
          <p className="text-gray-600">Import your property and unit data from a CSV file</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Select a CSV file containing your property and unit data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                />
              </div>
              
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={!file || csvData.length === 0 || validationErrors.length > 0 || importing}
                className="w-full"
              >
                {importing ? `Importing... ${Math.round(importProgress)}%` : 'Import Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Template Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Template
              </CardTitle>
              <CardDescription>
                Get a sample CSV template to see the required format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Download our CSV template to see the exact format required for importing your data.
                The template includes example data and all required fields.
              </p>
              
              <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Validation Results */}
        {csvData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {validationErrors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                Validation Results
              </CardTitle>
              <CardDescription>
                {validationErrors.length > 0 
                  ? `${validationErrors.length} errors found` 
                  : `${csvData.length} records ready for import`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationErrors.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">Please fix the following errors:</p>
                  <ul className="text-sm text-red-600 space-y-1 max-h-60 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-green-600">
                    ✓ All {csvData.length} records are valid and ready for import
                  </div>
                  
                  {/* Data Structure Preview */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Import Preview:</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                                             {(() => {
                         const propertyGroups = new Map<string, CSVProperty[]>();
                         csvData.forEach(row => {
                           let propertyKey: string;
                           
                           // Handle user's format (property_id + address) - check both formats
                           const propertyId = row.property_id || row['Property Id'];
                           const address = row.address || row['Address'];
                           
                           if (propertyId && address) {
                             propertyKey = `${propertyId}|${address}`;
                           } else if (row.property_name && row.full_address) {
                             // Handle original format
                             propertyKey = `${row.property_name}|${row.full_address}|${row.external_id || ''}`;
                           } else {
                             return; // Skip invalid rows
                           }
                           
                           if (!propertyGroups.has(propertyKey)) {
                             propertyGroups.set(propertyKey, []);
                           }
                           propertyGroups.get(propertyKey)!.push(row);
                         });
                         
                         const propertyCount = propertyGroups.size;
                         const unitCount = csvData.filter(row => row.unit || row['Unit'] || row.unit_name).length;
                         
                         return (
                           <div>
                             <p>• <strong>{propertyCount}</strong> unique properties will be created</p>
                             <p>• <strong>{unitCount}</strong> units will be created</p>
                             <p>• Properties with multiple units will be properly linked</p>
                           </div>
                         );
                       })()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CSV Format Information */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Requirements</CardTitle>
            <CardDescription>
              Your CSV file should include the following columns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Required Fields:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• property_name</li>
                    <li>• full_address</li>
                    <li>• city</li>
                    <li>• state</li>
                    <li>• zip</li>
                    <li>• property_type</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Optional Fields:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• square_footage (number)</li>
                    <li>• acquisition_price (number)</li>
                    <li>• acquisition_date (YYYY-MM-DD)</li>
                    <li>• notes</li>
                    <li>• external_id</li>
                    <li>• image_url</li>
                    <li>• unit_name</li>
                    <li>• rent_price (number)</li>
                    <li>• tenant_name</li>
                    <li>• unit_notes</li>
                  </ul>
                </div>
              </div>
              
                             <div className="p-4 bg-blue-50 rounded-lg">
                 <h4 className="font-medium text-blue-900 mb-2">How Properties and Units Work:</h4>
                 <div className="text-sm text-blue-800 space-y-2">
                   <p><strong>Property-Unit Relationship:</strong></p>
                   <ul className="list-disc list-inside space-y-1 ml-4">
                     <li>Each row represents a property-unit combination</li>
                     <li>Properties with the same Property ID and Address will be grouped together</li>
                     <li>Multiple units can belong to the same property</li>
                     <li>If no Unit is provided, only the property will be created</li>
                   </ul>
                   <p className="mt-2"><strong>Example:</strong> A 4-unit apartment building would have 4 rows with the same Property ID and Address but different Unit names (store, 2F, 3F, 4F).</p>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
