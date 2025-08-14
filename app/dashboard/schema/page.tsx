'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Table, Key, Type } from 'lucide-react';

interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount?: number;
}

export default function SchemaPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define the schema based on the TypeScript types
    const schemaData: TableInfo[] = [
      {
        name: 'properties',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', isNullable: false, isPrimaryKey: false, isForeignKey: true },
          { name: 'property_name', type: 'text', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'full_address', type: 'text', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'city', type: 'text', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'state', type: 'text', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'zip', type: 'text', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'property_type', type: 'text', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'square_footage', type: 'integer', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'acquisition_price', type: 'numeric', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'acquisition_date', type: 'date', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'notes', type: 'text', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'street_view_image_url', type: 'text', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'external_id', type: 'text', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'created_at', type: 'timestamp with time zone', isNullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', isNullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'now()' },
        ]
      },
      {
        name: 'units',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: 'gen_random_uuid()' },
          { name: 'property_id', type: 'uuid', isNullable: false, isPrimaryKey: false, isForeignKey: true },
          { name: 'unit_name', type: 'text', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'rent_price', type: 'numeric', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'tenant_name', type: 'text', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'unit_notes', type: 'text', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'created_at', type: 'timestamp with time zone', isNullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', isNullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'now()' },
        ]
      },
      {
        name: 'rent_history',
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: 'gen_random_uuid()' },
          { name: 'unit_id', type: 'uuid', isNullable: false, isPrimaryKey: false, isForeignKey: true },
          { name: 'transaction_date', type: 'date', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'amount', type: 'numeric', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'transaction_type', type: 'text', isNullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'notes', type: 'text', isNullable: true, isPrimaryKey: false, isForeignKey: false },
          { name: 'created_at', type: 'timestamp with time zone', isNullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'now()' },
        ]
      }
    ];

    setTables(schemaData);
    setLoading(false);
  }, []);

  const getTypeColor = (type: string) => {
    if (type.includes('uuid')) return 'bg-purple-100 text-purple-800';
    if (type.includes('text')) return 'bg-blue-100 text-blue-800';
    if (type.includes('numeric') || type.includes('integer')) return 'bg-green-100 text-green-800';
    if (type.includes('date') || type.includes('timestamp')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schema...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Schema</h1>
          <p className="text-gray-600">Current table structure in your Supabase database</p>
        </div>

        <div className="space-y-6">
          {tables.map((table) => (
            <Card key={table.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  {table.name}
                  <Badge variant="secondary" className="ml-2">
                    {table.columns.length} columns
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {table.name === 'properties' && 'Main property information and details'}
                  {table.name === 'units' && 'Individual units within properties'}
                  {table.name === 'rent_history' && 'Rent payment and transaction history'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Column</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Type</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Constraints</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((column) => (
                        <tr key={column.name} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-sm">
                            <div className="flex items-center gap-2">
                              {column.name}
                              {column.isPrimaryKey && <Key className="w-3 h-3 text-yellow-600" />}
                              {column.isForeignKey && <Database className="w-3 h-3 text-blue-600" />}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <Badge className={getTypeColor(column.type)}>
                              {column.type}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex gap-1">
                              {column.isPrimaryKey && <Badge variant="outline" className="text-xs">PK</Badge>}
                              {column.isForeignKey && <Badge variant="outline" className="text-xs">FK</Badge>}
                              {!column.isNullable && <Badge variant="outline" className="text-xs">NOT NULL</Badge>}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-gray-600 font-mono text-xs">
                            {column.defaultValue || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Relationships */}
                {table.name === 'properties' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Relationships:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>user_id</strong> → References auth.users (Supabase Auth)</li>
                      <li>• <strong>units</strong> → One property can have many units (1:many)</li>
                    </ul>
                  </div>
                )}

                {table.name === 'units' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Relationships:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• <strong>property_id</strong> → References properties.id</li>
                      <li>• <strong>rent_history</strong> → One unit can have many rent transactions (1:many)</li>
                    </ul>
                  </div>
                )}

                {table.name === 'rent_history' && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Relationships:</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• <strong>unit_id</strong> → References units.id</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Schema Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Schema Summary</CardTitle>
            <CardDescription>Overview of your database structure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Properties</h4>
                <p className="text-sm text-blue-800 mt-1">Main property information including address, type, and financial details</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Units</h4>
                <p className="text-sm text-green-800 mt-1">Individual units within properties with rent and tenant information</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900">Rent History</h4>
                <p className="text-sm text-purple-800 mt-1">Transaction history for rent payments and other financial records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
