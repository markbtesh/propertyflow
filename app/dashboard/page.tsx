'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import PropertyList from '@/components/properties/PropertyList';
import PropertyForm from '@/components/properties/PropertyForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function DashboardPage() {
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePropertySuccess = () => {
    setShowPropertyForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateNew = () => {
    setShowPropertyForm(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your property portfolio</p>
        </div>

        <DashboardStats refreshTrigger={refreshTrigger} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <PropertyList 
            onCreateNew={handleCreateNew}
            refreshTrigger={refreshTrigger}
          />
        </div>

        <Dialog open={showPropertyForm} onOpenChange={setShowPropertyForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <PropertyForm
              onSuccess={handlePropertySuccess}
              onCancel={() => setShowPropertyForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}