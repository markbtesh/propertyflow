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
      <div className="space-y-8">
        <div className="animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">Overview of your property portfolio</p>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <DashboardStats refreshTrigger={refreshTrigger} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
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