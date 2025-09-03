'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, X, Download, Upload, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { 
  getProperties, 
  createProperty, 
  updateProperty, 
  createUnit,
  updateUnit,
  createMonthlyRentHistory,
  upsertMonthlyRentHistory,
  updateMonthlyRentHistory,
  deleteUnit
} from '@/lib/api';
import { exportPropertiesAndUnitsToCSV, exportRentHistoryToCSV } from '@/lib/csv';
import { getCurrentUser } from '@/lib/auth';

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
  notes: string;
  external_id: string | null;
  street_view_image_url: string | null;
  units?: Unit[];
}

interface Unit {
  id: string;
  property_id: string;
  unit_name: string;
  rent_price: number | null;
  tenant_name: string | null;
  unit_notes: string | null;
  monthly_rent_history?: MonthlyRentHistory[];
}

interface MonthlyRentHistory {
  id: string;
  unit_id: string;
  year: number;
  month: number;
  rent_date: string | null;
  amount: number;
  method: string;
  notes: string | null;
}

export default function DataManagerPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ rowIndex: string; colKey: string; value: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [viewMode, setViewMode] = useState<'properties' | 'units' | 'rent'>('properties');
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; unitId: string; propertyId: string; unitName: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (user) {
        const data = await getProperties(user.id);
        setProperties(data);
      }
    } catch (error) {
      toast({
        title: 'Error loading data',
        description: 'Failed to load properties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rowKey: string, colKey: string, value: any) => {
    setEditingCell({ rowIndex: rowKey, colKey, value: value?.toString() || '' });
    setEditValue(value?.toString() || '');
  };

  const handleSave = async () => {
    if (!editingCell) return;

    try {
      const { rowIndex, colKey, value } = editingCell;
      const newValue = editValue.trim();

      // Helper function to find what type of record this is
      const findRecordType = () => {
        // First check if this is a rent history record
        const allRentHistory = properties.flatMap(p => 
          (p.units || []).flatMap(unit => 
            (unit.monthly_rent_history || []).map(rent => ({
              ...rent,
              property_id: p.id,
              unit_id: unit.id
            }))
          )
        );
        const rentRecord = allRentHistory.find(r => r.id === rowIndex);
        if (rentRecord) return { type: 'rent' as const, record: rentRecord };

        // Check if this is a unit
        const allUnits = properties.flatMap(p => 
          (p.units || []).map(unit => ({ ...unit, property_id: p.id }))
        );
        const unit = allUnits.find(u => u.id === rowIndex);
        if (unit) return { type: 'unit' as const, record: unit };

        // Check if this is a property
        const property = properties.find(p => p.id === rowIndex);
        if (property) return { type: 'property' as const, record: property };

        return null;
      };

      const recordInfo = findRecordType();
      if (!recordInfo) return;

      if (recordInfo.type === 'rent') {
        // Update rent history record in the database
        const rentRecord = recordInfo.record as any;
        const updatedRentRecord = { ...rentRecord, [colKey]: newValue };
        
        // Remove property_id before updating rent history (it's not a column in monthly_rent_history table)
        const { property_id, ...rentDataForUpdate } = updatedRentRecord;
        
        await updateMonthlyRentHistory(rentRecord.id, rentDataForUpdate);
        
        // Update local state
        setProperties(prev => prev.map(p => ({
          ...p,
          units: p.units?.map(u => 
            u.id === rentRecord.unit_id 
              ? {
                  ...u,
                  monthly_rent_history: u.monthly_rent_history?.map(r => 
                    r.id === rentRecord.id ? updatedRentRecord : r
                  )
                }
              : u
          )
        })));
      } else if (recordInfo.type === 'unit') {
        // Update unit in the database
        const unit = recordInfo.record as any;
        const updatedUnit = { ...unit, [colKey]: newValue };
        
        // Remove monthly_rent_history before updating unit (it's not a column in units table)
        const { monthly_rent_history, ...unitDataForUpdate } = updatedUnit;
        
        await updateUnit(unit.id, unitDataForUpdate);
        setProperties(prev => prev.map(p => ({
          ...p,
          units: p.units?.map(u => u.id === unit.id ? updatedUnit : u)
        })));
      } else if (recordInfo.type === 'property') {
        // Update property in the database
        const property = recordInfo.record as Property;
        const updatedProperty = { ...property, [colKey]: newValue };
        await updateProperty(property.id, updatedProperty);
        setProperties(prev => prev.map(p => p.id === property.id ? updatedProperty : p));
      }

      toast({
        title: 'Updated successfully',
        description: 'Data has been saved',
      });
    } catch (error) {
      toast({
        title: 'Error updating data',
        description: 'Failed to update',
        variant: 'destructive',
      });
    } finally {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const toggleUnitExpansion = (unitId: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, unitId: string, propertyId: string, unitName: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      unitId,
      propertyId,
      unitName
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteFromContextMenu = () => {
    if (contextMenu) {
      if (window.confirm(`Are you sure you want to delete unit "${contextMenu.unitName}"? This action cannot be undone.`)) {
        handleDeleteUnit(contextMenu.unitId, contextMenu.propertyId);
      }
      closeContextMenu();
    }
  };

  const addNewProperty = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const newProperty = await createProperty({
        property_name: 'New Property',
        full_address: '',
        city: '',
        state: '',
        zip: '',
        property_type: 'Multi-family',
        square_footage: null,
        acquisition_price: null,
        acquisition_date: null,
        notes: '',
        external_id: null,
        street_view_image_url: null,
        user_id: user.id,
      });
      
      setProperties(prev => [...prev, newProperty]);
      toast({
        title: 'Property added',
        description: 'New property has been created',
      });
    } catch (error) {
      toast({
        title: 'Error adding property',
        description: 'Failed to create property',
        variant: 'destructive',
      });
    }
  };

  const addNewUnit = async (propertyId: string) => {
    try {
      const newUnit = await createUnit({
        property_id: propertyId,
        unit_name: 'New Unit',
        rent_price: null,
        tenant_name: null,
        unit_notes: null,
      });
      
      setProperties(prev => prev.map(p => 
        p.id === propertyId 
          ? { ...p, units: [...(p.units || []), newUnit] }
          : p
      ));
      
      toast({
        title: 'Unit added',
        description: 'New unit has been created',
      });
    } catch (error) {
      toast({
        title: 'Error adding unit',
        description: 'Failed to create unit',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUnit = async (unitId: string, propertyId: string) => {
    try {
      // First delete from the database
      await deleteUnit(unitId);
      
      // Then remove the unit from the local state
      setProperties(prev => prev.map(p => 
        p.id === propertyId 
          ? { ...p, units: p.units?.filter(u => u.id !== unitId) || [] }
          : p
      ));
      
      toast({
        title: 'Unit deleted',
        description: 'Unit has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error deleting unit',
        description: 'Failed to delete unit',
        variant: 'destructive',
      });
    }
  };

  const handleExportProperties = () => {
    try {
      const csvData = exportPropertiesAndUnitsToCSV(properties);
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'properties_and_units.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: 'Properties and units data exported to CSV',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export properties data',
        variant: 'destructive',
      });
    }
  };

  const handleExportRentHistory = () => {
    try {
      const csvData = exportRentHistoryToCSV(properties);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'rent_history.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: 'Rent history data exported to CSV',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export rent history data',
        variant: 'destructive',
      });
    }
  };

  const renderEditableCell = (rowKey: string, colKey: string, value: any) => {
    const isEditing = editingCell?.rowIndex === rowKey && editingCell.colKey === colKey;
    
    if (isEditing) {
      return (
        <div className="flex gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    // Special formatting for rent price and amount
    let displayValue = value;
    if ((colKey === 'rent_price' || colKey === 'amount') && value) {
      if (colKey === 'rent_price') {
        displayValue = `$${value}/mo`;
      } else {
        displayValue = `$${value}`;
      }
    } else if (!value) {
      displayValue = '-';
    }

    return (
      <div 
        className="px-2 py-1 hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-200 rounded min-h-[32px] flex items-center"
        onClick={() => handleEdit(rowKey, colKey, value)}
      >
        {displayValue}
      </div>
    );
  };

  const renderPropertiesTable = () => {
    const columns = [
      { key: 'property_name', label: 'Property Name', width: 'w-64' },
      { key: 'full_address', label: 'Address', width: 'w-80' },
      { key: 'property_type', label: 'Type', width: 'w-32' },
      { key: 'notes', label: 'Notes', width: 'w-64' },
    ];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b">
              {columns.map((col) => (
                <th key={col.key} className={`${col.width} text-left p-3 font-medium text-gray-700 border-r border-gray-200`}>
                  {col.label}
                </th>
              ))}
              <th className="w-24 text-center p-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property, index) => (
              <>
                <tr key={property.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="p-0 border-r border-gray-200">
                      {renderEditableCell(property.id, col.key, property[col.key as keyof Property])}
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addNewUnit(property.id)}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Add Unit"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
                {/* Units rows */}
                {property.units && property.units.map((unit, unitIndex) => (
                  <>
                                         <tr key={unit.id} className="border-b border-gray-200 bg-gray-50" onContextMenu={(e) => handleContextMenu(e, unit.id, property.id, unit.unit_name)}>
                       <td className="p-0 border-r border-gray-200">
                         <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2">
                           <div className="flex items-center gap-2 ml-2">
                             <span className="text-xs text-gray-500">└</span>
                             <span className="text-sm font-medium">{unit.unit_name}</span>
                           </div>
                           {unit.monthly_rent_history && unit.monthly_rent_history.length > 0 && (
                             <button
                               onClick={() => toggleUnitExpansion(unit.id)}
                               className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors flex items-center gap-1 self-start sm:self-auto ${
                                 expandedUnits.has(unit.id)
                                   ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                                   : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                               }`}
                               title={expandedUnits.has(unit.id) ? "Collapse Rent History" : "Expand Rent History"}
                             >
                               {expandedUnits.has(unit.id) ? '▼' : '▶'} {unit.monthly_rent_history.length} payments
                             </button>
                           )}
                         </div>
                       </td>
                      <td className="p-0 border-r border-gray-200">
                        {renderEditableCell(unit.id, 'tenant_name', unit.tenant_name)}
                      </td>
                      <td className="p-0 border-r border-gray-200">
                        {renderEditableCell(unit.id, 'rent_price', unit.rent_price)}
                      </td>
                      <td className="p-0 border-r border-gray-200">
                        {renderEditableCell(unit.id, 'unit_notes', unit.unit_notes)}
                      </td>
                      <td className="p-2 text-center">
                      </td>
                    </tr>
                    {/* Rent History rows */}
                    {expandedUnits.has(unit.id) && unit.monthly_rent_history && unit.monthly_rent_history.map((rentRecord, rentIndex) => (
                      <tr key={`${unit.id}-rent-${rentRecord.id}`} className="border-b border-gray-200 bg-gray-100">
                        <td className="p-0 border-r border-gray-200">
                          <div className="flex items-center gap-2 p-2 ml-10">
                            <span className="text-xs text-gray-500 font-medium">
                              {new Date(rentRecord.year, rentRecord.month - 1).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                          </div>
                        </td>
                        <td className="p-0 border-r text-sm border-gray-200">
                          {renderEditableCell(rentRecord.id, 'rent_date', rentRecord.rent_date)}
                        </td>
                        <td className="p-0 border-r text-sm border-gray-200">
                          {renderEditableCell(rentRecord.id, 'amount', rentRecord.amount)}
                        </td>
                        <td className="p-0 border-r text-sm border-gray-200">
                          {renderEditableCell(rentRecord.id, 'notes', rentRecord.notes)}
                        </td>
                        <td className="p-2 text-center">
                          <div className="text-xs text-gray-400">Rent Record</div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderUnitsTable = () => {
    const allUnits = properties.flatMap(p => 
      (p.units || []).map(unit => ({ ...unit, property_name: p.property_name }))
    );

    const columns = [
      { key: 'property_name', label: 'Property', width: 'w-48' },
      { key: 'unit_name', label: 'Unit Name', width: 'w-32' },
      { key: 'rent_price', label: 'Rent Price', width: 'w-32' },
      { key: 'tenant_name', label: 'Tenant', width: 'w-48' },
      { key: 'unit_notes', label: 'Notes', width: 'w-64' },
    ];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b">
              {columns.map((col) => (
                <th key={col.key} className={`${col.width} text-left p-3 font-medium text-gray-700 border-r border-gray-200`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allUnits.map((unit, index) => (
              <tr key={unit.id} className="border-b border-gray-200 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="p-0 border-r border-gray-200">
                    {renderEditableCell(unit.id, col.key, unit[col.key as keyof Unit])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRentHistoryTable = () => {
    const allRentHistory = properties.flatMap(p => 
      (p.units || []).flatMap(unit => 
        (unit.monthly_rent_history || []).map(rent => ({
          ...rent,
          property_name: p.property_name,
          unit_name: unit.unit_name
        }))
      )
    );

    const columns = [
      { key: 'property_name', label: 'Property', width: 'w-48' },
      { key: 'unit_name', label: 'Unit', width: 'w-32' },
      { key: 'year', label: 'Year', width: 'w-20' },
      { key: 'month', label: 'Month', width: 'w-20' },
      { key: 'amount', label: 'Amount', width: 'w-32' },
      { key: 'method', label: 'Method', width: 'w-32' },
      { key: 'notes', label: 'Notes', width: 'w-48' },
    ];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b">
              {columns.map((col) => (
                <th key={col.key} className={`${col.width} text-left p-3 font-medium text-gray-700 border-r border-gray-200`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allRentHistory.map((rent, index) => (
              <tr key={rent.id} className="border-b border-gray-200 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="p-0 border-r border-gray-200">
                    {renderEditableCell(rent.id, col.key, rent[col.key as keyof MonthlyRentHistory])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
                 <div className="space-y-4">
           <div>
             <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Manager</h1>
             <p className="text-gray-600">Spreadsheet-style interface for managing your property data</p>
           </div>
           <div className="flex flex-wrap gap-2">
             <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleExportProperties}>
               <Download className="w-4 h-4" />
               <span className="hidden sm:inline">Export Properties</span>
               <span className="sm:hidden">Properties</span>
             </Button>
             <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleExportRentHistory}>
               <Download className="w-4 h-4" />
               <span className="hidden sm:inline">Export Rent History</span>
               <span className="sm:hidden">Rent History</span>
             </Button>
             <Button variant="outline" size="sm" className="flex items-center gap-2">
               <Upload className="w-4 h-4" />
               <span className="hidden sm:inline">Import</span>
               <span className="sm:hidden">Import</span>
             </Button>
             <Button size="sm" onClick={addNewProperty} className="flex items-center gap-2">
               <Plus className="w-4 h-4" />
               <span className="hidden sm:inline">Add Property</span>
               <span className="sm:hidden">Add</span>
             </Button>
           </div>
         </div>

        {/* View Mode Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setViewMode('properties')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              viewMode === 'properties' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Properties ({properties.length})
          </button>
          <button
            onClick={() => setViewMode('units')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              viewMode === 'units' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Units ({properties.reduce((sum, p) => sum + (p.units?.length || 0), 0)})
          </button>
          <button
            onClick={() => setViewMode('rent')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              viewMode === 'rent' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Rent History ({properties.reduce((sum, p) => 
              sum + (p.units?.reduce((uSum, u) => uSum + (u.monthly_rent_history?.length || 0), 0) || 0), 0
            )})
          </button>
        </div>

        {/* Spreadsheet Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {viewMode === 'properties' && renderPropertiesTable()}
          {viewMode === 'units' && renderUnitsTable()}
          {viewMode === 'rent' && renderRentHistoryTable()}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click any cell to edit it inline</li>
            <li>• Press Enter to save, Escape to cancel</li>
            <li>• Use the tabs above to switch between different data views</li>
            <li>• Add new properties with the &quot;Add Property&quot; button</li>
            <li>• Add units to properties using the green + button in the Actions column</li>
            <li>• Click the blue rent record count badge to expand/collapse rent history</li>
            <li>• Right-click on unit rows to delete them</li>
            <li>• Export Properties &amp; Units or Rent History separately using the export buttons</li>
          </ul>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleDeleteFromContextMenu}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Unit
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
