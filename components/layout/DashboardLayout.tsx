'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Building2, Upload, Download, LogOut, Menu, X, Database } from 'lucide-react';
import { signOut, getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/');
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out successfully',
        description: 'You have been signed out of your account.',
      });
      router.push('/');
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center glass p-8 rounded-2xl animate-fade-in-up">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto animate-pulse-glow"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Properties', href: '/dashboard/properties', icon: Building2 },
    { name: 'Bulk Import', href: '/dashboard/import', icon: Upload },
    { name: 'Export Data', href: '/dashboard/export', icon: Download },
  ];

  const isActivePath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="lg:flex min-h-screen bg-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 gradient-sidebar shadow-2xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center animate-float">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-white">PropertyFlow</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-white/20"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 interactive-button ${
                  isActivePath(item.href)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white hover:transform hover:scale-105'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse-glow">
              <span className="text-white text-sm font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white truncate">
                {user?.email || 'User'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full border-white/30 hover:text-white hover:bg-white/10 interactive-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:w-2/3">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-lg border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">PropertyFlow</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        <main className="flex-1 p-6">
          <div className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}