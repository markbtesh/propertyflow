'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PropertyList from '@/components/properties/PropertyList';
import PropertyForm from '@/components/properties/PropertyForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function PropertiesPage() {
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
      <div className="p-6">
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