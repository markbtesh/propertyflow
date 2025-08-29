'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  getMonthlyRentHistory, 
  upsertMonthlyRentHistory, 
  updateMonthlyRentHistory,
  deleteMonthlyRentHistory 
} from '@/lib/api';
import { Calendar, DollarSign, CreditCard, Save, Trash2, Plus } from 'lucide-react';

interface MonthlyRentHistoryProps {
  unitId: string;
  unitName: string;
  currentYear?: number;
}

interface RentRecord {
  id?: string;
  unit_id: string;
  year: number;
  month: number;
  rent_date?: string;
  amount?: number;
  method?: string;
  notes?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PAYMENT_METHODS = [
  'Deposit',
  'Check',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Venmo',
  'PayPal',
  'Zelle',
  'Other'
];

export default function MonthlyRentHistory({ unitId, unitName, currentYear = new Date().getFullYear() }: MonthlyRentHistoryProps) {
  const [year, setYear] = useState(currentYear);
  const [rentHistory, setRentHistory] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRentHistory();
  }, [unitId, year]);

  const loadRentHistory = async () => {
    try {
      setLoading(true);
      const data = await getMonthlyRentHistory(unitId, year);
      
      // Create a complete 12-month array with existing data
      const completeHistory: RentRecord[] = [];
      for (let month = 1; month <= 12; month++) {
        const existingRecord = data.find(record => record.month === month);
        if (existingRecord) {
          completeHistory.push(existingRecord);
        } else {
          completeHistory.push({
            unit_id: unitId,
            year,
            month,
            rent_date: '',
            amount: undefined,
            method: '',
            notes: ''
          });
        }
      }
      
      setRentHistory(completeHistory);
    } catch (error) {
      console.error('Error loading rent history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rent history.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async (month: number) => {
    const record = rentHistory.find(r => r.month === month);
    if (!record) return;

    setSaving(true);
    try {
      if (record.id) {
        // Update existing record
        await updateMonthlyRentHistory(record.id, {
          rent_date: record.rent_date || null,
          amount: record.amount || null,
          method: record.method || null,
          notes: record.notes || null,
        });
      } else if (record.amount || record.method || record.rent_date || record.notes) {
        // Create new record only if there's data
        const newRecord = await upsertMonthlyRentHistory({
          unit_id: record.unit_id,
          year: record.year,
          month: record.month,
          rent_date: record.rent_date || null,
          amount: record.amount || null,
          method: record.method || null,
          notes: record.notes || null,
        });
        
        // Update the local state with the new record ID
        setRentHistory(prev => prev.map(r => 
          r.month === month ? { ...r, id: newRecord.id } : r
        ));
      }

      setEditingRecord(null);
      toast({
        title: 'Success',
        description: 'Rent record saved successfully.',
      });
    } catch (error) {
      console.error('Error saving rent record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rent record.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (recordId: string, month: number) => {
    if (!recordId) return;

    setSaving(true);
    try {
      await deleteMonthlyRentHistory(recordId);
      
      // Reset the record in local state
      setRentHistory(prev => prev.map(r => 
        r.month === month ? { ...r, id: undefined, rent_date: '', amount: undefined, method: '', notes: '' } : r
      ));

      toast({
        title: 'Success',
        description: 'Rent record deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting rent record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete rent record.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateRecord = (month: number, field: keyof RentRecord, value: any) => {
    setRentHistory(prev => prev.map(record => 
      record.month === month ? { ...record, [field]: value } : record
    ));
  };

  const getRecordForMonth = (month: number) => {
    return rentHistory.find(r => r.month === month);
  };

  const isRecordComplete = (record: RentRecord) => {
    return record.amount && record.method && record.rent_date;
  };

  const getTotalForYear = () => {
    return rentHistory
      .filter(record => record.amount)
      .reduce((sum, record) => sum + (record.amount || 0), 0);
  };

  const getPaidMonths = () => {
    return rentHistory.filter(record => record.amount).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Rent History - {unitName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Monthly Rent History - {unitName}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4" />
            <span>Total: ${getTotalForYear().toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CreditCard className="h-4 w-4" />
            <span>Paid: {getPaidMonths()}/12 months</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTHS.map((monthName, index) => {
            const month = index + 1;
            const record = getRecordForMonth(month);
            const isEditing = editingRecord === `${year}-${month}`;
            const isComplete = record && isRecordComplete(record);

            return (
              <div key={month} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{monthName}</h3>
                  {isComplete && (
                    <Badge variant="default" className="text-xs">
                      Paid
                    </Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`date-${month}`} className="text-xs">Rent Date</Label>
                      <Input
                        id={`date-${month}`}
                        type="date"
                        value={record?.rent_date || ''}
                        onChange={(e) => updateRecord(month, 'rent_date', e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`amount-${month}`} className="text-xs">Amount</Label>
                      <Input
                        id={`amount-${month}`}
                        type="number"
                        step="0.01"
                        value={record?.amount || ''}
                        onChange={(e) => updateRecord(month, 'amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="text-xs"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`method-${month}`} className="text-xs">Method</Label>
                      <Select
                        value={record?.method || ''}
                        onValueChange={(value) => updateRecord(month, 'method', value)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`notes-${month}`} className="text-xs">Notes</Label>
                      <Textarea
                        id={`notes-${month}`}
                        value={record?.notes || ''}
                        onChange={(e) => updateRecord(month, 'notes', e.target.value)}
                        className="text-xs"
                        rows={3}
                        placeholder="Optional notes (use line breaks for multiple entries)"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveRecord(month)}
                        disabled={saving}
                        className="flex-1"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRecord(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isComplete ? (
                      <>
                        <div className="text-sm">
                          <span className="font-medium">${record?.amount?.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {record?.rent_date && new Date(record.rent_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {record?.method}
                        </div>
                        {record?.notes && (
                          <div className="text-xs text-gray-500 italic whitespace-pre-line break-words">
                            {record.notes}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No payment recorded
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRecord(`${year}-${month}`)}
                        className="flex-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {isComplete ? 'Edit' : 'Add'}
                      </Button>
                      {record?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRecord(record.id!, month)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

