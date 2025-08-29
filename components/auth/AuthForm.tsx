'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Home, Lock } from 'lucide-react';

export default function AuthForm() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(password);
      
      if (error) {
        toast({
          title: 'Access denied',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome!',
          description: 'You have successfully signed in.',
        });
        router.push('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'An error occurred',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mb-6 animate-float">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PropertyFlow</h1>
          <p className="text-gray-600 text-lg">Enter password to access the system</p>
        </div>

        <Card className="shadow-2xl border border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-gray-900 text-xl">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              Access Required
            </CardTitle>
            <CardDescription className="text-gray-600">Enter the password to access PropertyFlow</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoFocus
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full gradient-button text-white border-0 interactive-button" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Access System'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}