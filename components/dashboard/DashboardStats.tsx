'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home, Users, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { getDashboardStats } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

interface DashboardStatsProps {
  refreshTrigger?: number;
}

export default function DashboardStats({ refreshTrigger }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    totalMonthlyRent: 0,
    occupancyRate: 0,
    averageRent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const dashboardStats = await getDashboardStats(user.id);
          setStats(dashboardStats);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [refreshTrigger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties.toString(),
      icon: Building2,
      gradientClass: 'stat-card-gradient-1',
      delay: 0,
    },
    {
      title: 'Total Units',
      value: stats.totalUnits.toString(),
      icon: Home,
      gradientClass: 'stat-card-gradient-2',
      delay: 100,
    },
    {
      title: 'Occupied Units',
      value: stats.occupiedUnits.toString(),
      icon: Users,
      gradientClass: 'stat-card-gradient-3',
      delay: 200,
    },
    {
      title: 'Monthly Rent',
      value: formatCurrency(stats.totalMonthlyRent),
      icon: DollarSign,
      gradientClass: 'stat-card-gradient-4',
      delay: 300,
    },
    {
      title: 'Occupancy Rate',
      value: `${stats.occupancyRate.toFixed(1)}%`,
      icon: Percent,
      gradientClass: 'stat-card-gradient-5',
      delay: 400,
    },
    {
      title: 'Average Rent',
      value: formatCurrency(stats.averageRent),
      icon: TrendingUp,
      gradientClass: 'stat-card-gradient-6',
      delay: 500,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse glass">
            <CardHeader className="pb-3">
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-white/20 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className={`${stat.gradientClass} text-white border-0 shadow-xl`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-white/90">
                {stat.title}
              </CardTitle>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white drop-shadow-sm">{stat.value}</div>
              <div className="mt-2 text-white/80 text-sm">
                {stat.title === 'Occupancy Rate' && (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{stats.occupancyRate.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}