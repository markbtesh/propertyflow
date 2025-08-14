'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Database, Play, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const predefinedQueries = [
    {
      name: 'View all properties',
      query: 'SELECT * FROM properties ORDER BY created_at DESC LIMIT 10;'
    },
    {
      name: 'View all units',
      query: 'SELECT u.*, p.property_name FROM units u JOIN properties p ON u.property_id = p.id ORDER BY u.created_at DESC LIMIT 10;'
    },
    {
      name: 'Properties with unit count',
      query: 'SELECT p.*, COUNT(u.id) as unit_count FROM properties p LEFT JOIN units u ON p.id = u.property_id GROUP BY p.id ORDER BY unit_count DESC;'
    },
    {
      name: 'Occupied units',
      query: 'SELECT u.*, p.property_name FROM units u JOIN properties p ON u.property_id = p.id WHERE u.tenant_name IS NOT NULL AND u.tenant_name != \'\' ORDER BY p.property_name, u.unit_name;'
    },
    {
      name: 'Table structure',
      query: `SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('properties', 'units', 'rent_history')
      ORDER BY table_name, ordinal_position;`
    }
  ];

  const handleRunQuery = async () => {
    if (!query.trim()) {
      toast({
        title: 'No query provided',
        description: 'Please enter a SQL query to execute.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
      
      if (error) {
        toast({
          title: 'Query error',
          description: error.message,
          variant: 'destructive',
        });
        setResults([]);
      } else {
        setResults(data || []);
        toast({
          title: 'Query executed successfully',
          description: `Returned ${data?.length || 0} rows.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Query failed',
        description: 'An error occurred while executing the query.',
        variant: 'destructive',
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePredefinedQuery = (predefinedQuery: string) => {
    setQuery(predefinedQuery);
  };

  const formatResults = (data: any[]) => {
    if (!data || data.length === 0) return <p className="text-gray-500">No results</p>;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 text-left font-medium text-gray-900 border-b">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-2 text-gray-700">
                    {row[column] === null ? (
                      <span className="text-gray-400">null</span>
                    ) : typeof row[column] === 'object' ? (
                      <span className="text-gray-500">{JSON.stringify(row[column])}</span>
                    ) : (
                      String(row[column])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Query</h1>
          <p className="text-gray-600">Run SQL queries to inspect your database structure and data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Input */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  SQL Query
                </CardTitle>
                <CardDescription>
                  Enter a SQL query to execute against your database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT * FROM properties LIMIT 10;"
                  className="min-h-[120px] font-mono text-sm"
                />
                <Button 
                  onClick={handleRunQuery} 
                  disabled={loading || !query.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Query
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Predefined Queries */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quick Queries
                </CardTitle>
                <CardDescription>
                  Common queries to explore your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {predefinedQueries.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => handlePredefinedQuery(item.query)}
                  >
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate">{item.query}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
              <CardDescription>
                {results.length} row{results.length !== 1 ? 's' : ''} returned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formatResults(results)}
            </CardContent>
          </Card>
        )}

        {/* Safety Notice */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">⚠️ Safety Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>• This tool is for read-only queries to inspect your data</p>
              <p>• Avoid INSERT, UPDATE, or DELETE operations</p>
              <p>• Use the Supabase Dashboard for data modifications</p>
              <p>• Complex queries may be limited by RLS policies</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
