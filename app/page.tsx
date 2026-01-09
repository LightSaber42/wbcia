import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div className="p-10 text-center">Loading dashboard...</div>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}